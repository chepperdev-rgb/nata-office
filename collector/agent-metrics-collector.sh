#!/usr/bin/env bash
# Agent Metrics Collector for Mac Studio
# Collects system metrics, agent statuses, and service health
# Run via cron every 30 seconds

set -euo pipefail

COLLECTOR_ENDPOINT="${COLLECTOR_ENDPOINT:-http://localhost:3000/api/collector}"
COLLECTOR_SECRET="${COLLECTOR_SECRET:-nataly-collector-2026}"

# System metrics
CPU_PERCENT=$(ps -A -o %cpu | awk '{s+=$1} END {printf "%.1f", s}')
RAM_INFO=$(vm_stat | awk '
  /page size of ([0-9]+) bytes/ {page=$8+0}
  /Pages active/ {active=$3+0}
  /Pages wired/ {wired=$4+0}
  /Pages free/ {free=$3+0}
  /Pages inactive/ {inactive=$3+0}
  /Pages speculative/ {spec=$3+0}
  /Pages purgeable/ {purgeable=$3+0}
  END {
    if (page==0) page=16384
    used=(active+wired)*page/1073741824
    total=(active+wired+free+inactive+spec+purgeable)*page/1073741824
    # Clamp to known hardware sizes
    if (total < 30) total=32
    printf "%.1f %.0f", used, total
  }
')
RAM_USED=$(echo "$RAM_INFO" | awk '{print $1}')
RAM_TOTAL=$(echo "$RAM_INFO" | awk '{print $2}')
RAM_PERCENT=$(echo "$RAM_USED $RAM_TOTAL" | awk '{printf "%.1f", ($1/$2)*100}')
DISK_PERCENT=$(df -H / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
BOOT_TIME=$(/usr/sbin/sysctl -n kern.boottime | sed 's/.*sec = \([0-9]*\).*/\1/')
UPTIME_SECONDS=$(( $(date +%s) - BOOT_TIME ))
CPU_CORES=$(python3 -c "import os; print(os.cpu_count())" 2>/dev/null || echo "12")

# Check agent processes
# Detect working agents via:
# 1. Launcher log files: ~/tasks/{agent}/running
# 2. Checking if agent task file is recent (< 5 min old)
# 3. Looking for "Use @agent_id:" in running claude args (best effort)
AGENTS_JSON="["
FIRST=true
NOW_TS=$(date +%s)

for AGENT_ID in miron backend frontend designer data analyst scraper qa security devops growth content ig-oracle artem pm; do
  STATUS="idle"
  PID="null"
  TASK="null"

  # Method 1: Check task lock/running file
  RUNNING_FILE="${HOME}/tasks/${AGENT_ID}/running"
  TASK_FILE="${HOME}/tasks/${AGENT_ID}/current_task.txt"
  if [ -f "$RUNNING_FILE" ]; then
    FILE_TS=$(stat -f %m "$RUNNING_FILE" 2>/dev/null || echo "0")
    AGE=$(( NOW_TS - FILE_TS ))
    if [ "$AGE" -lt 300 ]; then   # fresh within 5 min
      STATUS="working"
      if [ -f "$TASK_FILE" ]; then
        TASK=$(head -c 80 "$TASK_FILE" 2>/dev/null || echo "running task")
      else
        TASK="running task"
      fi
    fi
  fi

  # Method 2: grep claude args for "@agent_id:" (works if prompt is in cmdline)
  if [ "$STATUS" = "idle" ]; then
    MATCH_PID=$(pgrep -f "@${AGENT_ID}" 2>/dev/null | head -1 || echo "")
    if [ -z "$MATCH_PID" ]; then
      MATCH_PID=$(pgrep -f "claude.*${AGENT_ID}" 2>/dev/null | head -1 || echo "")
    fi
    if [ -n "$MATCH_PID" ]; then
      STATUS="working"
      PID="$MATCH_PID"
      TASK=$(ps -p "$MATCH_PID" -o command= 2>/dev/null | sed 's/"/\\"/g' | head -c 80 || echo "active")
    fi
  fi

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    AGENTS_JSON+=","
  fi

  TASK_ESCAPED=$(echo "${TASK}" | sed 's/"/\\"/g' | head -c 80)
  if [ "$PID" = "null" ]; then
    if [ "$TASK" = "null" ]; then
      AGENTS_JSON+="{\"agent_id\":\"${AGENT_ID}\",\"status\":\"${STATUS}\",\"pid\":null,\"current_task\":null}"
    else
      AGENTS_JSON+="{\"agent_id\":\"${AGENT_ID}\",\"status\":\"${STATUS}\",\"pid\":null,\"current_task\":\"${TASK_ESCAPED}\"}"
    fi
  else
    AGENTS_JSON+="{\"agent_id\":\"${AGENT_ID}\",\"status\":\"${STATUS}\",\"pid\":${PID},\"current_task\":\"${TASK_ESCAPED}\"}"
  fi
done
AGENTS_JSON+="]"

# Check services
USERBOT_STATUS="down"
if pgrep -f "natali-userbot" > /dev/null 2>&1; then
  USERBOT_STATUS="running"
fi

GATEWAY_STATUS="down"
if pgrep -f "openclaw-gateway" > /dev/null 2>&1; then
  GATEWAY_STATUS="running"
fi

# Count Claude processes (active AI agents)
CLAUDE_PROCESSES=$(pgrep -c -f "claude" 2>/dev/null || echo "0")

# Collect Nataly-related processes for the "Nataly Processes" panel
NATALY_PROCS_JSON="["
NATALY_FIRST=true

add_proc() {
  local NAME="$1"; local CMD="$2"
  local PID=$(pgrep -f "$CMD" 2>/dev/null | head -1)
  [ -z "$PID" ] && return
  local MEM=$(ps -p "$PID" -o rss= 2>/dev/null | awk '{printf "%.0fMB", $1/1024}' || echo "?")
  local CPU=$(ps -p "$PID" -o %cpu= 2>/dev/null | tr -d ' ' || echo "?")
  local START=$(ps -p "$PID" -o lstart= 2>/dev/null | awk '{print $4}' || echo "?")
  [ "$NATALY_FIRST" = false ] && NATALY_PROCS_JSON+=","
  NATALY_PROCS_JSON+="{\"name\":\"${NAME}\",\"pid\":${PID},\"cpu\":\"${CPU}%\",\"mem\":\"${MEM}\",\"since\":\"${START}\"}"
  NATALY_FIRST=false
}

add_proc "Userbot"          "natali-userbot"
add_proc "Gateway"          "openclaw-gateway"
add_proc "Claude CLI"       "claude"
add_proc "Voice Pipeline"   "voice-pipeline"
add_proc "Watchdog"         "natali-watchdog\|openclaw-watchdog"
add_proc "Python (scripts)" "python.*agent\|python.*natali"
add_proc "Node (openclaw)"  "node.*openclaw"

NATALY_PROCS_JSON+="]"

SERVICES_JSON="[{\"service_id\":\"userbot\",\"status\":\"${USERBOT_STATUS}\"},{\"service_id\":\"gateway\",\"status\":\"${GATEWAY_STATUS}\",\"details\":{\"claude_processes\":${CLAUDE_PROCESSES}}}]"

# Build activity log entries for working agents
ACTIVITY_JSON="["
FIRST_ACT=true
for AGENT_ID in miron backend frontend designer data analyst scraper qa security devops growth content artem pm; do
  TASK_FILE="${HOME}/tasks/${AGENT_ID}/current_task.txt"
  RUNNING_FILE="${HOME}/tasks/${AGENT_ID}/running"
  if [ -f "$RUNNING_FILE" ]; then
    FILE_TS=$(stat -f %m "$RUNNING_FILE" 2>/dev/null || echo "0")
    AGE=$(( NOW_TS - FILE_TS ))
    if [ "$AGE" -lt 300 ]; then
      [ "$FIRST_ACT" = false ] && ACTIVITY_JSON+=","
      if [ -f "$TASK_FILE" ]; then
        TASK=$(head -c 60 "$TASK_FILE" 2>/dev/null || echo "working on task")
      else
        TASK="running task"
      fi
      TASK_ESCAPED=$(echo "$TASK" | sed 's/"/\\"/g')
      ACTIVITY_JSON+="{\"agent_id\":\"${AGENT_ID}\",\"action\":\"${TASK_ESCAPED}\"}"
      FIRST_ACT=false
    fi
  fi
done
ACTIVITY_JSON+="]"

# Build payload
PAYLOAD=$(cat <<EOF
{
  "system": {
    "cpu_percent": ${CPU_PERCENT},
    "cpu_cores": ${CPU_CORES},
    "ram_percent": ${RAM_PERCENT},
    "ram_used_gb": ${RAM_USED},
    "ram_total_gb": ${RAM_TOTAL},
    "disk_percent": ${DISK_PERCENT},
    "uptime_seconds": ${UPTIME_SECONDS}
  },
  "agents": ${AGENTS_JSON},
  "services": ${SERVICES_JSON},
  "nataly_processes": ${NATALY_PROCS_JSON},
  "activity": ${ACTIVITY_JSON}
}
EOF
)

# Send to collector endpoint
curl -s -X POST "${COLLECTOR_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${COLLECTOR_SECRET}" \
  -d "${PAYLOAD}" || echo "Failed to send metrics"
