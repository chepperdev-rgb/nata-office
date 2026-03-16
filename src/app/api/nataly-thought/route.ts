import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SECRET = process.env.COLLECTOR_SECRET || 'nataly-collector-2026'

export async function POST(req: Request) {
  const auth = req.headers.get('x-collector-secret')
  if (auth !== SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { message, type = 'thought' } = body

  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  // Encode type as prefix since table has no status column
  const typePrefix: Record<string, string> = {
    thought: '[💭]',
    action:  '[⚡]',
    error:   '[❌]',
    done:    '[✅]',
  }
  const prefix = typePrefix[type] ?? '[💭]'

  const { error } = await supabase
    .from('office_activity_log')
    .insert({
      agent_id: 'nataly',
      action: `${prefix} ${message}`,
      created_at: new Date().toISOString(),
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data, error } = await supabase
    .from('office_activity_log')
    .select('*')
    .eq('agent_id', 'nataly')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
