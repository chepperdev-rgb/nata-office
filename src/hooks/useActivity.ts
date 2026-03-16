import useSWR from 'swr'
import type { ActivityLog } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useActivity() {
  const { data, error } = useSWR<ActivityLog[]>('/api/activity', fetcher, {
    refreshInterval: 30000,
  })
  return { activity: data || [], error }
}
