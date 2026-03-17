import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agent_id')
  const period = searchParams.get('period') || 'week'
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabase
    .from('office_agent_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (agentId) {
    query = query.eq('agent_id', agentId)
  }

  // Filter by period
  const now = new Date()
  if (period === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    query = query.gte('started_at', todayStart)
  } else if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('started_at', weekAgo)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
