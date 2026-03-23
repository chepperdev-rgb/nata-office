'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const TERMINAL_WS_URL = process.env.NEXT_PUBLIC_TERMINAL_WS_URL || ''
const TERMINAL_TOKEN = process.env.NEXT_PUBLIC_TERMINAL_TOKEN || 'nataly-terminal-2026'

const RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000, 15000]

interface TerminalPanelProps {
  open: boolean
}

export default function TerminalPanel({ open }: TerminalPanelProps) {
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

  // Restore session ID
  useEffect(() => {
    const saved = sessionStorage.getItem('terminal-panel-session-id')
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

    let url = `${TERMINAL_WS_URL}?token=${TERMINAL_TOKEN}`
    if (sessionIdRef.current) url += `&session=${sessionIdRef.current}`
    if (dims) url += `&cols=${dims.cols}&rows=${dims.rows}`

    let sessionExited = false
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setReconnecting(false)
      setError('')
      reconnectAttemptRef.current = 0

      if (!sessionIdRef.current) {
        term.write('\x1b[1;32m Connected!\x1b[0m\r\n\r\n')
      }

      if (dims) ws.send(JSON.stringify({ type: 'resize', data: { cols: dims.cols, rows: dims.rows } }))

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
          sessionStorage.setItem('terminal-panel-session-id', data)
        } else if (type === 'replay') {
          term.clear()
          term.write(data)
        } else if (type === 'exit') {
          term.write('\r\n\x1b[1;31m[Session ended]\x1b[0m\r\n')
          setConnected(false)
          sessionIdRef.current = null
          sessionStorage.removeItem('terminal-panel-session-id')
          sessionExited = true
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

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null
      connectWs()
    }, delay)
  }, [connectWs])

  const initTerminal = useCallback(async () => {
    if (!containerRef.current || termRef.current) return
    if (!TERMINAL_WS_URL) {
      setError('TERMINAL_WS_URL not configured')
      return
    }

    const { Terminal } = await import('@xterm/xterm')
    const { FitAddon } = await import('@xterm/addon-fit')
    const { WebLinksAddon } = await import('@xterm/addon-web-links')

    const term = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff88',
        cursor: '#00ff88',
        cursorAccent: '#000000',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#6272a4',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitRef.current = fitAddon

    term.write('\r\n\x1b[1;32m Connecting to Mac Studio...\x1b[0m\r\n')
    connectWs()
  }, [connectWs])

  // Mount/unmount based on `open`
  useEffect(() => {
    if (open) {
      const timer = setTimeout(initTerminal, 100)
      return () => clearTimeout(timer)
    } else {
      // Panel closed — close WS but keep session alive on server
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null }
      if (clientPingTimerRef.current) { clearInterval(clientPingTimerRef.current); clientPingTimerRef.current = null }
      if (onDataDisposableRef.current) { onDataDisposableRef.current.dispose(); onDataDisposableRef.current = null }
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null }
      if (termRef.current) { termRef.current.dispose(); termRef.current = null }
      setConnected(false)
      setReconnecting(false)
    }
  }, [open, initTerminal])

  // Visibility change — reconnect when page becomes visible
  useEffect(() => {
    if (!open) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const ws = wsRef.current
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
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
  }, [open, connectWs])

  // Resize handler
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#888' }}>TERMINAL</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${
            connected
              ? 'text-green-400 bg-green-400/10'
              : reconnecting
                ? 'text-yellow-400 bg-yellow-400/10'
                : 'text-red-400 bg-red-400/10'
          }`}>
            {connected ? '● LIVE' : reconnecting ? '● RECONNECTING' : '○ OFFLINE'}
          </span>
          {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
        </div>
        <button
          onClick={handleReconnect}
          className="text-xs font-mono px-2 py-1 rounded border border-white/10 hover:border-green-400/50 text-white/50 hover:text-green-400 transition-all"
        >
          ↺ Reconnect
        </button>
      </div>

      {/* xterm container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ padding: '8px', background: '#0a0a0a' }}
      />
    </div>
  )
}
