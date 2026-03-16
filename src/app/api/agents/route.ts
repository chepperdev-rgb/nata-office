import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STATIC_AGENTS } from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('office_agent_status')
    .select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map DB columns (agent_id, display_name) to frontend Agent type (id, name)
  // Also merge with STATIC_AGENTS to recover emoji field (not stored in DB)
  const staticMap = new Map(STATIC_AGENTS.map(a => [a.id, a]))

  const agents = (data || []).map(row => {
    const staticAgent = staticMap.get(row.agent_id) || {}
    return {
      id: row.agent_id,
      name: row.display_name,
      role: row.role,
      model: row.model,
      room: row.room,
      emoji: (staticAgent as { emoji?: string }).emoji || '🤖',
      status: row.status,
      current_task: row.current_task,
      last_active: row.last_active,
    }
  })

  return NextResponse.json(agents)
}
