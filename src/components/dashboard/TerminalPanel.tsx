'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const TERMINAL_WS_URL = process.env.NEXT_PUBLIC_TERMINAL_WS_URL || ''
const TERMINAL_TOKEN = process.env.NEXT_PUBLIC_TERMINAL_TOKEN || 'nataly-terminal-2026'

interface TerminalPanelProps {
  open: boolean
}

export default function TerminalPanel({ open }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  const connect = useCallback(async () => {
    if (!containerRef.current) return
    if (!TERMINAL_WS_URL) {
      setError('TERMINAL_WS_URL not configured')
      return
    }

    // Dynamic import xterm (client-only)
    const { Terminal } = await import('@xterm/xterm')
    const { FitAddon } = await import('@xterm/addon-fit')
    const { WebLinksAddon } = await import('@xterm/addon-web-links')

    // Cleanup previous
    if (termRef.current) { termRef.current.dispose(); termRef.current = null }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }

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

    // WebSocket
    const wsUrl = `${TERMINAL_WS_URL}?token=${TERMINAL_TOKEN}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    term.write('\r\n\x1b[1;32m⚡ Connecting to Mac Studio...\x1b[0m\r\n')

    ws.onopen = () => {
      setConnected(true)
      setError('')
      term.write('\x1b[1;32m✅ Connected!\x1b[0m\r\n\r\n')
      // Send initial resize
      const dims = fitAddon.proposeDimensions()
      if (dims) ws.send(JSON.stringify({ type: 'resize', data: { cols: dims.cols, rows: dims.rows } }))
    }

    ws.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data)
        if (type === 'output') term.write(data)
        else if (type === 'exit') {
          term.write('\r\n\x1b[1;31m[Session ended]\x1b[0m\r\n')
          setConnected(false)
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
      term.write('\r\n\x1b[1;31m❌ Connection error\x1b[0m\r\n')
    }

    ws.onclose = () => {
      setConnected(false)
      term.write('\r\n\x1b[33m[Disconnected]\x1b[0m\r\n')
    }

    // Terminal input → WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    // Resize handler
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

  useEffect(() => {
    if (open) {
      const timer = setTimeout(connect, 100)
      return () => clearTimeout(timer)
    } else {
      // Cleanup on close
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
      if (termRef.current) { termRef.current.dispose(); termRef.current = null }
      setConnected(false)
    }
  }, [open, connect])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#888' }}>TERMINAL</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${connected ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {connected ? '● LIVE' : '○ OFFLINE'}
          </span>
          {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
        </div>
        <button
          onClick={connect}
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
