'use client'

import { useState } from 'react'
import PixelChar from './PixelChar'
import type { Agent } from '@/types'

interface AgentDeskProps {
  agent: Agent
  roomColor: string
  isBoss?: boolean
  onClick: (e?: React.MouseEvent) => void
}

// B&W SVG icons (no emoji)
function IconMonitor({ color, working }: { color: string; working: boolean }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <rect x="0.5" y="0.5" width="17" height="11" rx="1.5" fill="#0d0d0d" stroke={color} strokeWidth="1"/>
      <rect x="3" y="2" width="12" height="7" rx="0.5" fill={color} fillOpacity={working ? 0.25 : 0.1}>
        {working && (
          <animate attributeName="fill-opacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />
        )}
      </rect>
      {/* Screen scanlines when working */}
      {working && (
        <>
          <line x1="3" y1="4" x2="15" y2="4" stroke={color} strokeOpacity="0.15" strokeWidth="0.5"/>
          <line x1="3" y1="6" x2="15" y2="6" stroke={color} strokeOpacity="0.1" strokeWidth="0.5"/>
        </>
      )}
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

// Thinking bubble dots for idle agents
function ThinkingBubble() {
  return (
    <div className="flex items-center gap-[2px] h-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-full"
          style={{
            background: 'rgba(255,255,255,0.25)',
            animation: `thinking-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function AgentDesk({ agent, roomColor, isBoss, onClick }: AgentDeskProps) {
  const isWorking = agent.status === 'working'
  const screenColor = isWorking ? roomColor : '#333'
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="flex flex-col items-center gap-0 cursor-pointer group select-none relative"
      onClick={e => onClick(e)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ minWidth: '68px' }}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute -top-[72px] left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-[9px] text-white/90 whitespace-nowrap z-[100]"
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 12px ${roomColor}10`,
          }}
        >
          <div className="font-semibold text-[10px]" style={{ color: roomColor }}>{agent.name ?? agent.id}</div>
          <div className="text-white/50 mt-0.5">{agent.role}</div>
          <div className="text-white/40 mt-0.5">{agent.current_task || 'Idle'} &middot; {agent.model}</div>
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: '#1a1a1a', borderRight: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      )}

      {/* Boss badge */}
      <div className="h-4 flex items-center justify-center mb-0.5">
        {isBoss && <IconCrown />}
      </div>

      {/* Name above */}
      <div className="text-[9px] font-semibold text-white/60 text-center leading-tight mb-1 whitespace-nowrap tracking-wide">
        {(agent.name ?? agent.id)?.split(' ')[0]?.toUpperCase()}
      </div>

      {/* Character — bob up/down when working */}
      <div
        className="transition-transform duration-200 group-hover:scale-110"
        style={{
          filter: isWorking
            ? `drop-shadow(0 0 6px ${roomColor}80)`
            : undefined,
          animation: isWorking ? 'walk-bob 0.5s ease-in-out infinite' : undefined,
        }}
      >
        <PixelChar working={isWorking} accentColor={roomColor} isBoss={isBoss} agentId={agent.id} />
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
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: isWorking ? `0 0 12px ${roomColor}15` : 'none',
        }}
      >
        {/* Monitor on desk */}
        <div>
          <IconMonitor color={screenColor} working={isWorking} />
        </div>

        {/* Working glow on desk surface */}
        {isWorking && (
          <div
            className="absolute inset-0 rounded"
            style={{
              background: `radial-gradient(ellipse at center, ${roomColor}18 0%, transparent 70%)`,
              animation: 'work-glow 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Role text or thinking bubble */}
      <div className="flex items-center justify-center mt-1 h-3" style={{ maxWidth: '64px' }}>
        {!isWorking ? (
          <ThinkingBubble />
        ) : (
          <div className="text-[8px] text-white/25 text-center leading-tight truncate" style={{ maxWidth: '64px' }}>
            {agent.role}
          </div>
        )}
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
