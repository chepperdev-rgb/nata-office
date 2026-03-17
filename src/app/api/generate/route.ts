import { NextRequest, NextResponse } from 'next/server'

const FAL_KEY = process.env.FAL_KEY!

function selectedAspect(width: number, height: number): string {
  if (width === height) return '1:1'
  if (width < height) return '3:4'
  return '4:3'
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, steps = 28, seed } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const model = 'fal-ai/flux-pro/v1.1-ultra'

    const res = await fetch(`https://fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        aspect_ratio: selectedAspect(width, height),
        num_inference_steps: steps,
        seed: seed === -1 ? undefined : seed,
        num_images: 1,
        enable_safety_checker: false,
        safety_tolerance: '6',
        output_format: 'jpeg',
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const data = await res.json()
    const imageUrl = data?.images?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }

    return NextResponse.json({ status: 'done', imageUrl, seed: data.seed })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET не нужен — fal синхронный
export async function GET() {
  return NextResponse.json({ status: 'done' })
}
