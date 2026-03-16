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

  // System health: green >50% active, yellow >0, red = 0
  const healthColor = workingCount > totalCount / 2 ? '#4ade80' : workingCount > 0 ? '#f59e0b' : '#ef4444'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
      style={{
        background: 'rgba(8, 8, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)',
        }}
      />

      <div className="flex items-center gap-3 relative z-10">
        {/* Logo with system health indicator */}
        <div className="relative">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#6366f1',
            }}
          >
            N
          </div>
          {/* Health dot */}
          <div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{
              background: healthColor,
              boxShadow: `0 0 6px ${healthColor}80`,
              animation: 'pulse-dot 2s infinite',
            }}
          />
        </div>

        {/* Animated gradient title */}
        <h1
          className="text-sm font-bold tracking-[0.15em] uppercase"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradient-shift 4s linear infinite',
          }}
        >
          Nataly Office
        </h1>

        <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: workingCount > 0 ? '#4ade80' : '#555',
              animation: workingCount > 0 ? 'pulse-dot 2s infinite' : undefined,
            }}
          />
          <span className="text-xs text-white/60 font-mono">
            {workingCount}/{totalCount}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-xs text-white/30 font-mono hidden sm:block tracking-wider">{time}</span>
        <button
          onClick={onToggleDashboard}
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
          style={{
            background: dashboardOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${dashboardOpen ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: dashboardOpen ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
            boxShadow: dashboardOpen ? '0 0 16px rgba(99, 102, 241, 0.15)' : 'none',
          }}
        >
          Dashboard
        </button>
      </div>
    </header>
  )
}
