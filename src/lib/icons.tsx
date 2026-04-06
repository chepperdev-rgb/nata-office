'use client'

import {
  Monitor, BarChart3, Shield, Settings, Smartphone, Microscope, Palette,
  Building2, Pencil, TrendingUp, Crosshair, Search, Rocket, Megaphone,
  Pen, ClipboardList, Eye, Gem, Globe, Sparkles, Box, Dna, Zap, Ruler,
  Bot, MessageCircle, XCircle, CheckCircle, Moon, Trophy, Star,
  Check, LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Monitor, BarChart3, Shield, Settings, Smartphone, Microscope, Palette,
  Building2, Pencil, TrendingUp, Crosshair, Search, Rocket, Megaphone,
  Pen, ClipboardList, Eye, Gem, Globe, Sparkles, Box, Dna, Zap, Ruler,
  Bot, MessageCircle, XCircle, CheckCircle, Moon, Trophy, Star, Check,
}

/** Thought prefix emoji → icon name mapping */
export const THOUGHT_ICON_MAP: Record<string, string> = {
  '\u{1F4AD}': 'MessageCircle',  // 💭
  '\u26A1':    'Zap',             // ⚡
  '\u274C':    'XCircle',         // ❌
  '\u2705':    'CheckCircle',     // ✅
}

export function Icon({
  name,
  size = 14,
  color = 'currentColor',
  className = '',
}: {
  name: string
  size?: number
  color?: string
  className?: string
}) {
  const Comp = ICON_MAP[name]
  if (!Comp) return <span className={className}>{name}</span>
  return <Comp size={size} color={color} className={className} strokeWidth={1.8} />
}
