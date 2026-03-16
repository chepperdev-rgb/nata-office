'use client'

interface GlitchTextProps {
  text: string
  className?: string
  color?: string
}

export default function GlitchText({ text, className = '', color = '#6366f1' }: GlitchTextProps) {
  return (
    <span
      className={`glitch-text relative inline-block ${className}`}
      data-text={text}
      style={{
        '--glitch-color-1': color,
        '--glitch-color-2': '#ec4899',
      } as React.CSSProperties}
    >
      {text}
    </span>
  )
}
