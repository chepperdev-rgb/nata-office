import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STATIC_AGENTS } from '@/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CollectorPayload {
  system: {
    cpu_percent: number
    ram_percent: number
    ram_used_gb: number
    ram_total_gb: number
    disk_percent: number
    uptime_seconds: number
  }
  agents: Array<{
    agent_id: string
    status: 'working' | 'idle'
    pid: number | null
    current_task: string | null
  }>
  services: Array<{
    service_id: string
    status: string
  }>
  activity?: Array<{
    agent_id: string
    action: string
  }>
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.COLLECTOR_SECRET

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CollectorPayload = await request.json()
  const now = new Date().toISOString()

  // Delete all existing rows then insert fresh metrics
  await supabase.from('office_system_metrics').delete().neq('updated_at', '')
  const { error: metricsError } = await supabase
    .from('office_system_metrics')
    .insert({
      ...body.system,
      updated_at: now,
    })

  if (metricsError) {
    return NextResponse.json({ error: metricsError.message }, { status: 500 })
  }

  if (body.agents.length > 0) {
    const agentRows = body.agents.map(a => {
      const staticAgent = STATIC_AGENTS.find(s => s.id === a.agent_id)
      return {
        agent_id: a.agent_id,
        display_name: staticAgent?.name || a.agent_id,
        role: staticAgent?.role || 'Agent',
        room: staticAgent?.room || 'dev',
        status: a.status,
        pid: a.pid,
        current_task: a.current_task,
        updated_at: now,
      }
    })
    const { error: agentsError } = await supabase
      .from('office_agent_status')
      .upsert(agentRows, { onConflict: 'agent_id' })
    if (agentsError) {
      return NextResponse.json({ error: agentsError.message }, { status: 500 })
    }
  }

  if (body.services.length > 0) {
    const serviceNames: Record<string, string> = { userbot: 'Userbot', gateway: 'Gateway' }
    const serviceRows = body.services.map(s => ({
      service_id: s.service_id,
      display_name: serviceNames[s.service_id] || s.service_id,
      status: s.status,
      updated_at: now,
    }))
    const { error: servicesError } = await supabase
      .from('office_service_status')
      .upsert(serviceRows, { onConflict: 'service_id' })
    if (servicesError) {
      return NextResponse.json({ error: servicesError.message }, { status: 500 })
    }
  }

  if (body.activity && body.activity.length > 0) {
    const activityRows = body.activity.map(a => ({
      agent_id: a.agent_id,
      action: a.action,
      created_at: now,
    }))
    const { error: activityError } = await supabase
      .from('office_activity_log')
      .insert(activityRows)
    if (activityError) {
      return NextResponse.json({ error: activityError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
