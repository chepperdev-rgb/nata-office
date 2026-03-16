'use client'

import { motion, AnimatePresence } from 'framer-motion'
import PixelChar from './PixelChar'
import type { Agent } from '@/types'

interface AgentPopupProps {
  agent: Agent | null
  roomColor?: string
  onClose: () => void
}

// Map agent id → room color (fallback to white)
const AGENT_ROOM_COLORS: Record<string, string> = {
  miron: '#6366f1', backend: '#6366f1', frontend: '#6366f1', designer: '#6366f1',
  data: '#06b6d4', analyst: '#06b6d4', scraper: '#06b6d4',
  qa: '#f43f5e', security: '#f43f5e',
  devops: '#f59e0b', growth: '#f59e0b',
  content: '#ec4899', 'ig-oracle': '#ec4899',
  artem: '#8b5cf6', pm: '#8b5cf6',
}

const BOSS_IDS = new Set(['miron', 'data', 'qa', 'devops', 'content', 'artem'])

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-[11px]" style={{ color: '#555' }}>{label}</span>
      <span className="text-[11px] font-medium" style={{ color: highlight ? '#f0f0f0' : '#888' }}>{value}</span>
    </div>
  )
}

export default function AgentPopup({ agent, onClose }: AgentPopupProps) {
  if (!agent) return null
  const isWorking = agent.status === 'working'
  const isOpus = agent.model === 'opus'
  const isBoss = BOSS_IDS.has(agent.id)
  const color = AGENT_ROOM_COLORS[agent.id] || '#888'

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          <motion.div
            className="relative w-full sm:max-w-sm overflow-hidden"
            style={{
              background: '#0f0f0f',
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.09)',
              borderBottom: 'none',
              maxHeight: '90vh',
            }}
            // On desktop it's centered
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Accent top line */}
            <div className="h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>

            <div className="px-6 pb-8 pt-2">
              {/* Top section: char + name */}
              <div className="flex items-center gap-5 mb-6">
                <div
                  className="relative flex items-end justify-center rounded-2xl overflow-hidden"
                  style={{
                    width: 80, height: 80,
                    background: '#141414',
                    border: `1px solid ${color}30`,
                    boxShadow: isWorking ? `0 0 20px ${color}20` : undefined,
                  }}
                >
                  <div className="pb-1">
                    <PixelChar working={isWorking} accentColor={color} isBoss={isBoss} />
                  </div>
                </div>

                <div className="flex-1">
                  {isBoss && (
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider mb-1.5"
                      style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M4 0.5L4.9 2.6L7.2 2.9L5.6 4.4L5.9 6.7L4 5.6L2.1 6.7L2.4 4.4L0.8 2.9L3.1 2.6L4 0.5Z" fill="#facc15"/>
                      </svg>
                      BOSS
                    </div>
                  )}
                  <h2 className="text-lg font-semibold leading-tight text-white">{agent.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>{agent.role}</p>
                </div>
              </div>

              {/* Status bar */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5"
                style={{
                  background: isWorking ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isWorking ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: isWorking ? '#4ade80' : '#2a2a2a',
                    animation: isWorking ? 'pulse-dot 2s infinite' : undefined,
                  }}
                />
                <span className="text-xs font-medium" style={{ color: isWorking ? '#4ade80cc' : '#444' }}>
                  {isWorking ? 'Working' : 'Idle'}
                </span>
                {agent.current_task && (
                  <span className="text-[11px] truncate ml-2" style={{ color: '#555' }}>— {agent.current_task}</span>
                )}
              </div>

              {/* Stats */}
              <div>
                <StatRow label="Model" value={isOpus ? 'Claude Opus 4' : 'Claude Sonnet 4'} highlight={isOpus} />
                <StatRow label="Agent ID" value={`@${agent.id}`} />
                <StatRow label="Room" value={agent.room?.toUpperCase() ?? '—'} />
                {agent.last_active && (
                  <StatRow label="Last active" value={new Date(agent.last_active).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                )}
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full mt-5 py-3 rounded-xl text-sm font-medium transition-all active:scale-98"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
