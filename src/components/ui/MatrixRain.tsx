'use client'

import { useEffect, useRef } from 'react'

interface MatrixRainProps {
  opacity?: number
  className?: string
  color?: string
  density?: number
}

export default function MatrixRain({ opacity = 0.04, className = '', color = '#4ade80', density = 30 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let cols: number[] = []
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01'.split('')
    const fontSize = 10

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const colCount = Math.floor(canvas.width / fontSize)
      cols = Array(colCount).fill(0).map(() => Math.random() * canvas.height / fontSize | 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.fillStyle = `rgba(8, 8, 8, 0.15)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = color
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < cols.length; i++) {
        if (Math.random() > density / 100) continue
        const char = chars[Math.random() * chars.length | 0]
        ctx.globalAlpha = 0.3 + Math.random() * 0.7
        ctx.fillText(char, i * fontSize, cols[i] * fontSize)
        if (cols[i] * fontSize > canvas.height && Math.random() > 0.975) {
          cols[i] = 0
        }
        cols[i]++
      }
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    // Slow down to ~15fps for performance
    let last = 0
    const throttledDraw = (time: number) => {
      if (time - last > 66) {
        last = time
        ctx.fillStyle = `rgba(8, 8, 8, 0.15)`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = color
        ctx.font = `${fontSize}px monospace`
        for (let i = 0; i < cols.length; i++) {
          if (Math.random() > density / 100) continue
          const char = chars[Math.random() * chars.length | 0]
          ctx.globalAlpha = 0.3 + Math.random() * 0.7
          ctx.fillText(char, i * fontSize, cols[i] * fontSize)
          if (cols[i] * fontSize > canvas.height && Math.random() > 0.975) {
            cols[i] = 0
          }
          cols[i]++
        }
        ctx.globalAlpha = 1
      }
      animId = requestAnimationFrame(throttledDraw)
    }

    animId = requestAnimationFrame(throttledDraw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [color, density])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
    />
  )
}
