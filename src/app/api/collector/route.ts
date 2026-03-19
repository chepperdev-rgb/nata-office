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
    cpu_cores?: number
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
  nataly_processes?: Array<{
    name: string
    pid: number
    cpu: string
    mem: string
    since: string
  }>
  activity?: Array<{
    agent_id: string
    action: string
  }>
  sessions?: Array<{
    session_id: string
    session_key: string
    agent_id: string
    task_summary: string | null
    model: string
    tokens_in: number
    tokens_out: number
    tokens_total: number
    status: string
    age_ms: number
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

  // Upsert metrics on fixed ID (avoids blank flicker from DELETE→INSERT race)
  const { error: metricsError } = await supabase
    .from('office_system_metrics')
    .upsert({
      id: 1,
      ...body.system,
      updated_at: now,
    }, { onConflict: 'id' })

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

  // Store nataly_processes snapshot as a special service record
  if (body.nataly_processes && body.nataly_processes.length > 0) {
    await supabase
      .from('office_service_status')
      .upsert({
        service_id: 'nataly_processes',
        status: 'running',
        display_name: 'Nataly Processes',
        details: { processes: body.nataly_processes },
        updated_at: now,
      }, { onConflict: 'service_id' })
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

  // Always log activity — working agents first, then system heartbeat if nothing active
  const activityEntries: Array<{ agent_id: string; action: string }> = []

  if (body.activity && body.activity.length > 0) {
    activityEntries.push(...body.activity)
  }

  // Log system metrics heartbeat every collector run
  const workingCount = body.agents.filter(a => a.status === 'working').length
  if (workingCount > 0) {
    activityEntries.push({
      agent_id: 'system',
      action: `${workingCount} agent${workingCount !== 1 ? 's' : ''} active — CPU ${body.system.cpu_percent}%`,
    })
  } else {
    // Rotate through system events to keep activity log alive
    const userbot = body.services.find(s => s.service_id === 'userbot')
    const gateway = body.services.find(s => s.service_id === 'gateway')
    const minute = new Date(now).getMinutes()
    const events = [
      `System metrics: CPU ${body.system.cpu_percent}% · RAM ${body.system.ram_percent}%`,
      `Userbot ${userbot?.status ?? '?'} · Gateway ${gateway?.status ?? '?'}`,
      `Disk ${body.system.disk_percent}% used · Uptime ${Math.floor(body.system.uptime_seconds / 3600)}h`,
      `All agents on standby — ready for tasks`,
      `System heartbeat — all services nominal`,
    ]
    activityEntries.push({
      agent_id: 'system',
      action: events[minute % events.length],
    })
  }

  if (activityEntries.length > 0) {
    const activityRows = activityEntries.map(a => ({
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

  // Store agent session history
  if (body.sessions && body.sessions.length > 0) {
    const sessionRows = body.sessions.map(s => ({
      session_id: s.session_id,
      session_key: s.session_key,
      agent_id: s.agent_id,
      task_summary: s.task_summary,
      model: s.model,
      tokens_in: s.tokens_in,
      tokens_out: s.tokens_out,
      tokens_total: s.tokens_total,
      status: s.status,
      started_at: new Date(Date.now() - s.age_ms).toISOString(),
      finished_at: s.status === 'completed' ? now : null,
      source: 'openclaw',
      updated_at: now,
    }))
    await supabase
      .from('office_agent_sessions')
      .upsert(sessionRows, { onConflict: 'session_id' })
  }

  // Prune old activity (keep last 200 rows)
  const { data: oldRows } = await supabase
    .from('office_activity_log')
    .select('id')
    .order('created_at', { ascending: false })
    .range(200, 9999)
  if (oldRows && oldRows.length > 0) {
    const ids = oldRows.map((r: { id: number }) => r.id)
    await supabase.from('office_activity_log').delete().in('id', ids)
  }

  return NextResponse.json({ ok: true })
}
