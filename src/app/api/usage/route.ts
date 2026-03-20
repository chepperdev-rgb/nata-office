import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const SESSIONS_PATH = '/Users/a1/.openclaw/agents/main/sessions/sessions.json'
const CONTEXT_WINDOW = 1_000_000
const SUBSCRIPTION_MESSAGES_PER_WINDOW = 900
const SUBSCRIPTION_WINDOW_HOURS = 5

export interface DailyUsage {
  date: string
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
  totalCost: number
  inputCost: number
  outputCost: number
  cacheReadCost: number
  cacheWriteCost: number
}

export interface UsageData {
  // Cost data from openclaw CLI
  days: number
  daily: DailyUsage[]
  totals: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
    totalTokens: number
    totalCost: number
    inputCost: number
    outputCost: number
    cacheReadCost: number
    cacheWriteCost: number
  }
  // Session data from sessions.json
  session: {
    key: string
    model: string
    contextTokens: number
    contextWindowSize: number
    contextPercent: number
    totalTokens: number
    inputTokens: number
    outputTokens: number
    cacheRead: number
    cacheWrite: number
  }
  // Subscription info
  subscription: {
    messagesPerWindow: number
    windowHours: number
  }
  // Today's data extracted for convenience
  today: DailyUsage | null
}

export async function GET() {
  try {
    // ── 1. Get cost data from openclaw CLI ───────────────────────────────────
    let costData: { days: number; daily: DailyUsage[]; totals: UsageData['totals'] }
    try {
      const raw = execSync('/opt/homebrew/bin/openclaw gateway usage-cost --json', {
        timeout: 10_000,
        encoding: 'utf-8',
      })
      costData = JSON.parse(raw)
    } catch (e) {
      return NextResponse.json(
        { error: `Failed to run openclaw: ${String(e)}` },
        { status: 500 }
      )
    }

    // ── 2. Read session data from sessions.json ───────────────────────────────
    let sessionInfo: UsageData['session']
    try {
      const raw = readFileSync(SESSIONS_PATH, 'utf-8')
      const sessions = JSON.parse(raw)

      // Try primary key first, then fallback keys
      const primaryKey = 'agent:main:telegram:direct:732380468'
      const fallbackKey = 'agent:main:main'

      const sess = sessions[primaryKey] ?? sessions[fallbackKey]
      const usedKey = sessions[primaryKey] ? primaryKey : fallbackKey

      const contextTokens: number = sess?.contextTokens ?? sess?.totalTokens ?? 0
      const contextWindowSize: number = CONTEXT_WINDOW

      sessionInfo = {
        key: usedKey,
        model: sess?.model ?? 'claude-sonnet-4-6',
        contextTokens,
        contextWindowSize,
        contextPercent: Math.min(100, Math.round((contextTokens / contextWindowSize) * 100 * 10) / 10),
        totalTokens: sess?.totalTokens ?? 0,
        inputTokens: sess?.inputTokens ?? 0,
        outputTokens: sess?.outputTokens ?? 0,
        cacheRead: sess?.cacheRead ?? 0,
        cacheWrite: sess?.cacheWrite ?? 0,
      }
    } catch (e) {
      // Sessions file not readable — use defaults
      sessionInfo = {
        key: 'unknown',
        model: 'claude-sonnet-4-6',
        contextTokens: 0,
        contextWindowSize: CONTEXT_WINDOW,
        contextPercent: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheRead: 0,
        cacheWrite: 0,
      }
    }

    // ── 3. Extract today's data ───────────────────────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10)
    const today = costData.daily.find(d => d.date === todayStr) ?? null

    const result: UsageData = {
      days: costData.days,
      daily: costData.daily,
      totals: costData.totals,
      session: sessionInfo,
      subscription: {
        messagesPerWindow: SUBSCRIPTION_MESSAGES_PER_WINDOW,
        windowHours: SUBSCRIPTION_WINDOW_HOURS,
      },
      today,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return NextResponse.json(
      { error: `Unexpected error: ${String(e)}` },
      { status: 500 }
    )
  }
}
