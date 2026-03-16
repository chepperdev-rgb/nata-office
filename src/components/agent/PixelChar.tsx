'use client'

interface PixelCharProps {
  working: boolean
  accentColor: string
  isBoss?: boolean
}

export default function PixelChar({ working, accentColor, isBoss }: PixelCharProps) {
  const hairColor = isBoss ? '#f5f5f5' : '#1a1a1a'
  const shirtColor = isBoss ? accentColor : '#2a2a2a'
  const skinColor = '#c8956c'
  const pantsColor = '#1e1e1e'

  return (
    <svg
      width="28"
      height="36"
      viewBox="0 0 28 36"
      style={{
        imageRendering: 'pixelated',
        animation: working
          ? 'typing 0.5s ease-in-out infinite'
          : 'idle-sway 3s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Hair */}
      <rect x="8" y="0" width="12" height="3" fill={hairColor} />
      <rect x="6" y="2" width="16" height="2" fill={hairColor} />

      {/* Head */}
      <rect x="7" y="3" width="14" height="11" fill={skinColor} />

      {/* Eyes */}
      <rect x="10" y="6" width="2" height="2" fill="#1a1a1a"
        style={{ animation: 'blink 4s infinite', transformOrigin: '11px 7px' }}
      />
      <rect x="16" y="6" width="2" height="2" fill="#1a1a1a"
        style={{ animation: 'blink 4s 0.1s infinite', transformOrigin: '17px 7px' }}
      />

      {/* Mouth */}
      <rect x="11" y="11" width={working ? 6 : 4} height="1" fill="#8b5a3a" />

      {/* Neck */}
      <rect x="12" y="14" width="4" height="2" fill={skinColor} />

      {/* Shirt / Body */}
      <rect x="6" y="16" width="16" height="10" fill={shirtColor} />
      {/* Collar */}
      <rect x="11" y="16" width="6" height="2" fill={skinColor} />
      {/* Boss star badge */}
      {isBoss && (
        <rect x="21" y="17" width="3" height="3" fill="#facc15" />
      )}

      {/* Arms */}
      <rect x="2" y="16" width="4" height="8" fill={skinColor}
        style={{
          animation: working ? 'arm-move 0.4s ease-in-out infinite' : undefined,
          transformOrigin: '4px 16px',
        }}
      />
      <rect x="22" y="16" width="4" height="8" fill={skinColor}
        style={{
          animation: working ? 'arm-move 0.4s ease-in-out infinite reverse' : undefined,
          transformOrigin: '24px 16px',
        }}
      />

      {/* Hands */}
      <rect x="1" y="24" width="4" height="3" fill={skinColor} />
      <rect x="23" y="24" width="4" height="3" fill={skinColor} />

      {/* Legs */}
      <rect x="8" y="26" width="5" height="8" fill={pantsColor} />
      <rect x="15" y="26" width="5" height="8" fill={pantsColor} />

      {/* Shoes */}
      <rect x="7" y="33" width="6" height="3" fill="#0a0a0a" />
      <rect x="15" y="33" width="6" height="3" fill="#0a0a0a" />
    </svg>
  )
}
