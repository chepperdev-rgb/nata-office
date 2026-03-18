'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import TaskColumn from './TaskColumn'
import TaskCard from './TaskCard'
import { useTasks } from '@/hooks/useTasks'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: TaskStatus[] = ['planning', 'in_progress', 'done']

export default function TaskBoard() {
  const { tasks, createTask, moveTask, deleteTask, restoreTask } = useTasks()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position)

  const deletedTasks = tasks.filter(t => t.status === 'deleted')

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Dropped on a column
    if (COLUMNS.includes(overId as TaskStatus)) {
      moveTask(taskId, overId as TaskStatus)
      return
    }

    // Dropped on another task — find its column
    const overTask = tasks.find(t => t.id === overId)
    if (overTask && overTask.status !== tasks.find(t => t.id === taskId)?.status) {
      moveTask(taskId, overTask.status as TaskStatus)
    }
  }

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    await createTask(title)
    setNewTitle('')
  }

  return (
    <div className="flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Columns — horizontal on desktop, vertical on mobile */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 sm:p-4 overflow-auto">
          {COLUMNS.map(status => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onDelete={deleteTask}
            >
              {/* Create form only in planning column */}
              {status === 'planning' && (
                <div className="px-2 pb-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                      placeholder="New task..."
                      className="flex-1 px-3 py-2 rounded-lg text-xs text-white/80 placeholder-white/20 outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newTitle.trim()}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.2)',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </TaskColumn>
          ))}
        </div>

        {/* Drag overlay — ghost card while dragging */}
        <DragOverlay>
          {activeTask && (
            <div className="opacity-90 rotate-2 scale-105">
              <TaskCard task={activeTask} onDelete={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Deleted container */}
      <div className="px-3 sm:px-4 pb-3">
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className="flex items-center gap-2 text-[10px] text-white/20 hover:text-white/40 transition-colors py-1"
        >
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="none"
            className={`transition-transform ${showDeleted ? 'rotate-90' : ''}`}
          >
            <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1" />
          </svg>
          Deleted ({deletedTasks.length})
        </button>

        {showDeleted && deletedTasks.length > 0 && (
          <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
            {deletedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="text-[11px] text-white/30 line-through">{task.title}</span>
                <button
                  onClick={() => restoreTask(task.id)}
                  className="text-[10px] px-2 py-0.5 rounded text-white/25 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
