'use client'

import type { Agent, Room as RoomType } from '@/types'
import AgentDesk from '@/components/agent/AgentDesk'

interface RoomProps {
  room: RoomType
  agents: Agent[]
  onAgentClick: (agent: Agent) => void
}

export default function Room({ room, agents, onAgentClick }: RoomProps) {
  return (
    <div
      className="w-screen h-full flex-shrink-0 snap-center flex flex-col items-center relative"
      style={{ background: room.bg }}
    >
      {/* Room border - top */}
      <div className="absolute top-0 left-0 right-0 h-3" style={{ background: room.color }} />

      {/* Room header */}
      <div className="mt-8 mb-6 text-center">
        <span className="text-4xl mb-2 block">{room.emoji}</span>
        <h2
          className="text-2xl font-bold tracking-widest px-6 py-2 border-4 rounded"
          style={{
            borderColor: room.color,
            background: `${room.color}33`,
            fontFamily: 'monospace',
          }}
        >
          {room.name}
        </h2>
      </div>

      {/* Agents grid */}
      <div className="flex flex-wrap justify-center gap-6 px-8 max-w-4xl">
        {agents.map(agent => (
          <AgentDesk key={agent.id} agent={agent} onClick={() => onAgentClick(agent)} />
        ))}
      </div>

      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-amber-900/30 border-t-4 border-amber-800/40" />

      {/* Wall decorations - pixel blocks */}
      <div className="absolute top-16 left-4 w-6 h-6 border-2 rounded-sm opacity-20" style={{ borderColor: room.color, background: room.color }} />
      <div className="absolute top-24 right-6 w-4 h-4 border-2 rounded-sm opacity-15" style={{ borderColor: room.color, background: room.color }} />
      <div className="absolute bottom-20 left-8 w-5 h-5 border-2 rounded-sm opacity-10" style={{ borderColor: room.color, background: room.color }} />
    </div>
  )
}
