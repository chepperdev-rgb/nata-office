import useSWR from 'swr'

export interface Thought {
  id: string
  agent_id: string
  action: string
  status: string // 'thought' | 'action' | 'error' | 'done'
  created_at: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useThoughts() {
  const { data, error } = useSWR<Thought[]>('/api/nataly-thought', fetcher, {
    refreshInterval: 5000,
  })
  return { thoughts: data || [], error }
}
