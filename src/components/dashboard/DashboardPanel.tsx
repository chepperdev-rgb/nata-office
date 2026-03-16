'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useMetrics } from '@/hooks/useMetrics'
import { useServices } from '@/hooks/useServices'
import { useActivity } from '@/hooks/useActivity'
import { useAgents } from '@/hooks/useAgents'
import { STATIC_AGENTS } from '@/lib/constants'

interface DashboardPanelProps {
  open: boolean
  onClose: () => void
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-3 bg-gray-800 rounded border border-gray-700">
      <div
        className="h-full rounded transition-all duration-500"
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

export default function DashboardPanel({ open, onClose }: DashboardPanelProps) {
  const { metrics } = useMetrics()
  const { services } = useServices()
  const { activity } = useActivity()
  const { agents } = useAgents()

  const workingCount = agents.filter(a => a.status === 'working').length
  const totalCount = STATIC_AGENTS.length

  const getServiceStatus = (id: string) => {
    const svc = services.find(s => s.service_id === id)
    return svc?.status || 'unknown'
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢'
      case 'down': return '🔴'
      case 'error': return '🟡'
      default: return '⚪'
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-14 right-0 bottom-0 w-80 z-50 bg-gray-900 border-l-4 border-gray-700 overflow-y-auto"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wider" style={{ fontFamily: 'monospace' }}>
                📊 DASHBOARD
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            {/* System Metrics */}
            <div className="space-y-3 bg-gray-800/50 rounded p-3 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-400">SYSTEM</h3>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>CPU</span>
                  <span className="text-yellow-400">{metrics?.cpu_percent?.toFixed(1) ?? '—'}%</span>
                </div>
                <ProgressBar value={metrics?.cpu_percent ?? 0} color="#eab308" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>RAM</span>
                  <span className="text-blue-400">
                    {metrics ? `${metrics.ram_used_gb.toFixed(1)} / ${metrics.ram_total_gb} GB` : '—'}
                  </span>
                </div>
                <ProgressBar value={metrics?.ram_percent ?? 0} color="#3b82f6" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Disk</span>
                  <span className="text-purple-400">{metrics?.disk_percent?.toFixed(1) ?? '—'}%</span>
                </div>
                <ProgressBar value={metrics?.disk_percent ?? 0} color="#a855f7" />
              </div>

              {metrics?.uptime_seconds && (
                <div className="text-xs text-gray-500">
                  Uptime: {formatUptime(metrics.uptime_seconds)}
                </div>
              )}
            </div>

            {/* Services */}
            <div className="space-y-2 bg-gray-800/50 rounded p-3 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-400">SERVICES</h3>
              <div className="flex justify-between text-sm">
                <span>Userbot</span>
                <span>{statusIcon(getServiceStatus('userbot'))} {getServiceStatus('userbot').toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gateway</span>
                <span>{statusIcon(getServiceStatus('gateway'))} {getServiceStatus('gateway').toUpperCase()}</span>
              </div>
            </div>

            {/* Agents summary */}
            <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-400 mb-2">AGENTS</h3>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="text-white font-bold">{totalCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Working</span>
                <span className="text-green-400 font-bold">{workingCount}</span>
              </div>
            </div>

            {/* Activity feed */}
            <div className="bg-gray-800/50 rounded p-3 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-400 mb-2">ACTIVITY</h3>
              <div className="space-y-1.5">
                {activity.length === 0 && (
                  <p className="text-xs text-gray-600">No recent activity</p>
                )}
                {activity.slice(0, 5).map((log) => {
                  const agentName = STATIC_AGENTS.find(a => a.id === log.agent_id)?.name || log.agent_id
                  return (
                    <div key={log.id} className="text-xs border-l-2 border-gray-600 pl-2">
                      <span className="text-green-400">{agentName}</span>
                      <span className="text-gray-400"> — {log.action}</span>
                      <div className="text-gray-600">
                        {new Date(log.created_at).toLocaleTimeString('uk-UA')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Last updated */}
            {metrics?.updated_at && (
              <p className="text-xs text-gray-600 text-center">
                Updated: {new Date(metrics.updated_at).toLocaleString('uk-UA')}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
