'use client'

import useSWR from 'swr'
import type { Task, TaskStatus } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useTasks() {
  const { data, error, mutate } = useSWR<Task[]>(
    '/api/tasks',
    fetcher,
    { refreshInterval: 10000, fallbackData: [] }
  )

  const tasks = data || []

  const createTask = async (title: string, project?: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, project, created_by: 'dan' }),
    })
    if (res.ok) mutate()
    return res.ok
  }

  const updateTask = async (id: string, updates: Partial<Task> & { moved_by?: string }) => {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) mutate()
    return res.ok
  }

  const moveTask = async (id: string, status: TaskStatus) => {
    return updateTask(id, { status, moved_by: 'dan' })
  }

  const deleteTask = async (id: string) => {
    return updateTask(id, { status: 'deleted' as TaskStatus, moved_by: 'dan' })
  }

  const restoreTask = async (id: string) => {
    return updateTask(id, { status: 'planning' as TaskStatus, moved_by: 'dan' })
  }

  return { tasks, error, mutate, createTask, moveTask, deleteTask, restoreTask, updateTask }
}
