'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types'

const PRIORITY_COLORS: Record<number, string> = {
  1: '#f43f5e',
  2: '#f59e0b',
  3: '#666',
}

const PROJECT_COLORS: Record<string, string> = {
  RSE: '#4ade80',
  SoulProfile: '#8b5cf6',
  AgentOffice: '#06b6d4',
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

interface TaskCardProps {
  task: Task
  onDelete: (id: string) => void
  isDragging?: boolean
}

export default function TaskCard({ task, onDelete, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing touch-none select-none"
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onKeyDown={(e) => { if (e.key === 'Delete') onDelete(task.id) }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 rounded-xl transition-all"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      />

      <div className="relative">
        {/* Top row: priority + project + delete */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: PRIORITY_COLORS[task.priority] || '#666' }}
            />
            {task.project && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  color: PROJECT_COLORS[task.project] || '#888',
                  background: `${PROJECT_COLORS[task.project] || '#888'}15`,
                }}
              >
                {task.project}
              </span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 hover:bg-red-400/10"
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <p className="text-[13px] text-white/80 leading-snug mb-1.5">{task.title}</p>

        {/* Footer: assignee + timestamps */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assigned_to ? (
              <span className="text-[10px] text-white/25">@{task.assigned_to}</span>
            ) : (
              <span className="text-[10px] text-white/15">—</span>
            )}
            {task.created_by === 'natali' && (
              <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(74,222,128,0.1)', color: 'rgba(74,222,128,0.5)' }}>N</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.updated_at !== task.created_at && (
              <span className="text-[9px] text-white/15" title={`Updated: ${task.updated_at}`}>upd {timeAgo(task.updated_at)}</span>
            )}
            <span className="text-[10px] text-white/20" title={`Created: ${task.created_at}`}>{timeAgo(task.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
