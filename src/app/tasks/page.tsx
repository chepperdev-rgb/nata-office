'use client'

import Link from 'next/link'
import TaskBoard from '@/components/tasks/TaskBoard'

export default function TasksPage() {
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#080808' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-white/30 hover:text-white/60 transition-colors p-1"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-[11px] font-mono font-semibold tracking-wider" style={{ color: '#f59e0b' }}>
            TASKS
          </span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <TaskBoard />
      </div>
    </div>
  )
}
