import useSWR from 'swr'
import type { ServiceStatus } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useServices() {
  const { data, error } = useSWR<ServiceStatus[]>('/api/services', fetcher, {
    refreshInterval: 30000,
  })
  return { services: data || [], error }
}
