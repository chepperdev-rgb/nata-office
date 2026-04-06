'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

const TERMINAL_WS_URL = process.env.NEXT_PUBLIC_TERMINAL_WS_URL || ''
const TERMINAL_TOKEN = process.env.NEXT_PUBLIC_TERMINAL_TOKEN || 'nataly-terminal-2026'
const TERMINAL_PIN = process.env.NEXT_PUBLIC_TERMINAL_PIN || '1991'

const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000, 15000] // exponential backoff

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = () => {
    if (pin === TERMINAL_PIN) {
      sessionStorage.setItem('terminal-pin-ok', '1')
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className={`flex flex-col items-center gap-6 ${shake ? 'animate-shake' : ''}`}>
        <div className="text-[11px] font-mono tracking-[0.3em] text-white/20 uppercase">Terminal Access</div>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border transition-all duration-200"
              style={{
                borderColor: error ? '#f44747' : pin.length > i ? '#6366f1' : 'rgba(255,255,255,0.15)',
                background: pin.length > i ? '#6366f1' : 'transparent',
              }}
            />
          ))}
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => { setError(false); setPin(e.target.value.replace(/\D/g, '')) }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          className="w-0 h-0 opacity-0 absolute"
          autoFocus
        />
        {/* Visible tap area for mobile */}
        <div
          className="flex gap-2 flex-wrap justify-center max-w-[220px]"
          style={{ marginTop: 8 }}
        >
          {[1,2,3,4,5,6,7,8,9,0].map(n => (
            <button
              key={n}
              onClick={() => {
                setError(false)
                const next = (pin + n).slice(0, 4)
                setPin(next)
                if (next.length === 4) {
                  setTimeout(() => {
                    if (next === TERMINAL_PIN) {
                      sessionStorage.setItem('terminal-pin-ok', '1')
                      onUnlock()
                    } else {
                      setError(true)
                      setShake(true)
                      setPin('')
                      setTimeout(() => setShake(false), 500)
                    }
                  }, 150)
                }
              }}
              className="w-14 h-14 rounded-xl font-mono text-lg text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/8 active:scale-95"
            >
              {n}
            </button>
          ))}
        </div>
        {error && (
          <div className="text-[10px] font-mono text-red-400/70">Wrong PIN</div>
        )}
      </div>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}

export default function TerminalPage() {
  const [unlocked, setUnlocked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clientPingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onDataDisposableRef = useRef<{ dispose: () => void } | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<string | null>(null)

  // Check if already unlocked this session
  useEffect(() => {
    if (sessionStorage.getItem('terminal-pin-ok') === '1') setUnlocked(true)
  }, [])

  // Read profile from URL and restore session ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('profile')
    setProfile(p)
    const key = p ? `terminal-session-id-${p}` : 'terminal-session-id'
    const saved = sessionStorage.getItem(key)
    if (saved) sessionIdRef.current = saved
  }, [])

  const connectWs = useCallback(() => {
    if (!termRef.current || !TERMINAL_WS_URL) return

    // Dispose previous onData listener to prevent accumulation
    if (onDataDisposableRef.current) {
      onDataDisposableRef.current.dispose()
      onDataDisposableRef.current = null
    }

    // Close previous WS — null out handlers first to prevent ghost reconnect
    if (wsRef.current) {
      const oldWs = wsRef.current
      oldWs.onclose = null
      oldWs.onerror = null
      oldWs.onmessage = null
      oldWs.onopen = null
      oldWs.close()
      wsRef.current = null
    }
    if (clientPingTimerRef.current) {
      clearInterval(clientPingTimerRef.current)
      clientPingTimerRef.current = null
    }

    const term = termRef.current
    const fitAddon = fitRef.current
    const dims = fitAddon?.proposeDimensions()

    // Build URL with session ID for reconnect
    const params = new URLSearchParams(window.location.search)
    const prof = params.get('profile')
    let url = `${TERMINAL_WS_URL}?token=${TERMINAL_TOKEN}`
    if (sessionIdRef.current) url += `&session=${sessionIdRef.current}`
    if (dims) url += `&cols=${dims.cols}&rows=${dims.rows}`
    if (prof) url += `&profile=${prof}`

    let sessionExited = false
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setReconnecting(false)
      setError('')
      reconnectAttemptRef.current = 0

      if (!sessionIdRef.current) {
        term.write('\r\n\x1b[38;5;245m  Connected.\x1b[0m\r\n\r\n')
      }

      // Send resize
      if (dims) ws.send(JSON.stringify({ type: 'resize', data: { cols: dims.cols, rows: dims.rows } }))

      // Client-side keepalive
      clientPingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 20000)
    }

    ws.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data)
        if (type === 'output') {
          term.write(data)
        } else if (type === 'session') {
          sessionIdRef.current = data
          const sKey = prof ? `terminal-session-id-${prof}` : 'terminal-session-id'
          sessionStorage.setItem(sKey, data)
        } else if (type === 'replay') {
          term.clear()
          term.write(data)
        } else if (type === 'exit') {
          term.write('\r\n\x1b[38;5;245m  Session ended.\x1b[0m\r\n')
          setConnected(false)
          sessionIdRef.current = null
          const exitKey = prof ? `terminal-session-id-${prof}` : 'terminal-session-id'
          sessionStorage.removeItem(exitKey)
          sessionExited = true // don't auto-reconnect on clean exit
        } else if (type === 'error') {
          term.write(`\r\n\x1b[1;31m${data}\x1b[0m\r\n`)
          setError(data)
        }
      } catch {
        term.write(e.data)
      }
    }

    ws.onerror = () => {
      setError('Connection failed')
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
      if (clientPingTimerRef.current) {
        clearInterval(clientPingTimerRef.current)
        clientPingTimerRef.current = null
      }

      // Auto-reconnect unless session exited cleanly or WS was replaced
      if (!sessionExited && wsRef.current === ws) {
        scheduleReconnect()
      }
    }

    // Register onData and store disposable
    onDataDisposableRef.current = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return
    const attempt = reconnectAttemptRef.current
    const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)]
    reconnectAttemptRef.current = attempt + 1
    setReconnecting(true)

    if (termRef.current) {
      termRef.current.write(`\r\n\x1b[38;5;245m  Reconnecting in ${delay / 1000}s...\x1b[0m`)
    }

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null
      connectWs()
    }, delay)
  }, [connectWs])

  // Initial setup — create terminal once, then connect WS
  const initTerminal = useCallback(async () => {
    if (!containerRef.current || termRef.current) return
    if (!TERMINAL_WS_URL) {
      setError('Terminal URL not configured')
      return
    }

    const { Terminal } = await import('@xterm/xterm')
    const { FitAddon } = await import('@xterm/addon-fit')
    const { WebLinksAddon } = await import('@xterm/addon-web-links')

    const isMobile = window.innerWidth < 640

    const term = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#264f78',
        selectionForeground: '#ffffff',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#dcdcaa',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
      fontSize: isMobile ? 11 : 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 2000,
      allowTransparency: true,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitRef.current = fitAddon

    term.write('\r\n\x1b[38;5;245m  Connecting to Mac Studio...\x1b[0m\r\n')

    connectWs()
  }, [connectWs])

  // Init on mount
  useEffect(() => {
    const timer = setTimeout(initTerminal, 150)
    return () => {
      clearTimeout(timer)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (clientPingTimerRef.current) clearInterval(clientPingTimerRef.current)
      if (onDataDisposableRef.current) { onDataDisposableRef.current.dispose(); onDataDisposableRef.current = null }
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null }
      if (termRef.current) { termRef.current.dispose(); termRef.current = null }
    }
  }, [initTerminal])

  // Visibility change — reconnect immediately when Safari comes back
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Page is visible again — check if WS is dead
        const ws = wsRef.current
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          // Cancel any pending reconnect and reconnect now
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
          }
          reconnectAttemptRef.current = 0
          connectWs()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [connectWs])

  // Window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitRef.current) {
        fitRef.current.fit()
        const dims = fitRef.current.proposeDimensions()
        if (dims && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'resize', data: { cols: dims.cols, rows: dims.rows } }))
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectAttemptRef.current = 0
    connectWs()
  }, [connectWs])

  const handleNewSession = useCallback(() => {
    sessionIdRef.current = null
    const nKey = profile ? `terminal-session-id-${profile}` : 'terminal-session-id'
    sessionStorage.removeItem(nKey)
    if (termRef.current) {
      termRef.current.clear()
      termRef.current.write('\r\n\x1b[38;5;245m  Starting new session...\x1b[0m\r\n')
    }
    handleReconnect()
  }, [handleReconnect])

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-white/30 hover:text-white/60 transition-colors p-2.5"
            title="Back to Office"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-[11px] font-mono font-semibold tracking-wider" style={{ color: '#aeafad' }}>
            TERMINAL
          </span>
          <span className="text-[10px] font-mono text-white/20 hidden sm:inline">
            Mac Studio M2 Max
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-2">
            <a
              href="/terminal"
              className={`text-[10px] font-mono px-2.5 py-1.5 rounded transition-all ${
                !profile
                  ? 'text-blue-400 bg-blue-400/15 border border-blue-400/30'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
              }`}
            >
              Auth 1
            </a>
            <a
              href="/terminal?profile=auth2"
              className={`text-[10px] font-mono px-2.5 py-1.5 rounded transition-all ${
                profile === 'auth2'
                  ? 'text-purple-400 bg-purple-400/15 border border-purple-400/30'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
              }`}
            >
              Auth 2
            </a>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono leading-none ${
              connected
                ? 'text-green-400 bg-green-400/10'
                : reconnecting
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-red-400 bg-red-400/10'
            }`}
          >
            {connected ? 'LIVE' : reconnecting ? 'RECONNECTING' : 'OFFLINE'}
          </span>
          <button
            onClick={handleReconnect}
            className="text-[10px] font-mono px-3 py-2 rounded border border-white/10 hover:border-white/30 text-white/40 hover:text-white/70 transition-all"
          >
            Reconnect
          </button>
          <button
            onClick={handleNewSession}
            className="text-[10px] font-mono px-3 py-2 rounded border border-white/10 hover:border-white/30 text-white/40 hover:text-white/70 transition-all"
            title="Start fresh session"
          >
            New
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ padding: '8px 12px 12px 12px', touchAction: 'none' }}
      />
    </div>
  )
}
