'use client'

import useSWR from 'swr'

interface AgentSession {
  id: number
  session_id: string
  agent_id: string
  task_summary: string | null
  model: string
  tokens_in: number
  tokens_out: number
  tokens_total: number
  status: string
  started_at: string
  finished_at: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useAgentHistory(agentId?: string, period = 'week', limit = 20) {
  const params = new URLSearchParams({ period, limit: String(limit) })
  if (agentId) params.set('agent_id', agentId)

  const { data, error } = useSWR<AgentSession[]>(
    `/api/agent-history?${params}`,
    fetcher,
    { refreshInterval: 30000, fallbackData: [] }
  )

  return { sessions: data || [], error }
}
