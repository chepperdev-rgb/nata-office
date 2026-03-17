'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────
interface GeneratedImage {
  id: string
  imageUrl: string
  prompt: string
  timestamp: number
  settings: { steps: number; width: number; height: number }
}

interface Model {
  id: string
  name: string
  description: string
  speed: string
  speedMs: string
  quality: number
  tags: string[]
  steps: number
}

// ─── Models Registry ─────────────────────────────────────────────────────────
const MODELS: Model[] = [
  {
    id: 'flux-schnell',
    name: 'FLUX.1 Schnell FP8',
    description: 'Быстрая генерация высокого качества. Отличный баланс скорости и детализации.',
    speed: 'Быстро',
    speedMs: '~8–15 сек',
    quality: 4,
    tags: ['Портреты', 'Пейзажи', 'Промо', 'Реализм'],
    steps: 4,
  },
]

const SIZES = [
  { label: 'Portrait', sub: '768×1024', w: 768, h: 1024, icon: '▯' },
  { label: 'Square', sub: '1024×1024', w: 1024, h: 1024, icon: '□' },
  { label: 'Landscape', sub: '1024×768', w: 1024, h: 768, icon: '▭' },
]

const RANDOM_PROMPTS = [
  'A cinematic portrait of a woman with silver hair, dramatic lighting, photorealistic, 8k',
  'Futuristic city at night, neon lights reflecting on wet pavement, cyberpunk aesthetic',
  'Majestic mountain landscape at golden hour, dramatic clouds, ultra detailed',
  'Abstract geometric art with deep purple and gold tones, minimalist, modern',
  'Close-up of a blooming red rose with morning dew drops, macro photography',
  'Astronaut floating in deep space, Earth visible below, cinematic lighting',
  'Cozy coffee shop interior, warm bokeh lights, rainy window, aesthetic',
  'Viking warrior portrait, epic armor, fog, dramatic shadows, oil painting style',
]

const PROMPT_MAX = 500

const TIPS_CATEGORIES = [
  { key: 'start', label: 'Как начать', color: '#4ade80', content: 'Выбери модель → напиши промпт на английском → нажми Generate. Первая генерация может быть медленнее (загрузка модели в память).' },
  {
    key: 'prompts', label: 'Советы по промптам', color: '#a855f7', items: [
      ['Указывай стиль:', 'photorealistic, oil painting, anime, cinematic'],
      ['Добавляй качество:', '8k, ultra detailed, sharp focus'],
      ['Описывай освещение:', 'golden hour, dramatic lighting, soft bokeh'],
      ['Для портретов:', 'close-up portrait, professional photo'],
    ]
  },
  {
    key: 'settings', label: 'Настройки', color: '#38bdf8', items: [
      ['Шаги 4', '— быстро, FLUX Schnell оптимален'],
      ['Шаги 8+', '— немного лучше детализация'],
      ['Seed', '— зафиксируй число чтобы повторить результат'],
    ]
  },
  {
    key: 'faq', label: 'FAQ', color: '#facc15', items: [
      ['ComfyUI offline?', '— запусти: cd ~/ComfyUI && python main.py'],
      ['Медленно?', '— первый запрос загружает модель (~30 сек), потом быстрее'],
      ['Чёрная картинка?', '— VAE не загружен, проверь models/vae/'],
    ]
  },
]

// ─── Shimmer keyframes (injected once) ──────────────────────────────────────
const shimmerCSS = `
@keyframes aistudio-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes aistudio-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.15); }
  50% { box-shadow: 0 0 14px rgba(168,85,247,0.6), 0 0 30px rgba(168,85,247,0.25); }
}
`

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconSparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconDice() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="5.5" cy="5.5" r="1" fill="currentColor"/>
      <circle cx="10.5" cy="5.5" r="1" fill="currentColor"/>
      <circle cx="5.5" cy="10.5" r="1" fill="currentColor"/>
      <circle cx="10.5" cy="10.5" r="1" fill="currentColor"/>
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
    </svg>
  )
}
function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconInfo() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 7v5M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconImage() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 15l4.5-4.5a1.5 1.5 0 0 1 2.12 0L15 15.88" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M14 14l1.5-1.5a1.5 1.5 0 0 1 2.12 0L21 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < count ? '#a855f7' : 'rgba(255,255,255,0.15)', fontSize: 10 }}>★</span>
      ))}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIStudioPanel() {
  const [comfyStatus, setComfyStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [selectedModel, setSelectedModel] = useState(MODELS[0])
  const [prompt, setPrompt] = useState('')
  const [selectedSize, setSelectedSize] = useState(SIZES[1]) // Square default
  const [steps, setSteps] = useState(4)
  const [seed, setSeed] = useState(-1)
  const [seedInput, setSeedInput] = useState('-1')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [error, setError] = useState('')
  const [genTime, setGenTime] = useState<number | null>(null)
  const genStartRef = useRef<number>(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // fal.ai always online
  useEffect(() => { setComfyStatus('online') }, [])

  const randomPrompt = () => {
    const p = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)]
    setPrompt(p)
  }

  const randomSeed = () => {
    const s = Math.floor(Math.random() * 999999999)
    setSeed(s)
    setSeedInput(String(s))
  }

  const stopProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = null
  }, [])

  const generate = async () => {
    if (!prompt.trim() || generating) return
    setError('')
    setGenerating(true)
    setProgress(0)
    setGenTime(null)
    genStartRef.current = Date.now()

    // Animate progress bar
    let prog = 0
    progressRef.current = setInterval(() => {
      prog = Math.min(prog + Math.random() * 15, 90)
      setProgress(prog)
    }, 300)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          steps,
          width: selectedSize.w,
          height: selectedSize.h,
          seed,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || 'Generation failed')
      }

      stopProgress()
      setProgress(100)
      setGenTime(Math.round((Date.now() - genStartRef.current) / 1000))
      const img: GeneratedImage = {
        id: `${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: prompt.trim(),
        timestamp: Date.now(),
        settings: { steps, width: selectedSize.w, height: selectedSize.h },
      }
      setCurrentImage(img)
      setHistory(prev => [img, ...prev].slice(0, 8))
      setTimeout(() => {
        setGenerating(false)
        setProgress(0)
      }, 500)
    } catch (e) {
      stopProgress()
      setError(String(e))
      setGenerating(false)
      setProgress(0)
    }
  }

  const downloadImage = (img: GeneratedImage) => {
    const a = document.createElement('a')
    a.href = img.imageUrl
    a.download = `aistudio_${img.id.slice(0, 8)}.png`
    a.click()
  }

  useEffect(() => () => stopProgress(), [stopProgress])

  const isDisabled = generating || !prompt.trim()
  const isActive = !isDisabled && !generating

  return (
    <div className="flex flex-col gap-5 p-5 max-w-lg mx-auto">
      {/* Inject shimmer keyframes */}
      <style>{shimmerCSS}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span style={{ color: '#a855f7' }}><IconSparkle /></span>
          <span className="text-sm font-semibold text-white/80 tracking-wide">AI Studio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}
          />
          <span className="text-[10px] text-white/30">fal.ai · ~2 сек</span>
        </div>
      </div>



      {/* ── Model Selection ── */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Модель</div>
        <div className="flex flex-col gap-2">
          {MODELS.map(m => {
            const isSelected = selectedModel.id === m.id
            return (
              <motion.button
                key={m.id}
                onClick={() => { setSelectedModel(m); setSteps(m.steps) }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-xl p-3 text-left transition-colors relative"
                style={{
                  background: isSelected ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  animation: isSelected ? 'aistudio-glow-pulse 2.5s ease-in-out infinite' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: isSelected ? '#c084fc' : 'rgba(255,255,255,0.7)' }}>{m.name}</span>
                  <div className="flex items-center gap-2">
                    <Stars count={m.quality} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>{m.speedMs}</span>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 mb-2">{m.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map(t => (
                    <motion.span
                      key={t}
                      whileHover={{ scale: 1.08, backgroundColor: 'rgba(168,85,247,0.15)' }}
                      className="text-[9px] px-2 py-0.5 rounded-full cursor-default transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', color: isSelected ? 'rgba(192,132,252,0.8)' : 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Prompt ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest text-white/25">Промпт</div>
          <motion.button
            onClick={randomPrompt}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(168,85,247,0.15)' }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'rgba(168,85,247,0.8)', background: 'rgba(168,85,247,0.08)' }}
            title="Случайный промпт"
          >
            <IconDice /> случайный
          </motion.button>
        </div>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={e => { if (e.target.value.length <= PROMPT_MAX) setPrompt(e.target.value) }}
            placeholder="Imagine anything... A hyperrealistic photo of a glowing jellyfish in a dark ocean, bioluminescent, cinematic lighting, 8k"
            rows={4}
            className="w-full rounded-xl p-3 pb-6 text-xs resize-none outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: prompt ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.border = '1px solid rgba(168,85,247,0.4)'}
            onBlur={e => e.target.style.border = prompt ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.06)'}
          />
          <span
            className="absolute bottom-2 right-3 text-[10px] pointer-events-none"
            style={{ color: prompt.length > PROMPT_MAX * 0.9 ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.2)' }}
          >
            {prompt.length} / {PROMPT_MAX}
          </span>
        </div>
        <div className="text-[10px] text-white/20 mt-1.5">
          Совет: пиши на английском для лучшего результата. Указывай стиль, освещение и детали.
        </div>
      </div>

      {/* ── Size Presets ── */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Размер</div>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map(s => {
            const isSel = selectedSize.label === s.label
            return (
              <motion.button
                key={s.label}
                onClick={() => setSelectedSize(s)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl py-2.5 text-center transition-colors"
                style={{
                  background: isSel ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSel ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-base mb-0.5" style={{ color: isSel ? '#c084fc' : 'rgba(255,255,255,0.3)' }}>{s.icon}</div>
                <div className="text-[10px] font-medium" style={{ color: isSel ? '#c084fc' : 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                <div className="text-[9px] text-white/25">{s.sub}</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Advanced Settings (collapsible) ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setAdvancedOpen(p => !p)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-white/40 hover:text-white/60 transition-all"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.9 3.9l1.4 1.4M10.7 10.7l1.4 1.4M3.9 12.1l1.4-1.4M10.7 5.3l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Настройки
          </span>
          <IconChevron open={advancedOpen} />
        </button>
        <AnimatePresence>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-2 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

                {/* Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/40">Шаги генерации</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/60" style={{ color: '#a855f7' }}>{steps}</span>
                      <span className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                        {steps <= 4 ? 'Быстро' : steps <= 8 ? 'Баланс' : 'Качество'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range" min="1" max="20" value={steps}
                    onChange={e => setSteps(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#a855f7', background: `linear-gradient(to right, #a855f7 ${(steps/20)*100}%, rgba(255,255,255,0.1) ${(steps/20)*100}%)` }}
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-1">
                    <span>1 — быстрее</span>
                    <span>20 — качественнее</span>
                  </div>
                  <div className="text-[9px] text-white/25 mt-1 flex items-start gap-1">
                    <IconInfo />
                    FLUX Schnell оптимален при 4 шагах. Больше шагов не всегда лучше.
                  </div>
                </div>

                {/* Seed */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/40">Seed</span>
                    <span className="text-[9px] text-white/20">-1 = случайный</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seedInput}
                      onChange={e => { setSeedInput(e.target.value); setSeed(Number(e.target.value) || -1) }}
                      className="flex-1 rounded-lg px-3 py-2 text-xs font-mono outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                    />
                    <motion.button
                      onClick={randomSeed}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 rounded-lg transition-colors"
                      style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#a855f7' }}
                      title="Случайный seed"
                    >
                      <IconDice />
                    </motion.button>
                  </div>
                  <div className="text-[9px] text-white/25 mt-1 flex items-start gap-1">
                    <IconInfo />
                    Один seed = одинаковые результаты при том же промпте. Используй для воспроизводимости.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl px-3 py-2.5 text-xs text-red-400/80"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Generate Button ── */}
      <div>
        <motion.button
          onClick={generate}
          disabled={isDisabled}
          whileHover={isActive ? { scale: 1.015 } : {}}
          whileTap={isActive ? { scale: 0.97 } : {}}
          className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all relative overflow-hidden"
          style={{
            background: generating
              ? 'rgba(168,85,247,0.2)'
              : (!prompt.trim() )
                ? 'rgba(255,255,255,0.04)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: (!prompt.trim() )
              ? 'rgba(255,255,255,0.2)'
              : generating ? 'rgba(192,132,252,0.8)' : '#fff',
            border: generating ? '1px solid rgba(168,85,247,0.3)' : (!prompt.trim() ) ? '1px solid rgba(255,255,255,0.06)' : 'none',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="block w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full"
              />
              Генерирую...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 relative z-10">
              <IconSparkle /> Generate
            </span>
          )}
          {/* Shimmer effect for active state */}
          {isActive && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                overflow: 'hidden',
              }}
            >
              <span
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                  animation: 'aistudio-shimmer 2.5s ease-in-out infinite',
                }}
              />
            </span>
          )}
          {/* Pulse effect while generating */}
          {generating && (
            <motion.span
              className="absolute inset-0 rounded-xl"
              animate={{ opacity: [0.15, 0.05, 0.15] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ background: 'rgba(168,85,247,0.4)' }}
            />
          )}
        </motion.button>

        {/* Speed hint */}
        <div className="text-center text-[10px] text-white/20 mt-1.5">
          {generating ? 'Ожидай результата...' : `${selectedModel.speedMs} на ${selectedModel.name}`}
        </div>

        {/* Progress bar with glow */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', transformOrigin: 'left' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
                  boxShadow: '0 0 8px rgba(168,85,247,0.6), 0 0 20px rgba(168,85,247,0.3)',
                }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Result ── */}
      <AnimatePresence>
        {currentImage ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(168,85,247,0.2)' }}
          >
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.imageUrl}
                alt={currentImage.prompt}
                className="w-full object-cover rounded-t-xl"
                style={{ display: 'block' }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-end justify-end p-3"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, transparent 60%)',
                  transition: 'opacity 0.3s ease',
                }}
              >
                <motion.button
                  onClick={() => downloadImage(currentImage)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium backdrop-blur-sm"
                  style={{ background: 'rgba(168,85,247,0.85)', color: '#fff' }}
                >
                  <IconDownload /> Скачать PNG
                </motion.button>
              </div>
            </div>
            <div className="px-3 py-2.5" style={{ background: 'rgba(168,85,247,0.04)' }}>
              <p className="text-[10px] text-white/40 line-clamp-2 mb-2">{currentImage.prompt}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', color: 'rgba(192,132,252,0.7)', border: '1px solid rgba(168,85,247,0.15)' }}>
                  {currentImage.settings.width}×{currentImage.settings.height}
                </span>
                <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(56,189,248,0.08)', color: 'rgba(56,189,248,0.6)', border: '1px solid rgba(56,189,248,0.12)' }}>
                  {currentImage.settings.steps} steps
                </span>
                {genTime !== null && (
                  <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.08)', color: 'rgba(74,222,128,0.6)', border: '1px solid rgba(74,222,128,0.12)' }}>
                    {genTime}s
                  </span>
                )}
                <span className="inline-flex items-center text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {new Date(currentImage.timestamp).toLocaleTimeString('ru')}
                </span>
              </div>
            </div>
          </motion.div>
        ) : !generating ? (
          /* Empty state placeholder */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl flex flex-col items-center justify-center py-10 gap-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
          >
            <span style={{ color: 'rgba(168,85,247,0.3)' }}><IconImage /></span>
            <span className="text-[11px] text-white/20">Здесь появится твоя генерация</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── History ── */}
      <AnimatePresence>
        {history.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">История</div>
            <div className="grid grid-cols-4 gap-2">
              {history.slice(1).map(img => {
                const isActive = currentImage?.id === img.id
                return (
                  <motion.button
                    key={img.id}
                    onClick={() => setCurrentImage(img)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-lg overflow-hidden aspect-square transition-all"
                    style={{
                      border: isActive ? '2px solid rgba(168,85,247,0.6)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isActive ? '0 0 10px rgba(168,85,247,0.3)' : 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Help / Tips ── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setHelpOpen(p => !p)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] uppercase tracking-widest text-white/25 hover:text-white/40 transition-all"
          style={{ background: 'rgba(255,255,255,0.01)' }}
        >
          <span className="flex items-center gap-1.5"><IconInfo /> Советы и FAQ</span>
          <IconChevron open={helpOpen} />
        </button>
        <AnimatePresence>
          {helpOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-2 space-y-4 text-[11px] text-white/40" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {TIPS_CATEGORIES.map(cat => (
                  <div key={cat.key}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="font-semibold text-white/60">{cat.label}</span>
                    </div>
                    {'content' in cat ? (
                      <p className="ml-3.5">{cat.content}</p>
                    ) : (
                      <ul className="space-y-1 ml-3.5 list-none">
                        {cat.items.map((item, i) => (
                          <li key={i}>
                            <span className="text-white/20 mr-1">&#8226;</span>
                            <span className="text-white/55">{item[0]}</span>{' '}
                            {cat.key === 'faq' && item[0] === 'ComfyUI offline?'
                              ? <>{item[1].replace('— запусти: ', '— запусти: ')}<code className="text-purple-400/80 text-[10px]">cd ~/ComfyUI && python main.py</code></>
                              : <span>{item[1]}</span>
                            }
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
