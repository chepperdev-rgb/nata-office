'use client'

import { useState, useEffect } from 'react'

interface HeaderProps {
  onToggleDashboard: () => void
  dashboardOpen: boolean
  workingCount: number
  totalCount: number
}

export default function Header({ onToggleDashboard, dashboardOpen, workingCount, totalCount }: HeaderProps) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          N
        </div>
        <h1 className="text-sm font-semibold tracking-wide text-white/90">
          Nataly Office
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: workingCount > 0 ? '#4ade80' : '#555',
              animation: workingCount > 0 ? 'pulse-dot 2s infinite' : undefined,
            }}
          />
          <span className="text-xs text-white/60">
            {workingCount}/{totalCount} active
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40 font-mono hidden sm:block">{time}</span>
        <button
          onClick={onToggleDashboard}
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{
            background: dashboardOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: dashboardOpen ? '#fff' : 'rgba(255,255,255,0.6)',
          }}
        >
          Dashboard
        </button>
      </div>
    </header>
  )
}
