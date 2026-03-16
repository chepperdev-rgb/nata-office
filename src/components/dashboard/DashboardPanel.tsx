'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMetrics } from '@/hooks/useMetrics'
import { useServices } from '@/hooks/useServices'
import { useActivity } from '@/hooks/useActivity'
import { useAgents } from '@/hooks/useAgents'
import { useNataliStatus } from '@/hooks/useNataliStatus'
import { STATIC_AGENTS } from '@/lib/constants'

interface DashboardPanelProps {
  open: boolean
  onClose: () => void
}

function MetricBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  )
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getMemoryColor(percent: number): string {
  if (percent < 60) return '#4ade80'
  if (percent < 80) return '#facc15'
  return '#f43f5e'
}

function getCpuColor(percent: number): string {
  if (percent < 50) return '#4ade80'
  if (percent < 80) return '#facc15'
  return '#f43f5e'
}

export default function DashboardPanel({ open, onClose }: DashboardPanelProps) {
  const { metrics } = useMetrics()
  const { services } = useServices()
  const { activity } = useActivity()
  const { agents } = useAgents()
  const { natali } = useNataliStatus()
  const [lastPing, setLastPing] = useState('')
  const [restarting, setRestarting] = useState(false)

  const workingAgents = agents.filter(a => a.status === 'working')
  const workingCount = workingAgents.length
  const totalCount = STATIC_AGENTS.length

  // Update last ping every second
  useEffect(() => {
    if (!metrics?.updated_at) return
    const update = () => setLastPing(timeAgo(metrics.updated_at))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [metrics?.updated_at])

  const handleRestart = async (service: string) => {
    setRestarting(true)
    try {
      await fetch('/api/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer nataly-restart-2026' },
        body: JSON.stringify({ service }),
      })
    } finally {
      setTimeout(() => setRestarting(false), 3000)
    }
  }

  const isCollectorOffline = metrics?.updated_at
    ? (Date.now() - new Date(metrics.updated_at).getTime()) > 5 * 60 * 1000
    : true

  const cpuPercent = metrics?.cpu_percent ?? 0
  const ramPercent = metrics?.ram_percent ?? 0
  const diskPercent = metrics?.disk_percent ?? 0
  const systemScore = Math.max(0, Math.round(100 - cpuPercent * 0.3 - ramPercent * 0.3 - diskPercent * 0.1))
  const diskFreeGb = metrics ? Math.round((100 - metrics.disk_percent) * 10) / 10 : 0 // approximate

  const scoreColor = systemScore >= 70 ? '#4ade80' : systemScore >= 40 ? '#facc15' : '#f43f5e'

  const getServiceStatus = (id: string) => {
    const svc = services.find(s => s.service_id === id)
    return svc?.status || 'unknown'
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-14 right-0 bottom-0 w-[340px] z-50 overflow-y-auto"
          style={{
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
          }}
          initial={{ x: 340 }}
          animate={{ x: 0 }}
          exit={{ x: 340 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        >
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/80">Dashboard</h2>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Natali Status Card */}
            {(() => {
              const statusColors: Record<string, string> = {
                online: '#4ade80',
                degraded: '#facc15',
                error: '#f43f5e',
                offline: '#555',
              }
              const statusLabels: Record<string, string> = {
                online: 'ONLINE',
                degraded: 'DEGRADED',
                error: 'ERROR',
                offline: 'OFFLINE',
              }
              const color = statusColors[natali.status] || '#555'
              return (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: natali.status === 'online' ? 'rgba(74,222,128,0.04)' : natali.status === 'offline' ? 'rgba(255,255,255,0.02)' : 'rgba(244,63,94,0.04)',
                    border: `1px solid ${color}22`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🤖</span>
                      <span className="text-[11px] font-semibold text-white/70">Natali</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: color,
                          boxShadow: natali.status === 'online' ? `0 0 6px ${color}` : undefined,
                          animation: natali.status === 'online' ? 'pulse-dot 2s infinite' : undefined,
                        }}
                      />
                      <span className="text-[10px] font-mono" style={{ color }}>{statusLabels[natali.status]}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-white/30">Gateway</span>
                      <span style={{ color: natali.gateway === 'running' ? '#4ade80' : '#f43f5e' }}>{natali.gateway}</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-white/30">Userbot</span>
                      <span style={{ color: natali.userbot === 'running' ? '#4ade80' : '#f43f5e' }}>{natali.userbot}</span>
                    </div>
                  </div>

                  {natali.claude_processes !== null && (
                    <div className="text-[10px] text-white/30 px-1">
                      🧠 {natali.claude_processes} Claude process{natali.claude_processes !== 1 ? 'es' : ''} running
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestart('gateway')}
                      disabled={restarting}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: restarting ? 'rgba(255,255,255,0.04)' : 'rgba(244,63,94,0.12)',
                        border: '1px solid rgba(244,63,94,0.2)',
                        color: restarting ? '#555' : '#f43f5e',
                        cursor: restarting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {restarting ? 'Restarting...' : '⟳ Restart Gateway'}
                    </button>
                    <button
                      onClick={() => handleRestart('userbot')}
                      disabled={restarting}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: restarting ? 'rgba(255,255,255,0.04)' : 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.15)',
                        color: restarting ? '#555' : '#fbbf24',
                        cursor: restarting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {restarting ? '...' : '⟳ Userbot'}
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Collector status */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
              style={{
                background: isCollectorOffline ? 'rgba(244, 63, 94, 0.08)' : 'rgba(74, 222, 128, 0.06)',
                border: `1px solid ${isCollectorOffline ? 'rgba(244, 63, 94, 0.15)' : 'rgba(74, 222, 128, 0.1)'}`,
                color: isCollectorOffline ? '#f43f5e' : '#4ade80',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isCollectorOffline ? '#f43f5e' : '#4ade80',
                  animation: isCollectorOffline ? undefined : 'pulse-dot 2s infinite',
                }}
              />
              {isCollectorOffline ? 'Collector offline' : `Last update: ${lastPing}`}
            </div>

            {/* Top metrics row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Active agents */}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-bold" style={{ color: workingCount > 0 ? '#4ade80' : '#555' }}>{workingCount}</div>
                <div className="text-[9px] text-white/30 mt-0.5">Active</div>
              </div>
              {/* Total today */}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-bold text-white/70">{activity.length}</div>
                <div className="text-[9px] text-white/30 mt-0.5">Tasks</div>
              </div>
              {/* System Score */}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-bold" style={{ color: scoreColor }}>{systemScore}</div>
                <div className="text-[9px] text-white/30 mt-0.5">Score</div>
              </div>
            </div>

            {/* System Metrics */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">System</h3>

              {/* CPU */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/50">CPU</span>
                  <span style={{ color: getCpuColor(cpuPercent) }}>{cpuPercent.toFixed(1)}%</span>
                </div>
                <MetricBar value={cpuPercent} color={getCpuColor(cpuPercent)} />
              </div>

              {/* RAM */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/50">Memory</span>
                  <span style={{ color: getMemoryColor(ramPercent) }}>
                    {metrics ? `${metrics.ram_used_gb.toFixed(1)}/${metrics.ram_total_gb}GB` : '—'}
                  </span>
                </div>
                <MetricBar value={ramPercent} color={getMemoryColor(ramPercent)} />
              </div>

              {/* Disk */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/50">Disk</span>
                  <span className="text-white/50">{diskPercent.toFixed(0)}% used</span>
                </div>
                <MetricBar value={diskPercent} color="#8b5cf6" />
              </div>

              {/* Uptime + Disk Free */}
              <div className="flex justify-between text-[11px] text-white/30 pt-1">
                <span>Uptime: {metrics?.uptime_seconds ? formatUptime(metrics.uptime_seconds) : '—'}</span>
                <span>{diskFreeGb > 0 ? `~${(100 - diskPercent).toFixed(0)}% free` : ''}</span>
              </div>
            </div>

            {/* Working Agents */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Agents</h3>
                <span className="text-[11px] text-white/20">{workingCount}/{totalCount}</span>
              </div>
              {workingAgents.length > 0 ? (
                <div className="space-y-2">
                  {workingAgents.map(a => {
                    const staticAgent = STATIC_AGENTS.find(s => s.id === a.id)
                    return (
                      <div key={a.id} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#4ade80', animation: 'pulse-dot 2s infinite' }}
                        />
                        <span className="text-xs text-white/70">{staticAgent?.emoji} {staticAgent?.name || a.id}</span>
                        <span className="text-[10px] text-white/20 ml-auto">{staticAgent?.role}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-white/20">No agents working</p>
              )}
            </div>

            {/* Services */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5">Services</h3>
              {['userbot', 'gateway'].map(svc => {
                const status = getServiceStatus(svc)
                const isRunning = status === 'running'
                return (
                  <div key={svc} className="flex items-center justify-between py-1">
                    <span className="text-xs text-white/60 capitalize">{svc}</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: isRunning ? '#4ade80' : status === 'error' ? '#facc15' : '#f43f5e' }}
                      />
                      <span className="text-[10px]" style={{ color: isRunning ? '#4ade80' : '#555' }}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Activity Feed */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2.5">Recent Activity</h3>
              <div className="space-y-2">
                {activity.length === 0 && (
                  <p className="text-xs text-white/20">No recent activity</p>
                )}
                {activity.slice(0, 5).map((log) => {
                  const staticAgent = STATIC_AGENTS.find(a => a.id === log.agent_id)
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 pl-2"
                      style={{ borderLeft: '2px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-white/60">{staticAgent?.name || log.agent_id}</span>
                        <span className="text-xs text-white/25"> — {log.action}</span>
                      </div>
                      <span className="text-[10px] text-white/20 whitespace-nowrap">{timeAgo(log.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
