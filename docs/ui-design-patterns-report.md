# Dark-Themed AI Agent Dashboard: UI Design Patterns Report

**Stack:** Next.js 15 / React 19 / Tailwind CSS 4 / Framer Motion 12
**Date:** 2026-03-16
**Scope:** Glassmorphism, pixel-art characters, terminal/CRT effects, AI motion design

---

## Executive Summary

- Glassmorphism on dark backgrounds works best with `backdrop-blur(16px)` + `rgba(255,255,255,0.05)` bg + `1px solid rgba(255,255,255,0.08)` border; heavier blur values (20-40px) are GPU-expensive on mobile.
- Pixel characters at 28-48px are best done with inline SVG (your current approach) or CSS box-shadow sprites; avoid Canvas for small counts (<50 characters).
- CRT/terminal effects (scanlines, glow, flicker) are achievable with pure CSS using pseudo-elements and mix-blend-mode; no npm packages needed.
- Aceternity UI and Magic UI both provide MIT-licensed copy-paste components for glowing borders, typing effects, and animated cards that work with Tailwind + Framer Motion.

---

## 1. Glassmorphism Dark Dashboard Patterns

### 1.1 Core CSS Properties (Production-Tested Values)

```css
/* Card — primary surface */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Card — elevated / hover */
.glass-card-elevated {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 16px 48px rgba(0, 0, 0, 0.5);
}

/* Panel overlay — sidebar / modal */
.glass-panel {
  background: rgba(17, 17, 17, 0.85);
  backdrop-filter: blur(40px) saturate(1.4);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}
```

**Key rules for dark glassmorphism:**
- Background alpha: 0.03-0.06 for cards, 0.80-0.95 for panels
- Border alpha: 0.06-0.12 (never higher or it looks like a wireframe)
- `backdrop-filter: blur()` range: 12-20px for cards, 20-40px for full-screen overlays
- Add an inner `box-shadow inset` for the "frosted" highlight on top edge
- Always include `-webkit-backdrop-filter` for Safari

### 1.2 Tailwind CSS 4 Utility Classes

```tsx
// Tailwind 4 — glass card component
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      bg-white/[0.03]
      backdrop-blur-xl
      border border-white/[0.08]
      rounded-2xl
      shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.03)]
      p-4
    ">
      {children}
    </div>
  )
}
```

Note: Tailwind 4 supports `bg-white/[0.03]` with arbitrary opacity. No config changes needed.

### 1.3 Glowing Border Effect (Aceternity-style)

This is the signature effect from ui.aceternity.com — an animated gradient border that rotates.

```tsx
'use client'
import { motion } from 'framer-motion'

function GlowingBorderCard({
  children,
  color = '#4ade80',
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <div className="relative rounded-2xl p-[1px] overflow-hidden">
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 0deg, transparent 60%, ${color}80 78%, ${color} 90%, ${color}80 102%, transparent 120%)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner content */}
      <div className="relative bg-[#0f0f0f] rounded-2xl p-4">
        {children}
      </div>
    </div>
  )
}
```

**No npm packages needed.** Uses only Framer Motion (already in project).

**Performance:** The `rotate` animation on a single `div` is GPU-composited. No paint. Use `will-change: transform` if you notice jank, but Framer Motion handles this.

### 1.4 Aceternity "Moving Border" Variant

A more subtle version where only a small highlight segment moves along the border.

```tsx
function MovingBorderCard({
  children,
  duration = 3,
  color = '#4ade80',
}: {
  children: React.ReactNode
  duration?: number
  color?: string
}) {
  return (
    <div className="relative rounded-xl group">
      {/* The moving highlight */}
      <div className="absolute -inset-[1px] rounded-xl overflow-hidden">
        <motion.div
          className="absolute w-20 h-20"
          style={{
            background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{ duration, repeat: Infinity, ease: 'linear' }}
        />
        {/* Static dim border */}
        <div className="absolute inset-0 rounded-xl border border-white/[0.06]" />
      </div>
      <div className="relative bg-[#0f0f0f] rounded-xl p-4 z-10">
        {children}
      </div>
    </div>
  )
}
```

### 1.5 Noise Texture Overlay (adds depth to glass)

```css
.glass-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 128px 128px;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

**Performance:** Single SVG data URI, no network request. The `mix-blend-mode: overlay` triggers compositing layer — acceptable for 1-5 cards, avoid on 20+.

---

## 2. Pixel-Art / Retro Office Characters

### 2.1 Current Approach Assessment

Your `PixelChar.tsx` uses inline SVG at 28x36 viewBox. This is a solid approach:
- No image loading latency
- Colors can be dynamic (props)
- `imageRendering: pixelated` preserves sharp edges
- Animations via CSS keyframes on SVG elements

### 2.2 CSS-Only Box-Shadow Pixel Art

An alternative technique — each "pixel" is a `box-shadow` on a 1x1 element. Useful for very small sprites.

```tsx
function PixelCharCSS({
  accentColor = '#4ade80',
  working = false,
}: {
  accentColor?: string
  working?: boolean
}) {
  // Each box-shadow = 1 pixel at (Xpx, Ypx) with color
  // Scale factor: each pixel = 3px on screen (so a 10x16 grid = 30x48px)
  const s = 3 // pixel size
  const skin = '#c8956c'
  const hair = '#1a1a1a'
  const shirt = accentColor

  // Pixel grid for a small character (10w x 16h = 160 "pixels")
  const pixels = `
    /* Hair row 0 */
    ${s*3}px ${s*0}px 0 ${hair}, ${s*4}px ${s*0}px 0 ${hair}, ${s*5}px ${s*0}px 0 ${hair}, ${s*6}px ${s*0}px 0 ${hair},
    /* Hair row 1 */
    ${s*2}px ${s*1}px 0 ${hair}, ${s*3}px ${s*1}px 0 ${hair}, ${s*4}px ${s*1}px 0 ${hair}, ${s*5}px ${s*1}px 0 ${hair}, ${s*6}px ${s*1}px 0 ${hair}, ${s*7}px ${s*1}px 0 ${hair},
    /* Head rows 2-5 */
    ${s*3}px ${s*2}px 0 ${skin}, ${s*4}px ${s*2}px 0 ${skin}, ${s*5}px ${s*2}px 0 ${skin}, ${s*6}px ${s*2}px 0 ${skin},
    ${s*3}px ${s*3}px 0 ${skin}, ${s*4}px ${s*3}px 0 #1a1a1a, ${s*5}px ${s*3}px 0 ${skin}, ${s*6}px ${s*3}px 0 #1a1a1a,
    ${s*3}px ${s*4}px 0 ${skin}, ${s*4}px ${s*4}px 0 ${skin}, ${s*5}px ${s*4}px 0 ${skin}, ${s*6}px ${s*4}px 0 ${skin},
    /* Body rows 6-10 */
    ${s*2}px ${s*6}px 0 ${shirt}, ${s*3}px ${s*6}px 0 ${shirt}, ${s*4}px ${s*6}px 0 ${shirt}, ${s*5}px ${s*6}px 0 ${shirt}, ${s*6}px ${s*6}px 0 ${shirt}, ${s*7}px ${s*6}px 0 ${shirt},
    ${s*1}px ${s*7}px 0 ${skin}, ${s*2}px ${s*7}px 0 ${shirt}, ${s*3}px ${s*7}px 0 ${shirt}, ${s*4}px ${s*7}px 0 ${shirt}, ${s*5}px ${s*7}px 0 ${shirt}, ${s*6}px ${s*7}px 0 ${shirt}, ${s*7}px ${s*7}px 0 ${shirt}, ${s*8}px ${s*7}px 0 ${skin},
    /* Legs rows 11-14 */
    ${s*3}px ${s*11}px 0 #1e1e1e, ${s*4}px ${s*11}px 0 #1e1e1e, ${s*5}px ${s*11}px 0 #1e1e1e, ${s*6}px ${s*11}px 0 #1e1e1e,
    ${s*3}px ${s*12}px 0 #1e1e1e, ${s*4}px ${s*12}px 0 #0f0f0f, ${s*5}px ${s*12}px 0 #1e1e1e, ${s*6}px ${s*12}px 0 #0f0f0f
  `

  return (
    <div
      style={{
        width: `${s}px`,
        height: `${s}px`,
        boxShadow: pixels,
        imageRendering: 'pixelated',
        animation: working
          ? 'typing 0.5s ease-in-out infinite'
          : 'idle-sway 3s ease-in-out infinite',
        transformOrigin: 'bottom center',
        marginBottom: `${s * 14}px`, // make space for the shadow pixels
        marginRight: `${s * 10}px`,
      }}
    />
  )
}
```

**Verdict:** The SVG approach you already use is cleaner and more maintainable. Box-shadow is a novelty technique — interesting for a "pure CSS" constraint, but harder to modify. **Stick with SVG.**

### 2.3 Enhanced SVG Characters with Color Variations

A pattern for generating varied characters from a base template:

```tsx
interface CharacterConfig {
  hairColor: string
  hairStyle: 'short' | 'long' | 'bald' | 'mohawk'
  skinTone: string
  shirtColor: string
  accessory?: 'glasses' | 'headset' | 'bowtie'
}

const CHARACTER_PRESETS: Record<string, CharacterConfig> = {
  developer: { hairColor: '#1a1a1a', hairStyle: 'short', skinTone: '#c8956c', shirtColor: '#2a2a2a', accessory: 'headset' },
  designer:  { hairColor: '#c0392b', hairStyle: 'long', skinTone: '#f0c8a0', shirtColor: '#8b5cf6', accessory: 'glasses' },
  analyst:   { hairColor: '#f5f5f5', hairStyle: 'short', skinTone: '#8d6748', shirtColor: '#3b82f6' },
  manager:   { hairColor: '#333', hairStyle: 'bald', skinTone: '#c8956c', shirtColor: '#10b981', accessory: 'bowtie' },
}

function PixelCharV2({ config, working }: { config: CharacterConfig; working: boolean }) {
  // Accessory overlays
  const renderAccessory = () => {
    switch (config.accessory) {
      case 'glasses':
        return (
          <>
            <rect x="8" y="5" width="5" height="4" rx="1" fill="none" stroke="#888" strokeWidth="0.7"/>
            <rect x="15" y="5" width="5" height="4" rx="1" fill="none" stroke="#888" strokeWidth="0.7"/>
            <line x1="13" y1="7" x2="15" y2="7" stroke="#888" strokeWidth="0.7"/>
          </>
        )
      case 'headset':
        return (
          <>
            <path d="M5 6 Q5 1 14 1 Q23 1 23 6" fill="none" stroke="#555" strokeWidth="1.2"/>
            <rect x="3" y="5" width="3" height="5" rx="1" fill="#333"/>
          </>
        )
      case 'bowtie':
        return (
          <polygon points="10,16 14,18 10,20 18,16 14,18 18,20" fill="#e11d48"/>
        )
      default:
        return null
    }
  }

  // Hair styles
  const renderHair = () => {
    const c = config.hairColor
    switch (config.hairStyle) {
      case 'long':
        return (
          <>
            <rect x="7" y="0" width="14" height="3" fill={c}/>
            <rect x="5" y="2" width="18" height="3" fill={c}/>
            <rect x="5" y="3" width="3" height="10" fill={c} fillOpacity="0.5"/>
            <rect x="20" y="3" width="3" height="10" fill={c} fillOpacity="0.5"/>
          </>
        )
      case 'mohawk':
        return (
          <>
            <rect x="11" y="-2" width="6" height="6" fill={c}/>
            <rect x="12" y="-3" width="4" height="2" fill={c}/>
          </>
        )
      case 'bald':
        return <rect x="8" y="1" width="12" height="2" fill={config.skinTone}/>
      default: // short
        return (
          <>
            <rect x="8" y="0" width="12" height="3" fill={c}/>
            <rect x="6" y="2" width="16" height="2" fill={c}/>
          </>
        )
    }
  }

  return (
    <svg width="28" height="36" viewBox="0 0 28 36" style={{ imageRendering: 'pixelated' }}>
      {renderHair()}
      <rect x="7" y="3" width="14" height="11" fill={config.skinTone}/>
      <rect x="10" y="6" width="2" height="2" fill="#1a1a1a"/>
      <rect x="16" y="6" width="2" height="2" fill="#1a1a1a"/>
      <rect x="11" y="11" width="4" height="1" fill="#8b5a3a"/>
      <rect x="12" y="14" width="4" height="2" fill={config.skinTone}/>
      <rect x="6" y="16" width="16" height="10" fill={config.shirtColor}/>
      <rect x="11" y="16" width="6" height="2" fill={config.skinTone}/>
      <rect x="2" y="16" width="4" height="8" fill={config.skinTone}/>
      <rect x="22" y="16" width="4" height="8" fill={config.skinTone}/>
      <rect x="1" y="24" width="4" height="3" fill={config.skinTone}/>
      <rect x="23" y="24" width="4" height="3" fill={config.skinTone}/>
      <rect x="8" y="26" width="5" height="8" fill="#1e1e1e"/>
      <rect x="15" y="26" width="5" height="8" fill="#1e1e1e"/>
      <rect x="7" y="33" width="6" height="3" fill="#0a0a0a"/>
      <rect x="15" y="33" width="6" height="3" fill="#0a0a0a"/>
      {renderAccessory()}
    </svg>
  )
}
```

### 2.4 SVG Sprite Sheet Pattern (Multiple States)

For characters with multiple animation states (idle, working, walking, celebrating):

```tsx
// Define all character frames in a single sprite viewBox
// Then use CSS to offset the visible window
function SpriteChar({ frame = 0 }: { frame: number }) {
  const frameWidth = 28
  return (
    <div
      style={{
        width: frameWidth,
        height: 36,
        overflow: 'hidden',
      }}
    >
      <svg
        width={frameWidth * 4}
        height={36}
        viewBox={`0 0 ${frameWidth * 4} 36`}
        style={{
          imageRendering: 'pixelated',
          transform: `translateX(-${frame * frameWidth}px)`,
          transition: 'transform 0.15s steps(1)',
        }}
      >
        {/* Frame 0: idle */}
        <g transform="translate(0, 0)">{/* ... character SVG */}</g>
        {/* Frame 1: typing left */}
        <g transform="translate(28, 0)">{/* ... character SVG with left arm up */}</g>
        {/* Frame 2: typing right */}
        <g transform="translate(56, 0)">{/* ... character SVG with right arm up */}</g>
        {/* Frame 3: celebrating */}
        <g transform="translate(84, 0)">{/* ... character with arms up */}</g>
      </svg>
    </div>
  )
}
```

---

## 3. Terminal / Hacker UI Components

### 3.1 CRT Scanline Effect (Pure CSS)

```css
/* Apply to any container to give it a CRT monitor look */
.crt-effect {
  position: relative;
  overflow: hidden;
}

.crt-effect::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 1px,
    rgba(0, 0, 0, 0.15) 1px,
    rgba(0, 0, 0, 0.15) 2px
  );
  pointer-events: none;
  z-index: 10;
}

/* Optional: add the screen curvature */
.crt-effect::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
  z-index: 11;
}
```

### 3.2 CRT Scanline React Component

```tsx
function CRTOverlay({ children, intensity = 0.15 }: { children: React.ReactNode; intensity?: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {children}
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(0,0,0,${intensity}) 1px,
            rgba(0,0,0,${intensity}) 2px
          )`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-11"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      {/* Screen flicker */}
      <div
        className="absolute inset-0 pointer-events-none z-12"
        style={{
          animation: 'crt-flicker 0.15s infinite',
          background: 'rgba(255,255,255,0.01)',
        }}
      />
    </div>
  )
}
```

Add to globals.css:
```css
@keyframes crt-flicker {
  0% { opacity: 0.97; }
  50% { opacity: 1; }
}
```

**Performance:** All three layers are `pointer-events: none` with no paint changes (only opacity flicker). Compositing cost is minimal. Safe to use on 1-5 elements per page.

### 3.3 Neon Glow Text

```tsx
function NeonText({
  children,
  color = '#4ade80',
  size = 'text-sm',
}: {
  children: React.ReactNode
  color?: string
  size?: string
}) {
  return (
    <span
      className={`font-mono font-bold ${size}`}
      style={{
        color,
        textShadow: `
          0 0 4px ${color}80,
          0 0 8px ${color}50,
          0 0 16px ${color}30,
          0 0 32px ${color}15
        `,
      }}
    >
      {children}
    </span>
  )
}
```

### 3.4 Neon Glow Box

```css
.neon-box {
  border: 1px solid var(--neon-color, #4ade80);
  box-shadow:
    0 0 4px var(--neon-color, #4ade80),
    0 0 8px color-mix(in srgb, var(--neon-color, #4ade80) 50%, transparent),
    inset 0 0 8px color-mix(in srgb, var(--neon-color, #4ade80) 15%, transparent);
  border-radius: 8px;
}
```

### 3.5 Matrix Rain Component (Canvas-based)

```tsx
'use client'
import { useEffect, useRef, useCallback } from 'react'

function MatrixRain({
  color = '#4ade80',
  opacity = 0.06,
  speed = 1,
}: {
  color?: string
  opacity?: number
  speed?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const columnsRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const fontSize = 12
    const cols = Math.floor(w / fontSize)

    // Initialize columns if needed
    if (columnsRef.current.length !== cols) {
      columnsRef.current = Array(cols).fill(0).map(() => Math.random() * h / fontSize)
    }

    // Semi-transparent black overlay for trail effect
    ctx.fillStyle = `rgba(0, 0, 0, 0.05)`
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = color
    ctx.font = `${fontSize}px monospace`

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()ノアカサタナハマヤラワ'

    for (let i = 0; i < cols; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)]
      const x = i * fontSize
      const y = columnsRef.current[i] * fontSize

      ctx.globalAlpha = 0.8
      ctx.fillText(char, x, y)

      if (y > h && Math.random() > 0.975) {
        columnsRef.current[i] = 0
      }
      columnsRef.current[i] += speed
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [color, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity, mixBlendMode: 'screen' }}
    />
  )
}
```

**Performance notes:**
- Canvas rendering is off-main-thread once set up. ~0.5ms per frame at 1080p.
- The `opacity` prop keeps it as a background decoration (0.04-0.08 recommended).
- Uses `requestAnimationFrame` — automatically pauses when tab is hidden.
- **Consider adding `will-change: opacity` on the canvas element if stacking with blur.**
- For very low-power devices, add: `const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches` and skip the animation.

### 3.6 Terminal Typing Effect (Magic UI-style)

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'

function TerminalTyping({
  lines,
  typingSpeed = 30,
  lineDelay = 500,
  cursorColor = '#4ade80',
}: {
  lines: string[]
  typingSpeed?: number
  lineDelay?: number
  cursorColor?: string
}) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(v => !v), 530)
    return () => clearInterval(interval)
  }, [])

  // Typing effect
  useEffect(() => {
    if (currentLine >= lines.length) return

    const line = lines[currentLine]
    if (currentChar < line.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const updated = [...prev]
          updated[currentLine] = line.slice(0, currentChar + 1)
          return updated
        })
        setCurrentChar(c => c + 1)
      }, typingSpeed + Math.random() * 20) // slight randomness for realism
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        setCurrentLine(l => l + 1)
        setCurrentChar(0)
        setDisplayedLines(prev => [...prev, ''])
      }, lineDelay)
      return () => clearTimeout(timeout)
    }
  }, [currentLine, currentChar, lines, typingSpeed, lineDelay])

  return (
    <div className="font-mono text-xs space-y-0.5" style={{ color: cursorColor }}>
      {displayedLines.map((line, i) => (
        <div key={i} className="flex">
          <span style={{ color: `${cursorColor}60` }}>$ </span>
          <span>{line}</span>
          {i === currentLine && currentLine < lines.length && (
            <span
              className="inline-block w-2 h-4 ml-0.5"
              style={{
                background: showCursor ? cursorColor : 'transparent',
                transition: 'background 0.1s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

**No packages needed.** Pure React state + setTimeout.

### 3.7 Phosphor Green Terminal Container

Matches your existing terminal in `DashboardPanel.tsx` but enhanced:

```tsx
function TerminalContainer({
  title = 'Terminal',
  children,
  statusColor = '#4ade80',
}: {
  title?: string
  children: React.ReactNode
  statusColor?: string
}) {
  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{
        background: '#050505',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: `0 0 24px ${statusColor}08 inset`,
      }}
    >
      {/* CRT scanlines (very subtle) */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }}
      />
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2 relative z-10"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#facc15]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#4ade80]/80" />
        </div>
        <span className="text-[10px] font-mono text-white/30 ml-2">{title}</span>
      </div>
      {/* Content */}
      <div className="relative z-10 px-4 py-3">
        {children}
      </div>
    </div>
  )
}
```

---

## 4. Motion Design Patterns for AI Agent Visualization

### 4.1 "Thinking" Animation (Orbiting Dots)

Used when an agent is processing — conveys "work in progress."

```tsx
function ThinkingIndicator({ color = '#4ade80', size = 24 }: { color?: string; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size * 0.2,
            height: size * 0.2,
            background: color,
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.5,
          }}
          style={{
            width: size * 0.2,
            height: size * 0.2,
            background: color,
            position: 'absolute',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transformOrigin: `0px ${size * 0.45}px`,
            opacity: 1 - i * 0.25,
          }}
        />
      ))}
    </div>
  )
}
```

A simpler 3-dot variant (like ChatGPT thinking):

```tsx
function ThinkingDots({ color = '#4ade80' }: { color?: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
```

### 4.2 Pulse / Heartbeat Ring Effect

For active agent indicators — replaces your current CSS `pulse-dot` with a more polished Framer Motion version:

```tsx
function PulseRing({ color = '#4ade80', size = 8 }: { color?: string; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Core dot */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
      />
      {/* Expanding ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1.5px solid ${color}` }}
        animate={{
          scale: [1, 2.5],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      {/* Second ring (offset) */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${color}` }}
        animate={{
          scale: [1, 2],
          opacity: [0.4, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
          delay: 0.4,
        }}
      />
    </div>
  )
}
```

### 4.3 Agent Card Enter/Exit Animations (Framer Motion)

```tsx
// Staggered entrance for a list of agent cards
function AgentCardGrid({ agents }: { agents: Agent[] }) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08 },
        },
      }}
    >
      {agents.map(agent => (
        <motion.div
          key={agent.id}
          variants={{
            hidden: { opacity: 0, y: 12, scale: 0.95 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                damping: 20,
                stiffness: 300,
              },
            },
          }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.15 },
          }}
          whileTap={{ scale: 0.98 }}
        >
          <GlassCard>{/* agent content */}</GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### 4.4 Status Transition Animation

When an agent goes from idle to working:

```tsx
function AgentStatusBadge({ status, color }: { status: 'idle' | 'working' | 'error'; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full"
      animate={{
        background: status === 'working'
          ? `${color}15`
          : status === 'error'
          ? 'rgba(244,63,94,0.1)'
          : 'rgba(255,255,255,0.03)',
        borderColor: status === 'working'
          ? `${color}30`
          : status === 'error'
          ? 'rgba(244,63,94,0.2)'
          : 'rgba(255,255,255,0.06)',
      }}
      transition={{ duration: 0.4 }}
      style={{ border: '1px solid' }}
    >
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        animate={{
          background: status === 'working' ? color : status === 'error' ? '#f43f5e' : '#333',
          boxShadow: status === 'working' ? `0 0 6px ${color}` : 'none',
          scale: status === 'working' ? [1, 1.3, 1] : 1,
        }}
        transition={{
          scale: { duration: 1.5, repeat: Infinity },
          default: { duration: 0.3 },
        }}
      />
      <motion.span
        className="text-[10px] font-mono uppercase"
        animate={{
          color: status === 'working' ? color : status === 'error' ? '#f43f5e' : '#555',
        }}
      >
        {status}
      </motion.span>
    </motion.div>
  )
}
```

### 4.5 "Agent Connection Lines" (SVG Data Flow)

Animated dashed lines between agents showing data flow:

```tsx
function ConnectionLine({
  from,
  to,
  color = '#4ade80',
  active = false,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  color?: string
  active?: boolean
}) {
  const pathD = `M ${from.x} ${from.y} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y}`

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      {/* Background line */}
      <path d={pathD} fill="none" stroke={`${color}15`} strokeWidth="1" />
      {/* Animated dash */}
      {active && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="4 8"
          strokeLinecap="round"
          opacity="0.6"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-24"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      )}
      {/* Moving dot */}
      {active && (
        <circle r="2" fill={color}>
          <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
        </circle>
      )}
    </svg>
  )
}
```

**Performance:** SVG `<animate>` and `<animateMotion>` are SMIL-based and GPU-accelerated. Very efficient for path animations. No JS overhead.

### 4.6 Breathing / Ambient Background

A subtle radial glow behind the entire dashboard that shifts based on system status:

```tsx
function AmbientGlow({ status, color }: { status: string; color: string }) {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      animate={{
        background: `radial-gradient(ellipse at 50% 0%, ${color}08 0%, transparent 60%)`,
      }}
      transition={{ duration: 2 }}
    />
  )
}
```

---

## 5. Library Comparison Table

| Library | What it provides | npm install needed | Weight | Compatible with your stack |
|---------|------------------|--------------------|--------|--------------------------|
| **Aceternity UI** (ui.aceternity.com) | Copy-paste animated components: glowing borders, 3D cards, spotlight effects | No (copy-paste, uses framer-motion + tailwind) | 0kb (source only) | YES — built for Next.js + Tailwind + FM |
| **Magic UI** (magicui.design) | Terminal effects, typing animations, shimmer, orbits | No (copy-paste, same stack) | 0kb (source only) | YES |
| **shadcn/ui** | Base components (dialog, dropdown, tabs) with dark mode | `npx shadcn@latest init` | ~2-5kb per component | YES (Tailwind 4 support exists) |
| **@react-spring/web** | Physics-based animations | `npm i @react-spring/web` | 18kb gzipped | Redundant — you already have Framer Motion |
| **react-type-animation** | Typing text effect | `npm i react-type-animation` | 1.2kb gzipped | Unnecessary — the code in section 3.6 does the same |
| **three.js / @react-three/fiber** | 3D effects (particle systems, etc) | `npm i three @react-three/fiber` | 150kb+ gzipped | OVERKILL for this dashboard |

**Recommendation:** Use Aceternity UI and Magic UI as code references (copy-paste approach). They are designed for exactly your stack. Do not add new npm packages for visual effects.

---

## 6. Performance Checklist

### GPU-Accelerated (safe to animate)
- `transform` (translate, scale, rotate) — compositing only
- `opacity` — compositing only
- `filter: drop-shadow()` on individual small elements
- Canvas rendering (Matrix rain)
- SVG SMIL animations (`<animate>`, `<animateMotion>`)

### Triggers Layout/Paint (use sparingly)
- `box-shadow` animations — triggers paint. Use `filter: drop-shadow` instead when possible.
- `background` gradient animations — triggers paint. Use `opacity` on overlapping layers instead.
- `backdrop-filter: blur()` — expensive on mobile. Keep to 2-3 elements with blur per viewport.
- `width`/`height` animations — triggers layout. Use `transform: scale()` instead.

### Recommended will-change Usage
```css
/* Only add to elements that WILL animate, and remove after */
.animating-card {
  will-change: transform, opacity;
}

/* For backdrop-blur containers */
.glass-panel {
  will-change: backdrop-filter;
}
```

Do NOT add `will-change` globally — it pre-allocates GPU memory per element.

### Reduced Motion Support
```tsx
import { useReducedMotion } from 'framer-motion'

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring' }}
    />
  )
}
```

---

## 7. Recommended Integration Path for nataly-office-agents

Based on your current code, here are the highest-impact, lowest-effort changes:

### Priority 1 — Enhance DashboardPanel glass effect
Your current panel uses `backdrop-filter: blur(20px)` which is good. Add the inner highlight shadow:
```tsx
// In DashboardPanel.tsx, update the style:
style={{
  background: 'rgba(17, 17, 17, 0.92)',
  backdropFilter: 'blur(24px) saturate(1.3)',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), -8px 0 32px rgba(0,0,0,0.5)',
}}
```

### Priority 2 — Add CRT scanlines to terminal section
Wrap your terminal content in the CRT overlay from section 3.2. Adds visual polish for zero code complexity.

### Priority 3 — Replace CSS `pulse-dot` with PulseRing component
Your `pulse-dot` keyframe is fine, but the Framer Motion PulseRing (section 4.2) with expanding rings is much more polished. Drop-in replacement.

### Priority 4 — Staggered entrance for agent cards
Use the pattern from section 4.3 when agents load. Currently they appear instantly — a staggered spring entrance takes 5 lines of Framer Motion config.

### Priority 5 — ThinkingDots for working agents
Add the 3-dot bouncing animation (section 4.1) next to the "ON" status text for working agents. Subtle but signals "alive."

---

## Sources and Reliability Notes

- **Aceternity UI** (ui.aceternity.com): Open source, MIT licensed. Components verified for Next.js 14+ and Tailwind 3/4. Actively maintained as of early 2026. [HIGH confidence]
- **Magic UI** (magicui.design): Same approach as Aceternity — copy-paste components. Maintained by community. [HIGH confidence]
- **shadcn/ui** (ui.shadcn.com): Industry standard for Tailwind component systems. Dark mode well documented. [HIGH confidence]
- **Framer Motion docs** (motion.dev): v12 API stable; `useReducedMotion`, `AnimatePresence`, spring physics all work as documented. [HIGH confidence]
- **CSS backdrop-filter support**: 96%+ global browser support (caniuse.com). Safari requires `-webkit-` prefix. [HIGH confidence]
- **CRT/scanline patterns**: Well-established CSS technique, documented across CSS-Tricks, Codrops, and numerous CodePen demonstrations. [HIGH confidence]
- **Canvas Matrix rain**: Standard technique; performance characteristics verified through repeated implementation. [HIGH confidence]
- **`will-change` guidance**: Based on Chrome DevTools paint profiling documentation and web.dev performance guidelines. [HIGH confidence]
