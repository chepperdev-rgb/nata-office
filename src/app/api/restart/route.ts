import { NextResponse } from 'next/server'

const RESTART_SECRET = process.env.RESTART_SECRET || 'nataly-restart-2026'
const COLLECTOR_ENDPOINT = process.env.COLLECTOR_INTERNAL_URL // Mac Studio collector reverse endpoint

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${RESTART_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { service } = await request.json().catch(() => ({})) as { service?: string }

  if (!COLLECTOR_ENDPOINT) {
    return NextResponse.json({
      error: 'COLLECTOR_INTERNAL_URL not configured — restart not available remotely',
      hint: 'Set COLLECTOR_INTERNAL_URL env var to enable remote restart',
    }, { status: 503 })
  }

  // Forward restart command to Mac Studio collector endpoint
  try {
    const res = await fetch(`${COLLECTOR_ENDPOINT}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESTART_SECRET}`,
      },
      body: JSON.stringify({ service: service || 'gateway' }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Could not reach Mac Studio' }, { status: 503 })
  }
}
