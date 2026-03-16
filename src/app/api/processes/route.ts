import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('office_activity_log')
      .select('id, agent_id, action, created_at')
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !data) {
      return NextResponse.json([])
    }

    const lines = data.reverse().map(row => ({
      id: String(row.id),
      time: row.created_at, // raw ISO — formatted client-side in user's timezone
      agent: row.agent_id ?? 'system',
      action: row.action ?? '...',
    }))

    return NextResponse.json(lines)
  } catch {
    return NextResponse.json([])
  }
}
