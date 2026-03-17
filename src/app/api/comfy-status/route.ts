import { NextResponse } from 'next/server'

const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188'

export async function GET() {
  try {
    const res = await fetch(`${COMFY_URL}/queue`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error('not ok')
    const data = await res.json()
    return NextResponse.json({ status: 'online', queue: data })
  } catch {
    return NextResponse.json({ status: 'offline' }, { status: 200 })
  }
}
