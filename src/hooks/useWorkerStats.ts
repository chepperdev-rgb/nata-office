'use client'

import useSWR from 'swr'

interface AgentStats {
  agent_id: string
  total_sessions: number
  total_tokens: number
  total_tokens_in: number
  total_tokens_out: number
  completed: number
  errors: number
}

interface WorkerStatsResponse {
  period: string
  since: string
  natali: AgentStats | null
  worker_of_period: AgentStats | null
  leaderboard: AgentStats[]
  total_sessions: number
  total_tokens: number
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useWorkerStats(period = 'today') {
  const { data, error } = useSWR<WorkerStatsResponse>(
    `/api/worker-stats?period=${period}`,
    fetcher,
    { refreshInterval: 60000, fallbackData: { period, since: '', natali: null, worker_of_period: null, leaderboard: [], total_sessions: 0, total_tokens: 0 } }
  )

  return { stats: data!, error }
}
