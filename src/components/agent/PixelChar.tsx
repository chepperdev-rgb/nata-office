'use client'

// Per-agent color palettes for unique character looks
const AGENT_PALETTES: Record<string, { hair: string; shirt: string; skin: string; accessory?: string }> = {
  miron:    { hair: '#f5f5f5', shirt: '#6366f1', skin: '#c8956c', accessory: 'glasses' },
  backend:  { hair: '#1a1a1a', shirt: '#3b82f6', skin: '#d4a574' },
  frontend: { hair: '#e04040', shirt: '#8b5cf6', skin: '#c8956c', accessory: 'headset' },
  designer: { hair: '#f0c040', shirt: '#ec4899', skin: '#b8845c' },
  data:     { hair: '#2a2a5a', shirt: '#06b6d4', skin: '#c8956c', accessory: 'glasses' },
  analyst:  { hair: '#4a3020', shirt: '#0ea5e9', skin: '#d4a574' },
  scraper:  { hair: '#1a1a1a', shirt: '#333333', skin: '#c8956c', accessory: 'headset' },
  qa:       { hair: '#3a2010', shirt: '#f43f5e', skin: '#c8956c', accessory: 'glasses' },
  security: { hair: '#1a1a1a', shirt: '#ef4444', skin: '#b8845c' },
  devops:   { hair: '#f59e0b', shirt: '#f97316', skin: '#c8956c' },
  growth:   { hair: '#4a2040', shirt: '#a855f7', skin: '#d4a574' },
  content:  { hair: '#d946ef', shirt: '#ec4899', skin: '#c8956c' },
  'ig-oracle': { hair: '#ff6b9d', shirt: '#e11d48', skin: '#b8845c', accessory: 'headset' },
  artem:    { hair: '#8b5cf6', shirt: '#7c3aed', skin: '#c8956c', accessory: 'glasses' },
  pm:       { hair: '#374151', shirt: '#10b981', skin: '#d4a574' },
  // DESIGN STUDIO
  viktor:   { hair: '#f5f5f5', shirt: '#f97316', skin: '#c8956c', accessory: 'glasses' },
  pixel:    { hair: '#06b6d4', shirt: '#0ea5e9', skin: '#d4a574' },
  marka:    { hair: '#e04040', shirt: '#f43f5e', skin: '#b8845c' },
  sait:     { hair: '#1a1a1a', shirt: '#22c55e', skin: '#c8956c' },
  ruh:      { hair: '#a855f7', shirt: '#8b5cf6', skin: '#d4a574', accessory: 'headset' },
  prostir:  { hair: '#3b82f6', shirt: '#2563eb', skin: '#c8956c' },
  systema:  { hair: '#374151', shirt: '#6366f1', skin: '#b8845c', accessory: 'glasses' },
  koddesign:{ hair: '#f59e0b', shirt: '#f97316', skin: '#c8956c' },
  kontenta: { hair: '#ec4899', shirt: '#d946ef', skin: '#d4a574' },
  doslidnyk:{ hair: '#4a3020', shirt: '#14b8a6', skin: '#c8956c', accessory: 'glasses' },
}

const DEFAULT_PALETTE: { hair: string; shirt: string; skin: string; accessory?: string } = { hair: '#1a1a1a', shirt: '#2a2a2a', skin: '#c8956c' }

interface PixelCharProps {
  working: boolean
  accentColor: string
  isBoss?: boolean
  agentId?: string
}

export default function PixelChar({ working, accentColor, isBoss, agentId }: PixelCharProps) {
  const palette = (agentId && AGENT_PALETTES[agentId]) || DEFAULT_PALETTE
  const hairColor = palette.hair
  const shirtColor = isBoss ? accentColor : palette.shirt
  const skinColor = palette.skin
  const pantsColor = '#1e1e1e'

  return (
    <svg
      width="32"
      height="48"
      viewBox="0 0 32 48"
      style={{
        imageRendering: 'pixelated',
        animation: working
          ? 'typing 0.5s ease-in-out infinite'
          : 'idle-think 4s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Hair */}
      <rect x="9" y="0" width="14" height="4" fill={hairColor} />
      <rect x="7" y="3" width="18" height="3" fill={hairColor} />
      {/* Side hair strands */}
      <rect x="6" y="4" width="2" height="4" fill={hairColor} opacity="0.7" />
      <rect x="24" y="4" width="2" height="4" fill={hairColor} opacity="0.7" />

      {/* Head */}
      <rect x="8" y="5" width="16" height="13" fill={skinColor} />
      {/* Ears */}
      <rect x="6" y="9" width="2" height="4" fill={skinColor} />
      <rect x="24" y="9" width="2" height="4" fill={skinColor} />

      {/* Eyes */}
      <rect x="11" y="10" width="3" height="3" fill="#1a1a1a"
        style={{ animation: 'blink 4s infinite', transformOrigin: '12.5px 11.5px' }}
      />
      <rect x="18" y="10" width="3" height="3" fill="#1a1a1a"
        style={{ animation: 'blink 4s 0.1s infinite', transformOrigin: '19.5px 11.5px' }}
      />
      {/* Eye highlights */}
      <rect x="12" y="10" width="1" height="1" fill="rgba(255,255,255,0.6)" />
      <rect x="19" y="10" width="1" height="1" fill="rgba(255,255,255,0.6)" />

      {/* Glasses accessory */}
      {palette.accessory === 'glasses' && (
        <>
          <rect x="10" y="9" width="5" height="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
          <rect x="17" y="9" width="5" height="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
          <rect x="15" y="10" width="2" height="1" fill="rgba(255,255,255,0.2)" />
        </>
      )}

      {/* Headset accessory */}
      {palette.accessory === 'headset' && (
        <>
          <rect x="5" y="7" width="1" height="7" fill="#444" />
          <rect x="5" y="6" width="22" height="2" rx="1" fill="#444" opacity="0.6" />
          <rect x="4" y="9" width="3" height="4" rx="1" fill="#555" />
        </>
      )}

      {/* Eyebrows */}
      <rect x="11" y="8" width="3" height="1" fill={hairColor} opacity="0.5" />
      <rect x="18" y="8" width="3" height="1" fill={hairColor} opacity="0.5" />

      {/* Mouth */}
      <rect x="13" y="15" width={working ? 6 : 4} height="1" fill="#8b5a3a" />
      {working && <rect x="14" y="14" width="4" height="1" fill="#8b5a3a" opacity="0.5" />}

      {/* Neck */}
      <rect x="13" y="18" width="6" height="3" fill={skinColor} />

      {/* Shirt / Body */}
      <rect x="6" y="21" width="20" height="12" fill={shirtColor} />
      {/* Collar */}
      <rect x="12" y="21" width="8" height="3" fill={skinColor} opacity="0.9" />
      {/* Shirt detail — darker fold */}
      <rect x="15" y="24" width="2" height="8" fill="rgba(0,0,0,0.15)" />

      {/* Boss star badge */}
      {isBoss && (
        <rect x="23" y="22" width="4" height="4" rx="1" fill="#facc15" />
      )}

      {/* Arms */}
      <rect x="2" y="21" width="4" height="10" fill={skinColor}
        style={{
          animation: working ? 'arm-move 0.4s ease-in-out infinite' : undefined,
          transformOrigin: '4px 21px',
        }}
      />
      <rect x="26" y="21" width="4" height="10" fill={skinColor}
        style={{
          animation: working ? 'arm-move 0.4s ease-in-out infinite reverse' : undefined,
          transformOrigin: '28px 21px',
        }}
      />

      {/* Hands */}
      <rect x="1" y="31" width="4" height="3" fill={skinColor} />
      <rect x="27" y="31" width="4" height="3" fill={skinColor} />

      {/* Legs */}
      <rect x="9" y="33" width="6" height="10" fill={pantsColor} />
      <rect x="17" y="33" width="6" height="10" fill={pantsColor} />
      {/* Leg seam */}
      <rect x="15" y="33" width="2" height="10" fill="rgba(0,0,0,0.2)" />

      {/* Shoes */}
      <rect x="8" y="43" width="7" height="4" rx="1" fill="#0a0a0a" />
      <rect x="17" y="43" width="7" height="4" rx="1" fill="#0a0a0a" />
      {/* Shoe highlights */}
      <rect x="9" y="43" width="5" height="1" fill="rgba(255,255,255,0.06)" />
      <rect x="18" y="43" width="5" height="1" fill="rgba(255,255,255,0.06)" />
    </svg>
  )
}
