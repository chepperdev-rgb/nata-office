'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

export interface ProcessLine {
  id: string
  time: string
  agent: string
  action: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useProcesses() {
  const { data } = useSWR<ProcessLine[]>('/api/processes', fetcher, {
    refreshInterval: 10000,
  })

  const [lines, setLines] = useState<ProcessLine[]>([])

  useEffect(() => {
    if (data && data.length > 0) {
      setLines(data)
    }
  }, [data])

  return { lines }
}
