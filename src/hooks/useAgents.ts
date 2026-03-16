import useSWR from 'swr'
import { STATIC_AGENTS } from '@/lib/constants'
import type { Agent } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const fallback: Agent[] = STATIC_AGENTS.map(a => ({ ...a, status: 'idle' as const }))

export function useAgents() {
  const { data, error } = useSWR<Agent[]>('/api/agents', fetcher, {
    refreshInterval: 30000,
    fallbackData: fallback,
  })
  return { agents: data || fallback, error }
}
