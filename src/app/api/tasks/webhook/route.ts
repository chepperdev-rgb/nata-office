import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook for Natali to create/update/poll tasks
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth || auth !== `Bearer ${process.env.COLLECTOR_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, task, since } = await request.json()

  if (action === 'create' && task?.title) {
    const { data, error } = await supabase
      .from('office_tasks')
      .insert({
        title: task.title,
        description: task.description || null,
        priority: task.priority || 2,
        project: task.project || null,
        assigned_to: task.assigned_to || null,
        created_by: task.created_by || 'natali',
        status: task.status || 'planning',
        position: 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, task: data })
  }

  if (action === 'update' && task?.id) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), moved_by: 'natali' }
    if (task.status) updates.status = task.status
    if (task.title) updates.title = task.title
    if (task.assigned_to !== undefined) updates.assigned_to = task.assigned_to

    const { data, error } = await supabase
      .from('office_tasks')
      .update(updates)
      .eq('id', task.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, task: data })
  }

  if (action === 'poll') {
    // Return tasks changed by Dan since given timestamp
    let query = supabase
      .from('office_tasks')
      .select('*')
      .eq('moved_by', 'dan')
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(20)

    if (since) {
      query = query.gte('updated_at', since)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, tasks: data || [] })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
