export type AgentStatus = 'working' | 'idle'

export interface Agent {
  id: string
  name: string
  role: string
  model: string
  room: string
  emoji: string
  status?: AgentStatus
  current_task?: string | null
  last_active?: string | null
}

export interface Room {
  id: string
  name: string
  color: string
  bg: string
  emoji: string
}

export interface SystemMetrics {
  cpu_percent: number
  cpu_cores?: number
  ram_percent: number
  ram_used_gb: number
  ram_total_gb: number
  disk_percent: number
  uptime_seconds: number
  updated_at: string
}

export interface NatalyProcess {
  name: string
  pid: number
  cpu: string
  mem: string
  since: string
}

export interface ServiceStatus {
  service_id: string
  display_name: string
  status: 'running' | 'down' | 'error' | 'unknown'
  details?: { processes?: NatalyProcess[]; claude_processes?: number } | null
  updated_at: string
}

export interface ActivityLog {
  id: number
  agent_id: string
  action: string
  created_at: string
}
