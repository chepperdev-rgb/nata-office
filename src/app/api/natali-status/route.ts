import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Get natali status from service_status table (populated by collector)
  const { data: services } = await supabase
    .from('office_service_status')
    .select('*')

  const { data: metrics } = await supabase
    .from('office_system_metrics')
    .select('updated_at, cpu_percent')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const gateway = services?.find(s => s.service_id === 'gateway')
  const userbot = services?.find(s => s.service_id === 'userbot')

  // Determine Natali overall status
  const lastUpdate = metrics?.updated_at ? new Date(metrics.updated_at) : null
  const isCollectorAlive = lastUpdate ? (Date.now() - lastUpdate.getTime()) < 5 * 60 * 1000 : false
  const gatewayOk = gateway?.status === 'running'
  const userbotOk = userbot?.status === 'running'

  const overallStatus = !isCollectorAlive
    ? 'offline'
    : gatewayOk && userbotOk
    ? 'online'
    : gatewayOk
    ? 'degraded'
    : 'error'

  // Claude processes count from details
  const claudeProcesses = (gateway?.details as Record<string, unknown>)?.claude_processes ?? null

  return NextResponse.json({
    status: overallStatus,
    gateway: gateway?.status ?? 'unknown',
    userbot: userbot?.status ?? 'unknown',
    claude_processes: claudeProcesses,
    last_seen: metrics?.updated_at ?? null,
    collector_alive: isCollectorAlive,
  })
}
