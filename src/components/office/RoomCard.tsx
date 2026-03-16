'use client'

import AgentDesk from '@/components/agent/AgentDesk'
import type { Agent, Room } from '@/types'

// Room icons — clean SVG, no emoji
function RoomIcon({ roomId, color }: { roomId: string; color: string }) {
  const c = color
  const icons: Record<string, React.ReactNode> = {
    dev: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <polyline points="4,5 1,8 4,11" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="12,5 15,8 12,11" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="9.5" y1="2" x2="6.5" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    data: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <ellipse cx="8" cy="4" rx="6" ry="2.5" stroke={c} strokeWidth="1.5"/>
        <path d="M2 4v4c0 1.38 2.69 2.5 6 2.5S14 9.38 14 8V4" stroke={c} strokeWidth="1.5"/>
        <path d="M2 8v4c0 1.38 2.69 2.5 6 2.5S14 13.38 14 12V8" stroke={c} strokeWidth="1.5"/>
      </svg>
    ),
    quality: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L9.8 5.2L14 5.8L11 8.7L11.6 13L8 11L4.4 13L5 8.7L2 5.8L6.2 5.2L8 1.5Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    ops: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke={c} strokeWidth="1.5"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    social: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="4" cy="8" r="2" stroke={c} strokeWidth="1.5"/>
        <circle cx="12" cy="4" r="2" stroke={c} strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="2" stroke={c} strokeWidth="1.5"/>
        <line x1="6" y1="7" x2="10" y2="5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6" y1="9" x2="10" y2="11" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    research: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4" stroke={c} strokeWidth="1.5"/>
        <line x1="9.5" y1="9.5" x2="14" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  }
  return <>{icons[roomId] ?? icons.dev}</>
}

const ROOM_BOSS: Record<string, string> = {
  dev: 'miron',
  data: 'data',
  quality: 'qa',
  ops: 'devops',
  social: 'content',
  research: 'artem',
}

interface RoomCardProps {
  room: Room
  agents: Agent[]
  onAgentClick: (agent: Agent) => void
}

export default function RoomCard({ room, agents, onAgentClick }: RoomCardProps) {
  const activeCount = agents.filter(a => a.status === 'working').length
  const bossId = ROOM_BOSS[room.id]

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#0d0d0d',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${room.color}70, transparent)` }}
      />

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RoomIcon roomId={room.id} color={room.color} />
          <h3
            className="text-[10px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {room.name}
          </h3>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: activeCount > 0 ? '#4ade80' : '#252525',
              animation: activeCount > 0 ? 'pulse-dot 2s infinite' : undefined,
            }}
          />
          <span className="text-[9px]" style={{ color: activeCount > 0 ? '#4ade8066' : '#333' }}>
            {activeCount}&nbsp;<span style={{ color: '#2a2a2a' }}>/&nbsp;{agents.length}</span>
          </span>
        </div>
      </div>

      {/* Floor */}
      <div
        className="mx-3 mb-3 rounded-xl floor-grid relative overflow-hidden"
        style={{
          background: '#070707',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: '16px 10px 14px',
        }}
      >
        {/* Floor accent glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: `linear-gradient(0deg, ${room.color}08, transparent)` }}
        />

        <div className="flex gap-3 justify-center flex-wrap relative z-10">
          {agents.map(agent => (
            <AgentDesk
              key={agent.id}
              agent={agent}
              roomColor={room.color}
              isBoss={agent.id === bossId}
              onClick={() => onAgentClick(agent)}
            />
          ))}
          {agents.length === 0 && (
            <span className="text-[10px] py-4" style={{ color: '#2a2a2a' }}>No agents assigned</span>
          )}
        </div>
      </div>
    </div>
  )
}
