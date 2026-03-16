import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MOCK_ACTIONS = [
  'analyzing codebase',
  'api endpoints check',
  'metrics collected',
  'running tests',
  'deploying service',
  'reviewing PR #42',
  'scanning dependencies',
  'generating report',
  'indexing data',
  'health check passed',
  'cache invalidated',
  'schema migration',
  'building assets',
  'monitoring alerts',
  'backup completed',
]

const MOCK_AGENTS = [
  'miron', 'backend', 'frontend', 'designer', 'data',
  'analyst', 'scraper', 'qa', 'security', 'devops',
  'growth', 'content', 'ig-oracle', 'artem', 'pm',
]

function generateMockLines(count: number) {
  const lines = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const t = new Date(now - (count - i) * 3000)
    lines.push({
      id: `mock-${i}`,
      time: t.toTimeString().slice(0, 8),
      agent: MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)],
      action: MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)],
    })
  }
  return lines
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('office_activity_log')
      .select('id, agent_id, action, details, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !data || data.length === 0) {
      return NextResponse.json(generateMockLines(20))
    }

    const lines = data.reverse().map(row => ({
      id: String(row.id),
      time: new Date(row.created_at).toTimeString().slice(0, 8),
      agent: row.agent_id ?? 'system',
      action: row.action ?? row.details ?? '...',
    }))

    return NextResponse.json(lines)
  } catch {
    return NextResponse.json(generateMockLines(20))
  }
}
