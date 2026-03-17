'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PixelChar from './PixelChar'
import { useAgentHistory } from '@/hooks/useAgentHistory'
import type { Agent } from '@/types'

interface AgentPopupProps {
  agent: Agent | null
  roomColor?: string
  onClose: () => void
}

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

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function AgentPopup({ agent, onClose }: AgentPopupProps) {
  const [tab, setTab] = useState<'info' | 'history'>('info')
  const { sessions } = useAgentHistory(agent?.id, 'week', 20)

  if (!agent) return null
  const isWorking = agent.status === 'working'
  const isOpus = agent.model === 'opus'
  const isBoss = BOSS_IDS.has(agent.id)
  const color = AGENT_ROOM_COLORS[agent.id] || '#888'

  const totalTokens = sessions.reduce((sum, s) => sum + (s.tokens_total || 0), 0)
  const totalSessions = sessions.length

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

            <div className="px-6 pb-6 pt-2">
              {/* Top section: char + name */}
              <div className="flex items-center gap-5 mb-4">
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4"
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

              {/* Tab switcher */}
              <div className="flex mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setTab('info')}
                  className="flex-1 pb-2 text-[11px] font-semibold tracking-wider uppercase transition-all"
                  style={{
                    color: tab === 'info' ? color : 'rgba(255,255,255,0.25)',
                    borderBottom: tab === 'info' ? `2px solid ${color}` : '2px solid transparent',
                  }}
                >
                  Info
                </button>
                <button
                  onClick={() => setTab('history')}
                  className="flex-1 pb-2 text-[11px] font-semibold tracking-wider uppercase transition-all"
                  style={{
                    color: tab === 'history' ? color : 'rgba(255,255,255,0.25)',
                    borderBottom: tab === 'history' ? `2px solid ${color}` : '2px solid transparent',
                  }}
                >
                  History ({totalSessions})
                </button>
              </div>

              {/* Info tab */}
              {tab === 'info' && (
                <div>
                  <StatRow label="Model" value={isOpus ? 'Claude Opus 4' : 'Claude Sonnet 4'} highlight={isOpus} />
                  <StatRow label="Agent ID" value={`@${agent.id}`} />
                  <StatRow label="Room" value={agent.room?.toUpperCase() ?? '—'} />
                  <StatRow label="Sessions (7d)" value={String(totalSessions)} />
                  <StatRow label="Tokens (7d)" value={formatTokens(totalTokens)} highlight={totalTokens > 50000} />
                  {agent.last_active && (
                    <StatRow label="Last active" value={new Date(agent.last_active).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                  )}
                </div>
              )}

              {/* History tab */}
              {tab === 'history' && (
                <div className="max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-[11px]" style={{ color: '#444' }}>No sessions recorded yet</span>
                    </div>
                  ) : (
                    sessions.map((s, i) => (
                      <div
                        key={s.id || i}
                        className="py-2.5 flex items-start gap-3"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        {/* Status dot */}
                        <div className="pt-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: s.status === 'active' ? '#4ade80'
                                : s.status === 'error' ? '#f43f5e'
                                : '#333',
                            }}
                          />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] truncate" style={{ color: '#999' }}>
                            {s.task_summary
                              ? s.task_summary.replace(/^\[cron:[^\]]+\]\s*/, '').slice(0, 60)
                              : s.status === 'active' ? 'Currently processing...' : 'Session completed'}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px]" style={{ color: '#444' }}>{timeAgo(s.started_at)}</span>
                            <span className="text-[10px]" style={{ color: '#555' }}>{formatTokens(s.tokens_total)} tok</span>
                            <span className="text-[10px]" style={{ color: '#444' }}>{s.model?.replace('claude-', '')?.replace('-4-6', '') || '?'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-98"
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
