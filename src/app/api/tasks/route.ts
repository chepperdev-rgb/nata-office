import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: list tasks
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeDeleted = searchParams.get('include_deleted') === 'true'

  let query = supabase
    .from('office_tasks')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (!includeDeleted) {
    query = query.neq('status', 'deleted')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST: create task
export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, priority, project, assigned_to, created_by } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  // Get max position in planning column
  const { data: maxRow } = await supabase
    .from('office_tasks')
    .select('position')
    .eq('status', 'planning')
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (maxRow?.[0]?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('office_tasks')
    .insert({
      title: title.trim(),
      description: description || null,
      priority: priority || 2,
      project: project || null,
      assigned_to: assigned_to || null,
      created_by: created_by || 'dan',
      status: 'planning',
      position: nextPosition,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH: update task (status, position, title, etc.)
export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('office_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
