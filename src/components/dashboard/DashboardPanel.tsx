'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMetrics } from '@/hooks/useMetrics'
import { useServices } from '@/hooks/useServices'
import { useActivity } from '@/hooks/useActivity'
import { useAgents } from '@/hooks/useAgents'
import { useNataliStatus } from '@/hooks/useNataliStatus'
import { useProcesses } from '@/hooks/useProcesses'
import { useThoughts } from '@/hooks/useThoughts'
import { STATIC_AGENTS } from '@/lib/constants'
import { useWorkerStats } from '@/hooks/useWorkerStats'
import TerminalPanel from './TerminalPanel'
import AIStudioPanel from './AIStudioPanel'

interface DashboardPanelProps {
  open: boolean
  onClose: () => void
}

// ─── Monochrome SVG Icons ────────────────────────────────────────────────────
function IconRefresh({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 3v3.5h-3.5M2.5 13v-3.5h3.5M13 6.5A5.5 5.5 0 004.2 3.8M3 9.5A5.5 5.5 0 0011.8 12.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconTrash({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v5M9.5 7v5M3.5 4l.7 9.5h7.6L12.5 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconGear({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.3"/>
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconBrain({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2.5C6.6 2.5 5.5 3.5 5.5 4.8c0 .3.1.7.2 1C4.6 6.2 4 7.1 4 8.2c0 .8.3 1.5.8 2-.5.4-.8 1-.8 1.6 0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-.6-.3-1.2-.8-1.6.5-.5.8-1.2.8-2 0-1.1-.6-2-1.7-2.4.1-.3.2-.7.2-1C10.5 3.5 9.4 2.5 8 2.5z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 5.5v7" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

// ─── Nataly Pixel Character — Barbie edition ────────────────────────────────
function NatalyChar({ working = false }: { working?: boolean }) {
  // Barbie: тонка талія, пишні стегна, великі очі, довге волосся, рожева сукня
  const skin   = '#f5c9a0'
  const hair   = '#1c0a0a'
  const hairH  = '#2e1010'
  const pink   = '#f472b6'
  const pinkD  = '#db2777'
  const pinkL  = '#fbcfe8'
  const heel   = '#be185d'
  const lip    = '#e11d48'

  return (
    <svg
      width="64" height="88" viewBox="0 0 40 55"
      style={{
        imageRendering: 'pixelated',
        animation: working ? 'typing 0.5s ease-in-out infinite' : 'idle-think 4s ease-in-out infinite',
        transformOrigin: 'bottom center',
        filter: 'drop-shadow(0 4px 12px rgba(244,114,182,0.25))',
      }}
    >
      {/* ══ HAIR BACK ══ */}
      <rect x="3"  y="2"  width="4" height="24" fill={hair} opacity="0.9"/>
      <rect x="33" y="2"  width="4" height="24" fill={hair} opacity="0.9"/>
      <rect x="4"  y="2"  width="2" height="20" fill={hairH} opacity="0.5"/>
      <rect x="34" y="2"  width="2" height="20" fill={hairH} opacity="0.5"/>
      {/* hair shine */}
      <rect x="5"  y="3"  width="1" height="8"  fill="rgba(255,255,255,0.12)"/>
      <rect x="34" y="3"  width="1" height="8"  fill="rgba(255,255,255,0.12)"/>

      {/* ══ HAIR TOP ══ */}
      <rect x="8"  y="0"  width="24" height="5" fill={hair}/>
      <rect x="6"  y="3"  width="28" height="4" fill={hair}/>
      {/* center part */}
      <rect x="19" y="0"  width="2"  height="4" fill={hairH} opacity="0.6"/>

      {/* ══ HEAD (oval-ish) ══ */}
      <rect x="9"  y="4"  width="22" height="17" fill={skin}/>
      <rect x="8"  y="6"  width="2"  height="12" fill={skin}/>
      <rect x="30" y="6"  width="2"  height="12" fill={skin}/>
      {/* jaw taper */}
      <rect x="10" y="19" width="20" height="2"  fill={skin}/>
      <rect x="12" y="21" width="16" height="1"  fill={skin}/>

      {/* ══ EARRINGS ══ */}
      <rect x="7"  y="14" width="2" height="4" fill={pink} opacity="0.9"/>
      <rect x="31" y="14" width="2" height="4" fill={pink} opacity="0.9"/>
      <rect x="7"  y="17" width="2" height="2" fill={pinkL} opacity="0.7"/>
      <rect x="31" y="17" width="2" height="2" fill={pinkL} opacity="0.7"/>

      {/* ══ BROWS (fine arched) ══ */}
      <rect x="11" y="8"  width="6" height="1"  fill={hair} opacity="0.8"/>
      <rect x="23" y="8"  width="6" height="1"  fill={hair} opacity="0.8"/>
      <rect x="10" y="9"  width="1" height="1"  fill={hair} opacity="0.4"/>
      <rect x="29" y="9"  width="1" height="1"  fill={hair} opacity="0.4"/>

      {/* ══ EYES (big almond) ══ */}
      {/* lashes top */}
      <rect x="11" y="10" width="7" height="1"  fill={hair}/>
      <rect x="22" y="10" width="7" height="1"  fill={hair}/>
      {/* iris */}
      <rect x="11" y="11" width="7" height="5"  fill="#1a0a0a"/>
      <rect x="22" y="11" width="7" height="5"  fill="#1a0a0a"/>
      {/* iris color */}
      <rect x="12" y="12" width="5" height="3"  fill="#5c2a2a" opacity="0.8"/>
      <rect x="23" y="12" width="5" height="3"  fill="#5c2a2a" opacity="0.8"/>
      {/* pupil */}
      <rect x="13" y="12" width="3" height="3"  fill="#0a0505"/>
      <rect x="24" y="12" width="3" height="3"  fill="#0a0505"/>
      {/* sparkle */}
      <rect x="14" y="12" width="1" height="1"  fill="rgba(255,255,255,0.95)"/>
      <rect x="25" y="12" width="1" height="1"  fill="rgba(255,255,255,0.95)"/>
      <rect x="15" y="14" width="1" height="1"  fill="rgba(255,255,255,0.4)"/>
      <rect x="26" y="14" width="1" height="1"  fill="rgba(255,255,255,0.4)"/>
      {/* lower lash */}
      <rect x="12" y="16" width="5" height="1"  fill={hair} opacity="0.5"/>
      <rect x="23" y="16" width="5" height="1"  fill={hair} opacity="0.5"/>

      {/* ══ BLUSH ══ */}
      <rect x="10" y="17" width="5" height="2"  fill="#ffb3b3" opacity="0.35"/>
      <rect x="25" y="17" width="5" height="2"  fill="#ffb3b3" opacity="0.35"/>

      {/* ══ NOSE (tiny) ══ */}
      <rect x="19" y="16" width="2" height="1"  fill={skin} style={{filter:'brightness(0.88)'}}/>

      {/* ══ LIPS (full) ══ */}
      <rect x="14" y="18" width="12" height="1"  fill={pinkD} opacity="0.6"/>
      <rect x="13" y="19" width="14" height="2"  fill={lip}/>
      <rect x="14" y="21" width="12" height="1"  fill={pinkD}/>
      {/* lip shine */}
      <rect x="15" y="19" width="5"  height="1"  fill="rgba(255,255,255,0.4)"/>

      {/* ══ NECK ══ */}
      <rect x="16" y="22" width="8"  height="4"  fill={skin}/>
      {/* necklace */}
      <rect x="14" y="25" width="12" height="1"  fill={pinkL} opacity="0.7"/>
      <rect x="19" y="25" width="2"  height="2"  fill={pink} opacity="0.9"/>

      {/* ══ DRESS TOP (fitted) ══ */}
      <rect x="10" y="26" width="20" height="10" fill={pink}/>
      {/* bust shape */}
      <rect x="9"  y="27" width="6"  height="7"  fill={pink}/>
      <rect x="25" y="27" width="6"  height="7"  fill={pink}/>
      {/* center seam */}
      <rect x="19" y="26" width="2"  height="10" fill={pinkD} opacity="0.3"/>
      {/* sparkle detail */}
      <rect x="14" y="28" width="2"  height="2"  fill={pinkL} opacity="0.5"/>
      <rect x="24" y="30" width="2"  height="2"  fill={pinkL} opacity="0.5"/>

      {/* ══ WAIST (thin) ══ */}
      <rect x="13" y="36" width="14" height="3"  fill={pink}/>
      <rect x="12" y="37" width="16" height="1"  fill={pinkD} opacity="0.3"/>

      {/* ══ SKIRT (flared, mini) ══ */}
      <rect x="9"  y="39" width="22" height="7"  fill={pink}/>
      <rect x="7"  y="42" width="26" height="5"  fill={pink} opacity="0.95"/>
      <rect x="5"  y="44" width="30" height="3"  fill={pink} opacity="0.8"/>
      {/* skirt shine folds */}
      <rect x="12" y="39" width="2"  height="8"  fill={pinkL} opacity="0.2"/>
      <rect x="20" y="39" width="2"  height="8"  fill={pinkL} opacity="0.2"/>
      <rect x="28" y="40" width="2"  height="7"  fill={pinkL} opacity="0.15"/>
      {/* skirt hem */}
      <rect x="5"  y="46" width="30" height="1"  fill={pinkD} opacity="0.5"/>

      {/* ══ LEFT ARM ══ */}
      <rect x="3"  y="26" width="5"  height="13" fill={skin}
        style={{ animation: working ? 'walk-arm-l 0.5s ease-in-out infinite' : undefined, transformOrigin: '5px 26px' }}/>
      <rect x="2"  y="39" width="4"  height="3"  fill={skin}/>
      {/* bracelet */}
      <rect x="2"  y="37" width="5"  height="2"  fill={pink} opacity="0.8"/>

      {/* ══ RIGHT ARM ══ */}
      <rect x="32" y="26" width="5"  height="13" fill={skin}
        style={{ animation: working ? 'walk-arm-r 0.5s ease-in-out infinite' : undefined, transformOrigin: '35px 26px' }}/>
      <rect x="34" y="39" width="4"  height="3"  fill={skin}/>
      {/* bracelet */}
      <rect x="33" y="37" width="5"  height="2"  fill={pink} opacity="0.8"/>

      {/* ══ LEGS (long, toned) ══ */}
      <rect x="13" y="47" width="6"  height="7"  fill={skin}
        style={{ animation: working ? 'walk-leg-l 0.5s ease-in-out infinite' : undefined, transformOrigin: '16px 47px' }}/>
      <rect x="21" y="47" width="6"  height="7"  fill={skin}
        style={{ animation: working ? 'walk-leg-r 0.5s ease-in-out infinite' : undefined, transformOrigin: '24px 47px' }}/>

      {/* ══ HEELS ══ */}
      {/* platform */}
      <rect x="12" y="53" width="7"  height="2"  fill={heel}/>
      <rect x="21" y="53" width="7"  height="2"  fill={heel}/>
      {/* stiletto */}
      <rect x="18" y="53" width="1"  height="4"  fill={heel}/>
      <rect x="27" y="53" width="1"  height="4"  fill={heel}/>
      {/* toe */}
      <rect x="12" y="52" width="5"  height="1"  fill={heel} opacity="0.8"/>
      <rect x="21" y="52" width="5"  height="1"  fill={heel} opacity="0.8"/>
      {/* shine */}
      <rect x="13" y="53" width="4"  height="1"  fill="rgba(255,255,255,0.18)"/>
      <rect x="22" y="53" width="4"  height="1"  fill="rgba(255,255,255,0.18)"/>
    </svg>
  )
}

// ─── Думки Наталі: розкладний панель зі скролом ────────────────────────────
interface Thought { id: string; action: string; created_at: string }

function ThoughtsPanel({ thoughts }: { thoughts: Thought[] }) {
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const prefixMap: Record<string, { color: string }> = {
    '💭': { color: '#fbbf2499' },
    '⚡': { color: '#4ade8099' },
    '❌': { color: '#f43f5e99' },
    '✅': { color: '#34d39999' },
  }

  const rows = thoughts.map(t => {
    const match = t.action.match(/^\[(.+?)\]\s*(.+)/)
    const icon = match?.[1] ?? '💭'
    const text = match?.[2] ?? t.action
    const style = prefixMap[icon] ?? { color: '#fbbf2499' }
    const timeStr = new Date(t.created_at).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
    return { id: t.id, icon, text, style, timeStr }
  })

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(251,191,36,0.15)' }}
    >
      {/* Header — клікабельний */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
        style={{ borderBottom: expanded ? '1px solid rgba(251,191,36,0.08)' : 'none', background: 'rgba(251,191,36,0.04)' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <IconBrain size={13} color="rgba(251,191,36,0.7)" />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#fbbf24cc' }}>
            Думки Наталі
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#fbbf24' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[9px] text-white/20">live</span>
          {/* Стрілочка-chevron */}
          <motion.svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'inline-block', flexShrink: 0 }}
          >
            <path d="M3 5L7 9L11 5" stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </div>
      </button>

      {/* Тіло — розкладається */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="thoughts-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={scrollRef}
              className="px-3 py-2 space-y-1.5 overflow-y-auto"
              style={{ maxHeight: '340px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(251,191,36,0.3) transparent' }}
            >
              {rows.length === 0 ? (
                <p className="text-[10px] text-white/15 italic mt-2">Тиша... чекаю задач 🌙</p>
              ) : (
                rows.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={i === 0 ? { opacity: 0, x: -8 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-[9px] text-white/20 mt-0.5 shrink-0 font-mono">{r.timeStr}</span>
                    <span className="text-[10px] shrink-0">{r.icon}</span>
                    <span className="text-[11px] leading-tight" style={{ color: r.style.color }}>{r.text}</span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview — остання думка */}
      {!expanded && rows.length > 0 && (
        <div className="px-3 py-2 flex items-start gap-2">
          <span className="text-[9px] text-white/20 mt-0.5 shrink-0 font-mono">{rows[0].timeStr}</span>
          <span className="text-[10px] shrink-0">{rows[0].icon}</span>
          <span className="text-[11px] leading-tight truncate" style={{ color: rows[0].style.color }}>{rows[0].text}</span>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────

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
  if (!dateStr) return '—'
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

// Neon CPU core balls
// Max CPU = cores × 100% (e.g. 1200% for 12 cores)
// Each ball = 100% of one core. Gray by default, fills yellow when active.
function CpuCoreBalls({ cpuPercent, cores = 12 }: { cpuPercent: number; cores?: number }) {
  const fullLit = Math.floor(cpuPercent / 100)          // fully lit balls
  const partialFill = (cpuPercent % 100) / 100          // 0..1 for next ball
  const YELLOW = '#facc15'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cores}, 1fr)`, gap: 4, width: '100%', marginTop: 6 }}>
      {Array.from({ length: cores }).map((_, i) => {
        const isFull = i < fullLit
        const isPartial = i === fullLit && partialFill > 0
        const fill = isFull ? 1 : isPartial ? partialFill : 0

        return (
          <div
            key={i}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: '50%',
              background: '#111',
              border: `1px solid ${fill > 0 ? YELLOW + '99' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: isFull
                ? `0 0 7px ${YELLOW}99, inset 0 0 4px ${YELLOW}22`
                : isPartial
                ? `0 0 3px ${YELLOW}55`
                : 'none',
              overflow: 'hidden',
              transition: 'border-color 0.5s, box-shadow 0.5s',
            }}
          >
            {/* Fill from bottom */}
            {fill > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${Math.round(fill * 100)}%`,
                  background: `linear-gradient(0deg, ${YELLOW}ff 0%, ${YELLOW}bb 70%, ${YELLOW}55 100%)`,
                  transition: 'height 0.6s ease',
                  animation: isFull ? `core-fill-pulse 2s ease-in-out ${(i * 0.1) % 1}s infinite` : undefined,
                }}
              />
            )}
            {/* Shine dot */}
            <div
              style={{
                position: 'absolute',
                top: '18%',
                left: '22%',
                width: '28%',
                height: '28%',
                borderRadius: '50%',
                background: fill > 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.04)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPanel({ open, onClose }: DashboardPanelProps) {
  const { metrics } = useMetrics()
  const { services } = useServices()
  const { activity } = useActivity()
  const { agents } = useAgents()
  const { natali } = useNataliStatus()
  const { lines: processLines } = useProcesses()
  const { thoughts } = useThoughts()
  const { stats: workerToday } = useWorkerStats('today')
  const { stats: workerWeek } = useWorkerStats('week')
  const terminalRef = useRef<HTMLDivElement>(null)
  const [lastPing, setLastPing] = useState('')
  const [restarting, setRestarting] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'terminal' | 'aistudio'>('dashboard')
  const [tasksOpen, setTasksOpen] = useState(false)

  // Nataly processes from services
  const natalyProcesses = (services.find(s => s.service_id === 'nataly_processes')?.details?.processes) ?? []

  const workingAgents = agents.filter(a => a.status === 'working')
  const workingCount = workingAgents.length
  const totalCount = STATIC_AGENTS.length

  // Active = number of running claude CLI processes (from processLines unique agents)
  const activeCount = processLines.filter(l => l.agent !== 'system').length > 0
    ? processLines.filter(l => l.agent !== 'system').length
    : workingCount

  // Real tasks count — today's activity entries
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tasksToday = activity.filter(a => new Date(a.created_at) >= todayStart).length

  // Update last ping every second
  useEffect(() => {
    if (!metrics?.updated_at) return
    const update = () => setLastPing(timeAgo(metrics.updated_at))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [metrics?.updated_at])

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [processLines])

  const sendCommand = async (command: string) => {
    setRestarting(true)
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer nataly-restart-2026' },
        body: JSON.stringify({ command }),
      })
    } finally {
      setTimeout(() => setRestarting(false), 4000)
    }
  }

  const handleRestart = async (service: string) => {
    await sendCommand(`restart_${service}`)
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
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: 'rgba(13, 13, 13, 0.98)',
            backdropFilter: 'blur(24px)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        >
          {/* Tab switcher */}
          <div className="flex border-b border-white/08 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 text-xs font-semibold tracking-widest uppercase transition-all ${activeTab === 'dashboard' ? 'text-green-400 border-b-2 border-green-400' : 'text-white/30 hover:text-white/60'}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab('aistudio')}
              className={`flex-1 py-3 text-xs font-semibold tracking-widest uppercase transition-all ${activeTab === 'aistudio' ? 'border-b-2' : 'text-white/30 hover:text-white/60'}`}
              style={activeTab === 'aistudio' ? { color: '#a855f7', borderBottomColor: '#a855f7' } : {}}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                AI Studio
              </span>
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex-1 py-3 text-xs font-semibold tracking-widest uppercase transition-all ${activeTab === 'terminal' ? 'text-green-400 border-b-2 border-green-400' : 'text-white/30 hover:text-white/60'}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 4l4 4-4 4M8 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Terminal
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-4 text-white/30 hover:text-white/60 hover:bg-white/05 transition-all text-lg"
            >×</button>
          </div>

          {/* Terminal Tab */}
          {activeTab === 'terminal' && (
            <div className="flex-1 overflow-hidden">
              <TerminalPanel open={open && activeTab === 'terminal'} />
            </div>
          )}

          {/* AI Studio Tab */}
          {activeTab === 'aistudio' && (
            <div className="flex-1 overflow-y-auto">
              <AIStudioPanel />
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto p-5 space-y-4">
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
                  {/* Name row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold tracking-wide" style={{ color: '#fff', letterSpacing: '0.04em' }}>Натали</span>
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
                  {/* Pixel character centered */}
                  <div className="flex justify-center py-1">
                    <NatalyChar working={natali.status === 'online'} />
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
                      <span className="flex items-center gap-1"><IconBrain size={11} color="rgba(255,255,255,0.3)" /> {natali.claude_processes} Claude process{natali.claude_processes !== 1 ? 'es' : ''} running</span>
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
                      {restarting ? 'Restarting...' : <span className="flex items-center justify-center gap-1"><IconRefresh size={11} color="#f43f5e" /> Restart Gateway</span>}
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
                      {restarting ? '...' : <span className="flex items-center justify-center gap-1"><IconRefresh size={11} color="#fbbf24" /> Userbot</span>}
                    </button>
                  </div>

                  {/* Extra control buttons */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => sendCommand('run_collector')}
                      disabled={restarting}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: restarting ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: restarting ? '#555' : '#818cf8',
                        cursor: restarting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {restarting ? '...' : <span className="flex items-center justify-center gap-1"><IconRefresh size={11} color="#818cf8" /> Sync Metrics</span>}
                    </button>
                    <button
                      onClick={() => sendCommand('clear_cache')}
                      disabled={restarting}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        background: restarting ? 'rgba(255,255,255,0.04)' : 'rgba(6,182,212,0.08)',
                        border: '1px solid rgba(6,182,212,0.15)',
                        color: restarting ? '#555' : '#22d3ee',
                        cursor: restarting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {restarting ? '...' : <span className="flex items-center justify-center gap-1"><IconTrash size={11} color="#22d3ee" /> Clear Cache</span>}
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
              {/* Active processes (real Claude count from collector) */}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-bold" style={{ color: activeCount > 0 ? '#4ade80' : '#555' }}>{activeCount}</div>
                <div className="text-[9px] text-white/30 mt-0.5">Active</div>
              </div>
              {/* Tasks today — clickable popup */}
              <div
                className="rounded-xl p-3 text-center cursor-pointer"
                style={{ background: tasksOpen ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${tasksOpen ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}
                onClick={() => setTasksOpen(v => !v)}
              >
                <div className="text-2xl font-bold" style={{ color: tasksToday > 0 ? '#facc15' : '#555' }}>{tasksToday}</div>
                <div className="text-[9px] text-white/30 mt-0.5">Tasks ▾</div>
              </div>
              {/* System Score */}
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-bold" style={{ color: scoreColor }}>{systemScore}</div>
                <div className="text-[9px] text-white/30 mt-0.5">Score</div>
              </div>
            </div>

            {/* Tasks popup */}
            <AnimatePresence>
              {tasksOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-xl"
                  style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)' }}
                >
                  <div className="p-3 space-y-1.5">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Today&apos;s activity</div>
                    {activity.length === 0 ? (
                      <p className="text-xs text-white/20">No tasks today</p>
                    ) : (
                      activity
                        .filter(a => new Date(a.created_at) >= (() => { const d = new Date(); d.setHours(0,0,0,0); return d })())
                        .slice(0, 10)
                        .map((a) => {
                          const agent = STATIC_AGENTS.find(s => s.id === a.agent_id)
                          return (
                            <div key={a.id} className="flex items-start gap-2">
                              <span className="text-[10px] text-white/20 mt-0.5 shrink-0">
                                {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                              <span className="text-[10px]" style={{ color: '#facc1599' }}>
                                {agent?.emoji ?? '⚙️'} {agent?.name ?? a.agent_id}
                              </span>
                              <span className="text-[10px] text-white/50 truncate">{a.action}</span>
                            </div>
                          )
                        })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* System Metrics */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">System</h3>

              {/* CPU — neon core balls */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">CPU</span>
                  <span style={{ color: cpuPercent > 0 ? '#facc15' : 'rgba(255,255,255,0.3)' }}>
                    {cpuPercent.toFixed(0)}% <span className="text-white/30">/ {(metrics?.cpu_cores ?? 12) * 100}%</span>
                  </span>
                </div>
                <CpuCoreBalls cpuPercent={cpuPercent} cores={metrics?.cpu_cores ?? 12} />
              </div>

              {/* RAM */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/50">Memory</span>
                  <span style={{ color: getMemoryColor(ramPercent) }}>
                    {metrics ? `${metrics.ram_used_gb.toFixed(1)} / ${metrics.ram_total_gb ?? 32} GB` : '—'}
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

            {/* Live Terminal */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#4ade80',
                    boxShadow: '0 0 6px #4ade80',
                    animation: 'pulse-dot 2s infinite',
                  }}
                />
                <span
                  className="text-[10px] font-semibold tracking-[0.12em] uppercase"
                  style={{ color: '#4ade80' }}
                >
                  LIVE
                </span>
                <span
                  className="text-[10px] font-medium tracking-[0.1em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  PROCESSES
                </span>
              </div>
              <div
                ref={terminalRef}
                className="px-3 py-2 space-y-0.5 overflow-y-auto"
                style={{
                  height: '120px',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                }}
              >
                {processLines.map((line) => (
                  <div
                    key={line.id}
                    className="text-[10px] leading-relaxed whitespace-nowrap"
                    style={{ color: '#4ade80' }}
                  >
                    <span style={{ color: '#4ade8080' }}>[{new Date(line.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}]</span>{' '}
                    <span style={{ color: '#4ade80' }}>{line.agent.padEnd(12)}</span>{' '}
                    <span style={{ color: '#4ade8060' }}>
                      {line.action.startsWith('running') || line.action.includes('passed') || line.action.includes('completed') ? '\u2713' : '\u2192'}
                    </span>{' '}
                    <span style={{ color: '#4ade80cc' }}>{line.action}</span>
                  </div>
                ))}
                {processLines.length === 0 && (
                  <div className="text-[10px]" style={{ color: '#4ade8040' }}>
                    waiting for data...
                  </div>
                )}
              </div>
            </div>

            {/* Nataly Processes */}
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#a78bfa99' }}>
                  <IconGear size={11} color="#a78bfa99" /> Nataly Processes
                </h3>
                <span className="text-[9px] text-white/20">{natalyProcesses.length} running</span>
              </div>
              {natalyProcesses.length === 0 ? (
                <div className="text-[10px] text-white/20">No data yet — waiting for collector...</div>
              ) : (
                <div className="space-y-1.5">
                  {natalyProcesses.map((proc, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.08)' }}>
                      <div className="flex items-center gap-2">
                        {/* Status dot */}
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 4px #a78bfa88' }} />
                        <span className="text-[11px] font-medium text-white/80">{proc.name}</span>
                        <span className="text-[9px] text-white/20">PID {proc.pid}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-white/40">
                        <span style={{ color: parseFloat(proc.cpu) > 50 ? '#facc15' : 'rgba(255,255,255,0.3)' }}>
                          {proc.cpu}
                        </span>
                        <span>{proc.mem}</span>
                        <span className="text-[9px] text-white/20">{proc.since}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🧠 Думки Наталі — розкладний блок */}
            <ThoughtsPanel thoughts={thoughts} />

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

            {/* Worker Leaderboard */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Agent Leaderboard</h3>
                <span className="text-[10px] text-white/20">{workerWeek.total_sessions} sessions this week</span>
              </div>

              {/* Worker of the Day */}
              {workerToday.worker_of_period && (
                <div className="mb-3 p-3 rounded-lg" style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.12)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px]">🏆</span>
                    <span className="text-[10px] font-semibold" style={{ color: '#facc15' }}>WORKER OF THE DAY</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80">
                      {STATIC_AGENTS.find(a => a.id === workerToday.worker_of_period!.agent_id)?.name || workerToday.worker_of_period.agent_id}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {workerToday.worker_of_period.total_sessions} tasks · {workerToday.worker_of_period.total_tokens >= 1000 ? `${(workerToday.worker_of_period.total_tokens / 1000).toFixed(0)}K` : workerToday.worker_of_period.total_tokens} tokens
                    </span>
                  </div>
                </div>
              )}

              {/* Worker of the Week */}
              {workerWeek.worker_of_period && (
                <div className="mb-3 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px]">⭐</span>
                    <span className="text-[10px] font-semibold" style={{ color: '#a78bfa' }}>WORKER OF THE WEEK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80">
                      {STATIC_AGENTS.find(a => a.id === workerWeek.worker_of_period!.agent_id)?.name || workerWeek.worker_of_period.agent_id}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {workerWeek.worker_of_period.total_sessions} tasks · {workerWeek.worker_of_period.total_tokens >= 1000 ? `${(workerWeek.worker_of_period.total_tokens / 1000).toFixed(0)}K` : workerWeek.worker_of_period.total_tokens} tokens
                    </span>
                  </div>
                </div>
              )}

              {/* Leaderboard table */}
              {workerWeek.leaderboard.length > 0 && (
                <div className="space-y-1.5">
                  {workerWeek.leaderboard.slice(0, 5).map((agent, i) => {
                    const staticAgent = STATIC_AGENTS.find(a => a.id === agent.agent_id)
                    const maxTokens = workerWeek.leaderboard[0]?.total_tokens || 1
                    const barWidth = Math.max(5, (agent.total_tokens / maxTokens) * 100)
                    return (
                      <div key={agent.agent_id} className="flex items-center gap-2">
                        <span className="text-[10px] w-3 text-right" style={{ color: i === 0 ? '#facc15' : '#555' }}>
                          {i + 1}
                        </span>
                        <span className="text-[11px] w-20 truncate" style={{ color: '#999' }}>
                          {staticAgent?.name || agent.agent_id}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${barWidth}%`,
                              background: i === 0 ? '#facc15' : i === 1 ? '#a78bfa' : '#333',
                            }}
                          />
                        </div>
                        <span className="text-[10px] w-12 text-right" style={{ color: '#555' }}>
                          {agent.total_tokens >= 1000 ? `${(agent.total_tokens / 1000).toFixed(0)}K` : agent.total_tokens}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {workerWeek.leaderboard.length === 0 && (
                <p className="text-xs text-white/20 text-center py-2">No agent activity yet</p>
              )}
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
          </div>
          }
        </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
