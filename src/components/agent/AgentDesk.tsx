'use client'

import type { Agent } from '@/types'

interface AgentDeskProps {
  agent: Agent
  onClick: () => void
}

export default function AgentDesk({ agent, onClick }: AgentDeskProps) {
  const status = agent.status || 'idle'
  const isWorking = status === 'working'

  return (
    <div className="relative w-40 h-52 cursor-pointer group" onClick={onClick}>
      {/* Status badge */}
      <div className={`absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap z-10 ${
        isWorking ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
      }`}
        style={{ animation: isWorking ? 'pulse-green 2s infinite' : undefined }}>
        {isWorking ? '⚡ ПРАЦЮЄ' : '💤 БАЙДИКУЄ'}
      </div>

      {/* Name tag */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-gray-900/80 px-2 py-0.5 rounded whitespace-nowrap z-10">
        {agent.name}
      </div>

      {/* Monitor */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-24 h-16 bg-gray-800 border-4 border-gray-600 rounded"
        style={{ imageRendering: 'pixelated' }}>
        <div className={`w-full h-full rounded flex items-center justify-center text-2xl ${
          isWorking ? 'bg-green-900/80' : 'bg-gray-900'
        }`}
          style={{ animation: isWorking ? 'typing 1.5s infinite' : undefined }}>
          {isWorking ? '💻' : '😴'}
        </div>
      </div>
      {/* Monitor stand */}
      <div className="absolute top-[7.5rem] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-600" />

      {/* Character */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2"
        style={{ animation: isWorking ? 'working 1.5s ease-in-out infinite' : 'idle 3s ease-in-out infinite' }}>
        {/* Head */}
        <div className="w-10 h-10 bg-amber-400 border-2 border-amber-600 rounded flex items-center justify-center text-lg"
          style={{ animation: 'blink 4s infinite' }}>
          {agent.emoji}
        </div>
        {/* Body */}
        <div className={`w-8 h-6 border-2 rounded mx-auto mt-0.5 ${
          isWorking ? 'bg-blue-600 border-blue-800' : 'bg-gray-600 border-gray-700'
        }`} />
        {/* Legs */}
        <div className="flex justify-center gap-1 mt-0.5">
          <div className="w-3 h-3 bg-gray-800 border border-gray-900 rounded-sm" />
          <div className="w-3 h-3 bg-gray-800 border border-gray-900 rounded-sm" />
        </div>
      </div>

      {/* Desk surface */}
      <div className="absolute bottom-8 left-0 right-0 h-5 bg-amber-800 border-t-4 border-amber-600"
        style={{ imageRendering: 'pixelated' }} />
      {/* Desk legs */}
      <div className="absolute bottom-0 left-3 w-3 h-8 bg-amber-900" />
      <div className="absolute bottom-0 right-3 w-3 h-8 bg-amber-900" />

      {/* Hover glow */}
      <div className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: '0 0 20px rgba(255,255,255,0.1)' }} />
    </div>
  )
}
