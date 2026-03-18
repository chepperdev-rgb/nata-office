'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

const TERMINAL_WS_URL = process.env.NEXT_PUBLIC_TERMINAL_WS_URL || ''
const TERMINAL_TOKEN = process.env.NEXT_PUBLIC_TERMINAL_TOKEN || 'nataly-terminal-2026'

export default function TerminalPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<import('@xterm/addon-fit').FitAddon | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  const connect = useCallback(async () => {
    if (!containerRef.current) return
    if (!TERMINAL_WS_URL) {
      setError('Terminal URL not configured')
      return
    }

    const { Terminal } = await import('@xterm/xterm')
    const { FitAddon } = await import('@xterm/addon-fit')
    const { WebLinksAddon } = await import('@xterm/addon-web-links')

    // Cleanup previous
    if (termRef.current) { termRef.current.dispose(); termRef.current = null }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }

    const isMobile = window.innerWidth < 640

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

    // WebSocket
    const ws = new WebSocket(`${TERMINAL_WS_URL}?token=${TERMINAL_TOKEN}`)
    wsRef.current = ws

    term.write('\r\n\x1b[1;32m⚡ Connecting to Mac Studio...\x1b[0m\r\n')

    ws.onopen = () => {
      setConnected(true)
      setError('')
      term.write('\x1b[1;32m✅ Connected!\x1b[0m\r\n\r\n')
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

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

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
    const timer = setTimeout(connect, 150)
    return () => {
      clearTimeout(timer)
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
      if (termRef.current) { termRef.current.dispose(); termRef.current = null }
    }
  }, [connect])

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header bar — compact, mobile-friendly */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0d0d0d' }}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-white/30 hover:text-white/60 transition-colors"
            title="Back to Office"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-[11px] font-mono font-semibold tracking-wider" style={{ color: '#00ff88' }}>
            TERMINAL
          </span>
          <span className="text-[10px] font-mono text-white/20 hidden sm:inline">
            Mac Studio M2 Max
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono ${connected ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}
          >
            {connected ? '● LIVE' : '○ OFFLINE'}
          </span>
          {error && <span className="text-[10px] text-red-400 font-mono hidden sm:inline">{error}</span>}
          <button
            onClick={connect}
            className="text-[10px] font-mono px-2 py-1 rounded border border-white/10 hover:border-green-400/50 text-white/40 hover:text-green-400 transition-all"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Terminal — fills ALL remaining space */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ padding: '4px' }}
      />
    </div>
  )
}
