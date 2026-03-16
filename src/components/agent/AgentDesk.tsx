'use client'

import PixelChar from './PixelChar'
import type { Agent } from '@/types'

interface AgentDeskProps {
  agent: Agent
  roomColor: string
  isBoss?: boolean
  onClick: (e?: React.MouseEvent) => void
}

// B&W SVG icons (no emoji)
function IconMonitor({ color }: { color: string }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <rect x="0.5" y="0.5" width="17" height="11" rx="1.5" fill="#0d0d0d" stroke={color} strokeWidth="1"/>
      <rect x="3" y="2" width="12" height="7" rx="0.5" fill={color} fillOpacity="0.15"/>
      <rect x="7" y="11" width="4" height="2" fill={color} fillOpacity="0.5"/>
      <rect x="5" y="13" width="8" height="1" fill={color} fillOpacity="0.4"/>
    </svg>
  )
}

function IconCrown() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path d="M1 9L2.5 3L5.5 6L7 1L8.5 6L11.5 3L13 9H1Z" fill="#facc15" fillOpacity="0.9"/>
      <rect x="1" y="8.5" width="12" height="1.5" fill="#facc15" fillOpacity="0.6"/>
    </svg>
  )
}

export default function AgentDesk({ agent, roomColor, isBoss, onClick }: AgentDeskProps) {
  const isWorking = agent.status === 'working'
  const screenColor = isWorking ? roomColor : '#333'

  return (
    <div
      className="flex flex-col items-center gap-0 cursor-pointer group select-none"
      onClick={e => onClick(e)}
      style={{ minWidth: '68px' }}
    >
      {/* Boss badge */}
      <div className="h-4 flex items-center justify-center mb-0.5">
        {isBoss && <IconCrown />}
      </div>

      {/* Name above */}
      <div className="text-[9px] font-semibold text-white/60 text-center leading-tight mb-1 whitespace-nowrap tracking-wide">
        {agent.name.split(' ')[0].toUpperCase()}
      </div>

      {/* Character */}
      <div
        className="transition-transform group-hover:scale-110"
        style={{ filter: isWorking ? `drop-shadow(0 0 4px ${roomColor}60)` : undefined }}
      >
        <PixelChar working={isWorking} accentColor={roomColor} isBoss={isBoss} />
      </div>

      {/* Desk */}
      <div
        className="relative flex items-center justify-center rounded"
        style={{
          width: '58px',
          height: '22px',
          background: '#141414',
          border: `1px solid ${isWorking ? roomColor + '40' : 'rgba(255,255,255,0.07)'}`,
          marginTop: '-2px',
        }}
      >
        {/* Monitor on desk */}
        <div style={{ animation: isWorking ? 'screen-flicker 2s infinite' : undefined }}>
          <IconMonitor color={screenColor} />
        </div>

        {/* Working glow on desk surface */}
        {isWorking && (
          <div
            className="absolute inset-0 rounded"
            style={{
              background: `radial-gradient(ellipse at center, ${roomColor}12 0%, transparent 70%)`,
              animation: 'work-glow 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Role text */}
      <div className="text-[8px] text-white/25 text-center mt-1 leading-tight" style={{ maxWidth: '64px' }}>
        {agent.role}
      </div>

      {/* Status dot */}
      <div className="mt-1 flex items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: isWorking ? '#4ade80' : '#2a2a2a',
            border: `1px solid ${isWorking ? '#4ade8040' : '#333'}`,
            animation: isWorking ? 'pulse-dot 2s infinite' : undefined,
          }}
        />
        <span className="text-[8px]" style={{ color: isWorking ? '#4ade8080' : '#333' }}>
          {isWorking ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  )
}
