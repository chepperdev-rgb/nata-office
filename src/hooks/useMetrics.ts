import useSWR from 'swr'
import type { SystemMetrics } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMetrics() {
  const { data, error } = useSWR<SystemMetrics>('/api/metrics', fetcher, {
    refreshInterval: 30000,
  })
  return { metrics: data, error }
}
