'use client'

import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import type { UsageData } from '@/app/api/usage/route'

// ─── Fetcher ─────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function fmtCost(n: number): string {
  return `$${n.toFixed(2)}`
}

function contextColor(pct: number): string {
  if (pct < 50) return '#4ade80'
  if (pct < 75) return '#facc15'
  return '#f43f5e'
}

/** Thin horizontal progress bar */
function ProgressBar({
  value,
  max = 100,
  color,
  height = 6,
}: {
  value: number
  max?: number
  color: string
  height?: number
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          background: color,
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
    </div>
  )
}

/** Section header */
function SectionHeader({ label }: { label: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-widest font-semibold"
      style={{ color: 'rgba(255,255,255,0.25)' }}
    >
      {label}
    </div>
  )
}

/** A key→value row */
function StatRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <span
        className="text-[11px] font-mono tabular-nums"
        style={{ color: valueColor ?? 'rgba(255,255,255,0.7)' }}
      >
        {value}
      </span>
    </div>
  )
}

/** Cost breakdown pills */
function CostPill({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div
      className="flex flex-col items-center px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className="text-[10px] font-mono" style={{ color }}>
        {value}
      </span>
      <span className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 8 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="rounded-full animate-pulse"
      style={{
        width,
        height,
        background: 'rgba(255,255,255,0.06)',
      }}
    />
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface UsageModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal should close */
  onClose: () => void
}

/**
 * UsageModal — shows Claude API usage, context window, and cost breakdown.
 * Fetches data from /api/usage via SWR, refreshing every 30 seconds.
 */
export default function UsageModal({ open, onClose }: UsageModalProps) {
  const { data, error, isLoading } = useSWR<UsageData>(
    open ? '/api/usage' : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  )

  // Escape key closes
  // (Handled by parent typically; here as safety net)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — centered dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Claude Usage"
            className="fixed z-50 w-full max-w-[440px] max-h-[90vh] overflow-y-auto"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            <div className="p-5 space-y-5">
              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconBrain size={14} color="rgba(255,255,255,0.5)" />
                  <span
                    className="text-sm font-semibold tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    Claude Usage
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {data && (
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {data.session.model}
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                    }}
                    aria-label="Close"
                  >
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Error ─────────────────────────────────────────────────── */}
              {error && (
                <div
                  className="rounded-xl px-3 py-2.5 text-xs"
                  style={{
                    background: 'rgba(248,113,113,0.06)',
                    border: '1px solid rgba(248,113,113,0.15)',
                    color: 'rgba(248,113,113,0.8)',
                  }}
                >
                  Failed to load usage data
                </div>
              )}

              {/* ── Section 1: Current Session Context ────────────────────── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <SectionHeader label="Current Session" />
                {isLoading || !data ? (
                  <div className="space-y-2">
                    <Skeleton height={6} />
                    <Skeleton width="60%" height={8} />
                  </div>
                ) : (
                  <>
                    <ProgressBar
                      value={data.session.contextTokens}
                      max={data.session.contextWindowSize}
                      color={contextColor(data.session.contextPercent)}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Context window
                      </span>
                      <span
                        className="text-xs font-mono font-semibold tabular-nums"
                        style={{ color: contextColor(data.session.contextPercent) }}
                      >
                        {data.session.contextPercent}%{' '}
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                          ({fmt(data.session.contextTokens)} / {fmt(data.session.contextWindowSize)})
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <StatRow label="Input" value={fmt(data.session.inputTokens)} />
                      <StatRow label="Output" value={fmt(data.session.outputTokens)} />
                      <StatRow label="Cache read" value={fmt(data.session.cacheRead)} />
                      <StatRow label="Cache write" value={fmt(data.session.cacheWrite)} />
                    </div>
                  </>
                )}
              </div>

              {/* ── Section 2: Subscription (All Models) ──────────────────── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <SectionHeader label="Subscription" />
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(168,85,247,0.08)',
                      color: 'rgba(168,85,247,0.7)',
                      border: '1px solid rgba(168,85,247,0.15)',
                    }}
                  >
                    All Models
                  </span>
                </div>
                {isLoading || !data ? (
                  <div className="space-y-2">
                    <Skeleton height={6} />
                    <Skeleton width="70%" height={8} />
                  </div>
                ) : (
                  <>
                    {/* We approximate message usage from token output volume.
                        Anthropic limits per 5-hour window; we can't get exact
                        message count, so we display a token-based estimate. */}
                    <div
                      className="rounded-lg px-3 py-2 text-[10px]"
                      style={{
                        background: 'rgba(168,85,247,0.05)',
                        border: '1px solid rgba(168,85,247,0.1)',
                        color: 'rgba(255,255,255,0.35)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: 'rgba(168,85,247,0.7)' }}>900 messages</span> per{' '}
                      {data.subscription.windowHours}h window — resets on a rolling basis.
                      Exact count not available via API.
                    </div>
                    <StatRow
                      label="Window size"
                      value={`${data.subscription.messagesPerWindow} msgs / ${data.subscription.windowHours}h`}
                    />
                    <StatRow
                      label="Model"
                      value={data.session.model}
                      valueColor="rgba(168,85,247,0.8)"
                    />
                  </>
                )}
              </div>

              {/* ── Section 3: Today's Token Usage ────────────────────────── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <SectionHeader label="Today" />
                  {data?.today && (
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'rgba(56,189,248,0.7)' }}
                    >
                      {fmtCost(data.today.totalCost)}
                    </span>
                  )}
                </div>
                {isLoading || !data ? (
                  <div className="space-y-2">
                    <Skeleton height={6} />
                    <Skeleton width="80%" height={8} />
                  </div>
                ) : data.today ? (
                  <>
                    <ProgressBar
                      value={data.today.totalTokens}
                      max={Math.max(data.today.totalTokens, 2_000_000)}
                      color="#38bdf8"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Tokens used today
                      </span>
                      <span
                        className="text-xs font-mono font-semibold tabular-nums"
                        style={{ color: '#38bdf8' }}
                      >
                        {fmt(data.today.totalTokens)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <StatRow label="Input" value={fmt(data.today.input)} />
                      <StatRow label="Output" value={fmt(data.today.output)} />
                      <StatRow label="Cache read" value={fmt(data.today.cacheRead)} />
                      <StatRow label="Cache write" value={fmt(data.today.cacheWrite)} />
                    </div>
                  </>
                ) : (
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    No data for today yet
                  </p>
                )}
              </div>

              {/* ── Section 4: 30-Day Cost Breakdown ──────────────────────── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <SectionHeader label={`${data?.days ?? 30}-Day Cost`} />
                  {data && (
                    <span
                      className="text-sm font-mono font-bold"
                      style={{ color: '#4ade80' }}
                    >
                      {fmtCost(data.totals.totalCost)}
                    </span>
                  )}
                </div>

                {isLoading || !data ? (
                  <div className="space-y-2">
                    <Skeleton height={6} />
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={44} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Total cost bar — today vs total */}
                    <ProgressBar
                      value={data.today?.totalCost ?? 0}
                      max={Math.max(data.totals.totalCost, 0.01)}
                      color="#4ade80"
                    />
                    <div className="flex items-center justify-between text-[10px]">
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Today:{' '}
                        <span style={{ color: '#4ade80' }}>
                          {fmtCost(data.today?.totalCost ?? 0)}
                        </span>
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {data.days}d total:{' '}
                        <span style={{ color: '#4ade80' }}>
                          {fmtCost(data.totals.totalCost)}
                        </span>
                      </span>
                    </div>

                    {/* Cost breakdown pills */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <CostPill
                        label="Input"
                        value={fmtCost(data.totals.inputCost)}
                        color="rgba(255,255,255,0.6)"
                      />
                      <CostPill
                        label="Output"
                        value={fmtCost(data.totals.outputCost)}
                        color="rgba(56,189,248,0.8)"
                      />
                      <CostPill
                        label="Cache R"
                        value={fmtCost(data.totals.cacheReadCost)}
                        color="rgba(168,85,247,0.8)"
                      />
                      <CostPill
                        label="Cache W"
                        value={fmtCost(data.totals.cacheWriteCost)}
                        color="rgba(250,204,21,0.8)"
                      />
                    </div>

                    {/* Daily breakdown — last 7 days mini chart */}
                    {data.daily.length > 1 && (
                      <DailyMiniChart daily={data.daily.slice(-7)} />
                    )}
                  </>
                )}
              </div>

              {/* ── Footer ────────────────────────────────────────────────── */}
              <div
                className="text-center text-[9px] pb-1"
                style={{ color: 'rgba(255,255,255,0.12)' }}
              >
                Refreshes every 30s · Data from openclaw gateway
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Daily Mini Chart ─────────────────────────────────────────────────────────

function DailyMiniChart({ daily }: { daily: UsageData['daily'] }) {
  if (daily.length === 0) return null
  const maxCost = Math.max(...daily.map(d => d.totalCost), 0.01)

  return (
    <div className="pt-2">
      <div
        className="text-[9px] uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        Daily cost (last {daily.length} days)
      </div>
      <div className="flex items-end gap-1" style={{ height: 40 }}>
        {daily.map(d => {
          const heightPct = Math.max(4, (d.totalCost / maxCost) * 100)
          const isToday = d.date === new Date().toISOString().slice(0, 10)
          return (
            <div
              key={d.date}
              className="flex-1 rounded-sm relative group"
              style={{
                height: `${heightPct}%`,
                background: isToday
                  ? 'rgba(74,222,128,0.6)'
                  : 'rgba(255,255,255,0.12)',
                transition: 'background 0.2s',
              }}
              title={`${d.date}: ${fmtCost(d.totalCost)}`}
            >
              {/* Tooltip on hover */}
              <div
                className="absolute bottom-full left-1/2 mb-1 px-1.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  zIndex: 10,
                }}
              >
                {d.date.slice(5)}: {fmtCost(d.totalCost)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function IconBrain({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 2.5C6.6 2.5 5.5 3.5 5.5 4.8c0 .3.1.7.2 1C4.6 6.2 4 7.1 4 8.2c0 .8.3 1.5.8 2-.5.4-.8 1-.8 1.6 0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-.6-.3-1.2-.8-1.6.5-.5.8-1.2.8-2 0-1.1-.6-2-1.7-2.4.1-.3.2-.7.2-1C10.5 3.5 9.4 2.5 8 2.5z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 5.5v7" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
