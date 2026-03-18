#!/usr/bin/env node
/**
 * Nataly Terminal Server
 * WebSocket + node-pty → real PTY session on Mac Studio
 * Auth via token query param
 * Keepalive ping every 25s to survive Cloudflare tunnel idle timeout
 */

const { WebSocketServer } = require('ws')
const pty = require('node-pty')
const os = require('os')

const PORT = process.env.TERMINAL_PORT || 3001
const TOKEN = process.env.TERMINAL_TOKEN || 'nataly-terminal-2026'
const PING_INTERVAL = 25000 // 25s — Cloudflare cuts at ~100s idle

const wss = new WebSocketServer({ port: PORT })

console.log(`[terminal-server] Listening on ws://localhost:${PORT}`)

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost`)
  const token = url.searchParams.get('token')

  if (token !== TOKEN) {
    console.log(`[terminal-server] Unauthorized`)
    ws.send(JSON.stringify({ type: 'error', data: 'Unauthorized\r\n' }))
    ws.close(1008, 'Unauthorized')
    return
  }

  console.log(`[terminal-server] Client connected`)

  // Spawn PTY
  const shell = process.env.SHELL || '/bin/zsh'
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    cwd: os.homedir(),
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
    },
  })

  console.log(`[terminal-server] PTY PID ${ptyProcess.pid}`)

  // Keepalive ping — prevents Cloudflare from killing idle connections
  const pingTimer = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.ping()
      } catch {}
    }
  }, PING_INTERVAL)

  // Track pong responses to detect dead clients
  let alive = true
  ws.on('pong', () => { alive = true })

  const healthCheck = setInterval(() => {
    if (!alive) {
      console.log(`[terminal-server] Client not responding, terminating`)
      ws.terminate()
      return
    }
    alive = false
  }, 60000) // check every 60s

  // PTY → WebSocket
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }))
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[terminal-server] PTY exited ${exitCode}`)
    clearInterval(pingTimer)
    clearInterval(healthCheck)
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', data: exitCode }))
      ws.close()
    }
  })

  // WebSocket → PTY
  ws.on('message', (msg) => {
    try {
      const { type, data } = JSON.parse(msg.toString())
      if (type === 'input') {
        ptyProcess.write(data)
      } else if (type === 'resize') {
        ptyProcess.resize(data.cols, data.rows)
      } else if (type === 'ping') {
        // Client-side ping — respond
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    } catch (e) {
      ptyProcess.write(msg.toString())
    }
  })

  ws.on('close', () => {
    console.log(`[terminal-server] Client disconnected, killing PTY ${ptyProcess.pid}`)
    clearInterval(pingTimer)
    clearInterval(healthCheck)
    try { ptyProcess.kill() } catch {}
  })

  ws.on('error', (err) => {
    console.error(`[terminal-server] WS error:`, err.message)
    clearInterval(pingTimer)
    clearInterval(healthCheck)
    try { ptyProcess.kill() } catch {}
  })
})

wss.on('error', (err) => {
  console.error(`[terminal-server] Server error:`, err.message)
})
