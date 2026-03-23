'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

const TERMINAL_WS_URL = process.env.NEXT_PUBLIC_TERMINAL_WS_URL || ''
const TERMINAL_TOKEN = process.env.NEXT_PUBLIC_TERMINAL_TOKEN || 'nataly-terminal-2026'

const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000, 15000] // exponential backoff

export default function TerminalPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalCloseRef = useRef(false)
  const clientPingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [error, setError] = useState('')

  // Restore session ID from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('terminal-session-id')
    if (saved) sessionIdRef.current = saved
  }, [])

  const connectWs = useCallback(() => {
    if (!termRef.current || !TERMINAL_WS_URL) return

    // Close previous WS
    if (wsRef.current) {
      intentionalCloseRef.current = true
      wsRef.current.close()
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
    let url = `${TERMINAL_WS_URL}?token=${TERMINAL_TOKEN}`
    if (sessionIdRef.current) url += `&session=${sessionIdRef.current}`
    if (dims) url += `&cols=${dims.cols}&rows=${dims.rows}`

    const ws = new WebSocket(url)
    wsRef.current = ws
    intentionalCloseRef.current = false

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
          // Server sent session ID — save it
          sessionIdRef.current = data
          sessionStorage.setItem('terminal-session-id', data)
        } else if (type === 'replay') {
          // Reconnect replay — clear screen and write buffer
          term.clear()
          term.write(data)
        } else if (type === 'exit') {
          term.write('\r\n\x1b[38;5;245m  Session ended.\x1b[0m\r\n')
          setConnected(false)
          sessionIdRef.current = null
          sessionStorage.removeItem('terminal-session-id')
          intentionalCloseRef.current = true // don't auto-reconnect on exit
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

      if (!intentionalCloseRef.current) {
        // Auto-reconnect with backoff
        scheduleReconnect()
      }
    }

    term.onData((data) => {
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
      intentionalCloseRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (clientPingTimerRef.current) clearInterval(clientPingTimerRef.current)
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
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
    sessionStorage.removeItem('terminal-session-id')
    if (termRef.current) {
      termRef.current.clear()
      termRef.current.write('\r\n\x1b[38;5;245m  Starting new session...\x1b[0m\r\n')
    }
    handleReconnect()
  }, [handleReconnect])

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-white/30 hover:text-white/60 transition-colors p-1"
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
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/10 hover:border-white/30 text-white/40 hover:text-white/70 transition-all"
          >
            Reconnect
          </button>
          <button
            onClick={handleNewSession}
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/10 hover:border-white/30 text-white/40 hover:text-white/70 transition-all"
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
        style={{ padding: '8px 12px 12px 12px' }}
      />
    </div>
  )
}
