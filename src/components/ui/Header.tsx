'use client'

import { useState, useEffect } from 'react'

interface HeaderProps {
  onToggleDashboard: () => void
  dashboardOpen: boolean
}

export default function Header({ onToggleDashboard, dashboardOpen }: HeaderProps) {
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 border-b-4 border-gray-700 flex items-center justify-between px-6"
      style={{ imageRendering: 'pixelated' }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏢</span>
        <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'monospace' }}>
          NATALY OFFICE
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-mono text-green-400">{time}</span>
        <button
          onClick={onToggleDashboard}
          className={`px-4 py-1.5 font-bold text-sm tracking-wider border-2 transition-colors ${
            dashboardOpen
              ? 'bg-yellow-500 border-yellow-400 text-black'
              : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
          }`}
        >
          DASHBOARD
        </button>
      </div>
    </header>
  )
}
