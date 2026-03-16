import useSWR from 'swr'

interface NataliStatus {
  status: 'online' | 'degraded' | 'error' | 'offline'
  gateway: string
  userbot: string
  claude_processes: number | null
  last_seen: string | null
  collector_alive: boolean
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useNataliStatus() {
  const { data, error } = useSWR<NataliStatus>('/api/natali-status', fetcher, {
    refreshInterval: 15000,
    fallbackData: {
      status: 'offline',
      gateway: 'unknown',
      userbot: 'unknown',
      claude_processes: null,
      last_seen: null,
      collector_alive: false,
    },
  })
  return { natali: data!, error }
}
