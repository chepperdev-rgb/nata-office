import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'today'

  const now = new Date()
  let since: string

  if (period === 'today') {
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  } else if (period === 'week') {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  } else {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  const { data, error } = await supabase
    .from('office_agent_sessions')
    .select('agent_id, tokens_in, tokens_out, tokens_total, status, started_at')
    .gte('started_at', since)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by agent
  const stats: Record<string, {
    agent_id: string
    total_sessions: number
    total_tokens: number
    total_tokens_in: number
    total_tokens_out: number
    completed: number
    errors: number
  }> = {}

  for (const row of data || []) {
    const aid = row.agent_id
    if (!stats[aid]) {
      stats[aid] = {
        agent_id: aid,
        total_sessions: 0,
        total_tokens: 0,
        total_tokens_in: 0,
        total_tokens_out: 0,
        completed: 0,
        errors: 0,
      }
    }
    stats[aid].total_sessions++
    stats[aid].total_tokens += row.tokens_total || 0
    stats[aid].total_tokens_in += row.tokens_in || 0
    stats[aid].total_tokens_out += row.tokens_out || 0
    if (row.status === 'completed') stats[aid].completed++
    if (row.status === 'error') stats[aid].errors++
  }

  // Sort by total_tokens descending
  const sorted = Object.values(stats).sort((a, b) => b.total_tokens - a.total_tokens)

  return NextResponse.json({
    period,
    since,
    worker_of_period: sorted[0] || null,
    leaderboard: sorted.slice(0, 10),
    total_sessions: (data || []).length,
    total_tokens: sorted.reduce((sum, s) => sum + s.total_tokens, 0),
  })
}
