#!/usr/bin/env node
/**
 * Nataly Terminal Server
 * WebSocket + node-pty → real PTY session on Mac Studio
 * Auth via token header
 */

const { WebSocketServer } = require('ws')
const pty = require('node-pty')
const os = require('os')

const PORT = process.env.TERMINAL_PORT || 3001
const TOKEN = process.env.TERMINAL_TOKEN || 'nataly-terminal-2026'

const wss = new WebSocketServer({ port: PORT })

console.log(`[terminal-server] Listening on ws://localhost:${PORT}`)
console.log(`[terminal-server] Auth token: ${TOKEN}`)

wss.on('connection', (ws, req) => {
  // Auth check via ?token= or first message
  const url = new URL(req.url, `http://localhost`)
  const token = url.searchParams.get('token')

  if (token !== TOKEN) {
    console.log(`[terminal-server] Unauthorized connection from ${req.socket.remoteAddress}`)
    ws.send(JSON.stringify({ type: 'error', data: 'Unauthorized\r\n' }))
    ws.close(1008, 'Unauthorized')
    return
  }

  console.log(`[terminal-server] Client connected from ${req.socket.remoteAddress}`)

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

  console.log(`[terminal-server] PTY spawned PID ${ptyProcess.pid}`)

  // PTY → WebSocket
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }))
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[terminal-server] PTY exited with code ${exitCode}`)
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
      }
    } catch (e) {
      // raw input fallback
      ptyProcess.write(msg.toString())
    }
  })

  ws.on('close', () => {
    console.log(`[terminal-server] Client disconnected, killing PTY ${ptyProcess.pid}`)
    try { ptyProcess.kill() } catch {}
  })

  ws.on('error', (err) => {
    console.error(`[terminal-server] WS error:`, err.message)
    try { ptyProcess.kill() } catch {}
  })
})

wss.on('error', (err) => {
  console.error(`[terminal-server] Server error:`, err.message)
})
