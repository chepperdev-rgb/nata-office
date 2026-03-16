'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import useSWR from 'swr'

export interface ProcessLine {
  id: string
  time: string
  agent: string
  action: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const MOCK_ACTIONS = [
  'analyzing codebase',
  'api endpoints check',
  'metrics collected',
  'running tests',
  'deploying service',
  'reviewing PR',
  'scanning dependencies',
  'generating report',
  'indexing data',
  'health check passed',
  'cache invalidated',
  'schema migration',
  'building assets',
  'monitoring alerts',
  'backup completed',
]

const MOCK_AGENTS = [
  'miron', 'backend', 'frontend', 'designer', 'data',
  'analyst', 'scraper', 'qa', 'security', 'devops',
  'growth', 'content', 'ig-oracle', 'artem', 'pm',
]

export function useProcesses() {
  const { data } = useSWR<ProcessLine[]>('/api/processes', fetcher, {
    refreshInterval: 5000,
  })

  const [lines, setLines] = useState<ProcessLine[]>([])
  const counterRef = useRef(0)
  const isMockMode = !data || data.length === 0 || data[0]?.id?.startsWith('mock-')

  // Seed from fetched data
  useEffect(() => {
    if (data && data.length > 0) {
      setLines(data)
    }
  }, [data])

  // Generate live mock lines if in mock mode
  const generateMock = useCallback(() => {
    const now = new Date()
    const line: ProcessLine = {
      id: `live-${Date.now()}-${counterRef.current++}`,
      time: now.toTimeString().slice(0, 8),
      agent: MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)],
      action: MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)],
    }
    setLines(prev => [...prev.slice(-30), line])
  }, [])

  useEffect(() => {
    if (!isMockMode) return
    const delay = 3000 + Math.random() * 2000
    const timer = setInterval(generateMock, delay)
    return () => clearInterval(timer)
  }, [isMockMode, generateMock])

  return { lines }
}
