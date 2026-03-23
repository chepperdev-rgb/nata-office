#!/usr/bin/env node
/**
 * Nataly Terminal Server v2 — Persistent Sessions
 *
 * PTY sessions survive WebSocket disconnects.
 * Client reconnects get scrollback replay.
 * Sessions auto-expire after SESSION_TTL of inactivity.
 */

const { WebSocketServer } = require('ws')
const pty = require('node-pty')
const os = require('os')
const crypto = require('crypto')

const PORT = process.env.TERMINAL_PORT || 3001
const TOKEN = process.env.TERMINAL_TOKEN || 'nataly-terminal-2026'
const PING_INTERVAL = 25000
const SESSION_TTL = parseInt(process.env.SESSION_TTL || '0') || 0  // 0 = no expiry
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '5')     // max concurrent PTYs
const SCROLLBACK_LIMIT = 50000        // chars to keep for replay on reconnect
const SESSION_CHECK_INTERVAL = 60000  // check for expired sessions every 60s

// ── Session Store ──────────────────────────────────────────────
const sessions = new Map()  // sessionId → { pty, buffer, ws, cols, rows, lastActivity, expireTimer }

function createSession(cols = 120, rows = 40) {
  const id = crypto.randomBytes(8).toString('hex')
  const shell = process.env.SHELL || '/bin/zsh'

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: os.homedir(),
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
    },
  })

  const session = {
    id,
    pty: ptyProcess,
    buffer: '',          // scrollback ring buffer
    ws: null,            // current WebSocket (null = detached)
    cols,
    rows,
    lastActivity: Date.now(),
    expireTimer: null,
  }

  // PTY → buffer + forward to WS if connected
  ptyProcess.onData((data) => {
    session.lastActivity = Date.now()
    // Append to scrollback buffer (ring)
    session.buffer += data
    if (session.buffer.length > SCROLLBACK_LIMIT) {
      session.buffer = session.buffer.slice(-SCROLLBACK_LIMIT)
    }
    // Forward to client if connected
    if (session.ws && session.ws.readyState === 1) {
      try {
        session.ws.send(JSON.stringify({ type: 'output', data }))
      } catch {}
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[session ${id}] PTY exited ${exitCode}`)
    if (session.ws && session.ws.readyState === 1) {
      try {
        session.ws.send(JSON.stringify({ type: 'exit', data: exitCode }))
        session.ws.close()
      } catch {}
    }
    clearTimeout(session.expireTimer)
    sessions.delete(id)
  })

  sessions.set(id, session)
  console.log(`[session ${id}] Created, PTY PID ${ptyProcess.pid}`)

  return session
}

function attachWs(session, ws) {
  // Detach previous WS if any
  if (session.ws && session.ws !== ws) {
    try { session.ws.close() } catch {}
  }

  session.ws = ws
  session.lastActivity = Date.now()

  // Cancel expiration timer
  if (session.expireTimer) {
    clearTimeout(session.expireTimer)
    session.expireTimer = null
  }
}

function detachWs(session) {
  session.ws = null
  session.lastActivity = Date.now()

  if (SESSION_TTL > 0) {
    // Start expiration countdown — kill PTY if no reconnect within TTL
    session.expireTimer = setTimeout(() => {
      console.log(`[session ${session.id}] Expired after ${SESSION_TTL / 1000}s, killing PTY`)
      try { session.pty.kill() } catch {}
      sessions.delete(session.id)
    }, SESSION_TTL)
    console.log(`[session ${session.id}] Detached, will expire in ${SESSION_TTL / 1000}s`)
  } else {
    console.log(`[session ${session.id}] Detached, no expiry — PTY stays alive`)
  }
}

// ── WebSocket Server ───────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT })
console.log(`[terminal-server] v2 listening on ws://localhost:${PORT}`)

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost')
  const token = url.searchParams.get('token')
  const sessionId = url.searchParams.get('session')

  // Auth
  if (token !== TOKEN) {
    console.log(`[terminal-server] Unauthorized`)
    ws.send(JSON.stringify({ type: 'error', data: 'Unauthorized\r\n' }))
    ws.close(1008, 'Unauthorized')
    return
  }

  let session
  let isReconnect = false

  // Try to resume existing session
  if (sessionId && sessions.has(sessionId)) {
    session = sessions.get(sessionId)
    isReconnect = true
    console.log(`[session ${session.id}] Reconnected`)
  } else {
    // Enforce max sessions — evict oldest detached session if at limit
    if (sessions.size >= MAX_SESSIONS) {
      let oldest = null
      for (const [, s] of sessions) {
        if (!s.ws && (!oldest || s.lastActivity < oldest.lastActivity)) {
          oldest = s
        }
      }
      if (oldest) {
        console.log(`[session ${oldest.id}] Evicting oldest detached session`)
        clearTimeout(oldest.expireTimer)
        try { oldest.pty.kill() } catch {}
        sessions.delete(oldest.id)
      } else {
        // All sessions are attached — reject
        console.log(`[terminal-server] Max sessions (${MAX_SESSIONS}) reached, all attached`)
        ws.send(JSON.stringify({ type: 'error', data: 'Too many active sessions\r\n' }))
        ws.close(1013, 'Too many sessions')
        return
      }
    }
    // New session
    const cols = parseInt(url.searchParams.get('cols')) || 120
    const rows = parseInt(url.searchParams.get('rows')) || 40
    session = createSession(cols, rows)
  }

  // Attach this WS to the session
  attachWs(session, ws)

  // Send session ID to client
  ws.send(JSON.stringify({ type: 'session', data: session.id }))

  // If reconnecting, replay scrollback buffer
  if (isReconnect && session.buffer.length > 0) {
    ws.send(JSON.stringify({ type: 'replay', data: session.buffer }))
  }

  // Keepalive ping
  const pingTimer = setInterval(() => {
    if (ws.readyState === 1) {
      try { ws.ping() } catch {}
    }
  }, PING_INTERVAL)

  let alive = true
  ws.on('pong', () => { alive = true })

  const healthCheck = setInterval(() => {
    if (!alive) {
      console.log(`[session ${session.id}] Client not responding, closing WS`)
      ws.terminate()
      return
    }
    alive = false
  }, 60000)

  // Messages from client
  ws.on('message', (msg) => {
    try {
      const { type, data } = JSON.parse(msg.toString())
      session.lastActivity = Date.now()

      if (type === 'input') {
        session.pty.write(data)
      } else if (type === 'resize') {
        session.cols = data.cols
        session.rows = data.rows
        session.pty.resize(data.cols, data.rows)
      } else if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    } catch (e) {
      session.pty.write(msg.toString())
    }
  })

  // WS closed — detach but DON'T kill PTY
  ws.on('close', () => {
    console.log(`[session ${session.id}] WS disconnected`)
    clearInterval(pingTimer)
    clearInterval(healthCheck)
    if (session.ws === ws) {
      detachWs(session)
    }
  })

  ws.on('error', (err) => {
    console.error(`[session ${session.id}] WS error:`, err.message)
    clearInterval(pingTimer)
    clearInterval(healthCheck)
    if (session.ws === ws) {
      detachWs(session)
    }
  })
})

wss.on('error', (err) => {
  console.error(`[terminal-server] Server error:`, err.message)
})

// ── Cleanup ────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[terminal-server] SIGTERM, cleaning up...')
  for (const [id, session] of sessions) {
    try { session.pty.kill() } catch {}
  }
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[terminal-server] SIGINT, cleaning up...')
  for (const [id, session] of sessions) {
    try { session.pty.kill() } catch {}
  }
  process.exit(0)
})

// Periodic log of active sessions
setInterval(() => {
  if (sessions.size > 0) {
    const summary = [...sessions.values()].map(s =>
      `${s.id.slice(0,6)}(${s.ws ? 'attached' : 'detached'}, buf:${Math.round(s.buffer.length/1024)}K)`
    ).join(', ')
    console.log(`[terminal-server] Active sessions: ${sessions.size} — ${summary}`)
  }
}, SESSION_CHECK_INTERVAL)
