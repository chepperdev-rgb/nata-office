'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import type { Task } from '@/types'

const COLUMN_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  planning: { label: 'Planning', color: '#f59e0b', emoji: '📋' },
  in_progress: { label: 'In Progress', color: '#3b82f6', emoji: '⚡' },
  done: { label: 'Done', color: '#4ade80', emoji: '✓' },
}

interface TaskColumnProps {
  status: string
  tasks: Task[]
  onDelete: (id: string) => void
  children?: React.ReactNode
}

export default function TaskColumn({ status, tasks, onDelete, children }: TaskColumnProps) {
  const config = COLUMN_CONFIG[status] || { label: status, color: '#666', emoji: '' }
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-h-[200px] sm:min-h-[400px] rounded-2xl transition-colors"
      style={{
        background: isOver ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isOver ? config.color + '40' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs">{config.emoji}</span>
          <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: config.color + '15', color: config.color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Create form slot (only for planning) */}
      {children}

      {/* Task cards */}
      <div className="flex-1 px-2 pb-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="text-[11px] text-white/15">Drop tasks here</span>
          </div>
        )}
      </div>
    </div>
  )
}
