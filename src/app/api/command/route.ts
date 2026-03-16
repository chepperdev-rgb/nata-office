import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_COMMANDS = ['restart_gateway', 'restart_userbot', 'run_collector', 'clear_cache']

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.RESTART_SECRET || 'nataly-restart-2026'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { command } = await request.json().catch(() => ({})) as { command?: string }
  if (!command || !ALLOWED_COMMANDS.includes(command)) {
    return NextResponse.json({ error: 'Invalid command' }, { status: 400 })
  }

  const { error } = await supabase
    .from('office_commands')
    .insert({ command, status: 'pending' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, command, status: 'queued' })
}
