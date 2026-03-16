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
  /Pages active/ {active=$3}
  /Pages wired/ {wired=$4}
  /Pages free/ {free=$3}
  /Pages inactive/ {inactive=$3}
  END {
    used=(active+wired)*4096/1073741824
    total=(active+wired+free+inactive)*4096/1073741824
    printf "%.1f %.0f", used, total
  }
')
RAM_USED=$(echo "$RAM_INFO" | awk '{print $1}')
RAM_TOTAL=$(echo "$RAM_INFO" | awk '{print $2}')
RAM_PERCENT=$(echo "$RAM_USED $RAM_TOTAL" | awk '{printf "%.1f", ($1/$2)*100}')
DISK_PERCENT=$(df -H / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
BOOT_TIME=$(/usr/sbin/sysctl -n kern.boottime | sed 's/.*sec = \([0-9]*\).*/\1/')
UPTIME_SECONDS=$(( $(date +%s) - BOOT_TIME ))

# Check agent processes
AGENTS_JSON="["
FIRST=true
for AGENT_ID in miron backend frontend designer data analyst scraper qa security devops growth content ig-oracle artem pm; do
  PID=$(pgrep -f "claude.*--profile.*${AGENT_ID}" 2>/dev/null | head -1 || echo "")
  if [ -n "$PID" ]; then
    STATUS="working"
    TASK=$(ps -p "$PID" -o command= 2>/dev/null | head -c 100 || echo "")
  else
    STATUS="idle"
    PID="null"
    TASK="null"
  fi

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    AGENTS_JSON+=","
  fi

  if [ "$PID" = "null" ]; then
    AGENTS_JSON+="{\"agent_id\":\"${AGENT_ID}\",\"status\":\"${STATUS}\",\"pid\":null,\"current_task\":null}"
  else
    TASK_ESCAPED=$(echo "$TASK" | sed 's/"/\\"/g' | head -c 100)
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

SERVICES_JSON="[{\"service_id\":\"userbot\",\"status\":\"${USERBOT_STATUS}\"},{\"service_id\":\"gateway\",\"status\":\"${GATEWAY_STATUS}\",\"details\":{\"claude_processes\":${CLAUDE_PROCESSES}}}]"

# Build payload
PAYLOAD=$(cat <<EOF
{
  "system": {
    "cpu_percent": ${CPU_PERCENT},
    "ram_percent": ${RAM_PERCENT},
    "ram_used_gb": ${RAM_USED},
    "ram_total_gb": ${RAM_TOTAL},
    "disk_percent": ${DISK_PERCENT},
    "uptime_seconds": ${UPTIME_SECONDS}
  },
  "agents": ${AGENTS_JSON},
  "services": ${SERVICES_JSON}
}
EOF
)

# Send to collector endpoint
curl -s -X POST "${COLLECTOR_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${COLLECTOR_SECRET}" \
  -d "${PAYLOAD}" || echo "Failed to send metrics"
