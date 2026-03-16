'use client'

import { useRef, useEffect } from 'react'

interface NeonBorderProps {
  color: string
  children: React.ReactNode
  className?: string
  active?: boolean
  borderRadius?: number
}

export default function NeonBorder({ color, children, className = '', active = false, borderRadius = 14 }: NeonBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `conic-gradient(from var(--border-angle, 0deg), transparent 40%, ${color}60 50%, transparent 60%)`,
          animation: active ? 'spin-border 3s linear infinite' : undefined,
          opacity: active ? 0.8 : undefined,
        }}
      />
      {/* Glow effect */}
      <div
        className="absolute -inset-[1px] rounded-[inherit] opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-sm"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `conic-gradient(from var(--border-angle, 0deg), transparent 40%, ${color}40 50%, transparent 60%)`,
          animation: active ? 'spin-border 3s linear infinite' : undefined,
          opacity: active ? 0.4 : undefined,
        }}
      />
      {/* Content */}
      <div className="relative z-10 rounded-[inherit]" style={{ borderRadius: `${borderRadius}px` }}>
        {children}
      </div>
    </div>
  )
}
