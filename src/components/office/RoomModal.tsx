'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/lib/icons'
import type { Agent, Room } from '@/types'

interface RoomModalProps {
  room: Room | null
  agents: Agent[]
  onClose: () => void
  onAgentClick: (agent: Agent) => void
}

export default function RoomModal({ room, agents, onClose, onAgentClick }: RoomModalProps) {
  if (!room) return null

  const activeCount = agents.filter(a => a.status === 'working').length

  return (
    <AnimatePresence>
      {room && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-3xl mx-4 overflow-hidden"
            style={{
              background: '#111111',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent */}
            <div className="h-[2px]" style={{ background: room.color }} />

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <Icon name={room.icon} size={24} color={room.color} />
                <div>
                  <h2 className="text-lg font-semibold">{room.name}</h2>
                  <p className="text-xs text-white/40">{activeCount} of {agents.length} agents active</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Room floor */}
            <div
              className="m-4 rounded-2xl dot-grid-lg relative"
              style={{
                background: room.bg,
                border: '1px solid rgba(255,255,255,0.06)',
                minHeight: '200px',
                padding: '16px',
              }}
            >
              <div
                className="grid gap-6 sm:gap-8 justify-items-center"
                style={{ gridTemplateColumns: `repeat(${Math.min(agents.length, 2)}, 1fr)` }}
              >
                {agents.map(agent => {
                  const isWorking = agent.status === 'working'
                  return (
                    <div
                      key={agent.id}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                      onClick={() => onAgentClick(agent)}
                    >
                      {/* Agent name above */}
                      <div className="text-xs font-medium text-white/70 group-hover:text-white/90 transition-colors">
                        {agent.name}
                      </div>

                      {/* Agent emoji circle */}
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative transition-all group-hover:scale-110"
                        style={{
                          background: `${room.color}15`,
                          border: `2px solid ${isWorking ? room.color + '80' : 'rgba(255,255,255,0.1)'}`,
                          animation: isWorking ? 'float 2s ease-in-out infinite' : undefined,
                        }}
                      >
                        <Icon name={agent.icon} size={24} color={room.color} />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                          style={{
                            background: isWorking ? '#4ade80' : '#333',
                            borderColor: room.bg,
                            animation: isWorking ? 'pulse-dot 2s infinite' : undefined,
                          }}
                        />
                      </div>

                      {/* Desk */}
                      <div
                        className="w-20 h-10 rounded-xl flex items-center justify-center relative"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {/* Monitor */}
                        <div
                          className="w-8 h-5 rounded-md"
                          style={{
                            background: isWorking ? room.color + '50' : 'rgba(255,255,255,0.06)',
                            boxShadow: isWorking ? `0 0 12px ${room.color}30` : undefined,
                            animation: isWorking ? 'typing 1.5s infinite' : undefined,
                          }}
                        />
                      </div>

                      {/* Role below desk */}
                      <div className="text-[10px] text-white/30">{agent.role}</div>

                      {/* Status label */}
                      <div
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: isWorking ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.04)',
                          color: isWorking ? '#4ade80' : '#555',
                          border: `1px solid ${isWorking ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {isWorking ? 'WORKING' : 'IDLE'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
