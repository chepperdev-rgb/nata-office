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

export type TaskStatus = 'planning' | 'in_progress' | 'done' | 'deleted'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: number
  assigned_to: string | null
  project: string | null
  created_by: string
  moved_by: string | null
  position: number
  created_at: string
  updated_at: string
}
