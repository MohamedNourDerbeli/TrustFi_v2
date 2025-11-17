// supabase/functions/dynamic-metadata/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createPublicClient, http } from 'https://esm.sh/viem@2.7.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const profileId = url.searchParams.get('profileId')

    console.log('[dynamic-metadata] Request:', { profileId })

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'Missing profileId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create public client
    const publicClient = createPublicClient({
      transport: http('https://rpc.api.moonbase.moonbeam.network'),
    })

    // Contract addresses
    const REPUTATION_CARD_ADDRESS = '0x60349A98a7C743bb3B7FDb5580f77748578B34e3'
    const KUSAMA_SVG_ADDRESS = '0xF320656B42F663508CE06deE19C04b7C4Dc2FB89'
    
    // ABIs
    const ReputationCardABI = [
      {
        inputs: [{ internalType: 'uint256', name: 'profileId', type: 'uint256' }],
        name: 'calculateScoreForProfile',
        outputs: [{ internalType: 'uint256', name: 'total', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const

    // We generate a richer pixel-art SVG off-chain for a more interesting visual.

    // Get reputation score
    let score = 0n
    try {
      score = await publicClient.readContract({
        address: REPUTATION_CARD_ADDRESS as `0x${string}`,
        abi: ReputationCardABI,
        functionName: 'calculateScoreForProfile',
        args: [BigInt(profileId)],
      })
      console.log('[dynamic-metadata] Score from contract:', score.toString())
    } catch (err) {
      console.error('[dynamic-metadata] Error reading score:', err)
      // Continue with score = 0 if read fails
    }

    // Generate evolving pixel-art creature that changes with score
    const svg = generateEvolvingSpriteSVG(Number(score), Number(profileId))
    const imageDataURI = `data:image/svg+xml;base64,${btoa(svg)}`

    // Generate metadata
    const stageInfo = getEvolutionStage(Number(score))
    const nextStage = getNextEvolutionThreshold(Number(score))
    const metadata = {
      name: `Kusama Living Profile #${profileId}`,
      description: `This evolving pixel creature reflects your TrustFi journey. Current stage: ${stageInfo.name}. Score: ${score.toString()}. It grows in complexity and gains new traits as your reputation increases.`,
      image: imageDataURI,
      attributes: [
        { trait_type: 'Reputation Score', value: score.toString() },
        { trait_type: 'Profile ID', value: profileId },
        { trait_type: 'Evolution Stage', value: stageInfo.name },
        { trait_type: 'Dynamic', value: 'true' },
        { trait_type: 'On-Chain Art', value: 'true' },
        ...(nextStage ? [{ trait_type: 'Next Evolution At', value: nextStage }] : [])
      ],
    }

    console.log('[dynamic-metadata] Returning metadata')

    return new Response(JSON.stringify(metadata), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[dynamic-metadata] Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Deterministic PRNG (Mulberry32)
function mulberry32(seed: number) {
  let t = seed >>> 0
  return function() {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function palette(h: number) {
  // Generate a harmonious palette from a base hue
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  const h2rgb = (hh: number, s: number, l: number) => {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0, g = 0, b = 0
    if (hh < 60) { r = c; g = x; b = 0 }
    else if (hh < 120) { r = x; g = c; b = 0 }
    else if (hh < 180) { r = 0; g = c; b = x }
    else if (hh < 240) { r = 0; g = x; b = c }
    else if (hh < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    const R = Math.round((r + m) * 255)
    const G = Math.round((g + m) * 255)
    const B = Math.round((b + m) * 255)
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`
  }
  return [
    h2rgb(h % 360, 0.75, 0.55),
    h2rgb((h + 40) % 360, 0.70, 0.60),
    h2rgb((h + 80) % 360, 0.65, 0.50),
    '#111218'
  ]
}

// Evolution stages definition
const EVOLUTION_STAGES = [
  { name: 'Egg', min: 0, grid: 12 },
  { name: 'Hatchling', min: 50, grid: 14 },
  { name: 'Mature', min: 200, grid: 16 },
  { name: 'Ascended', min: 500, grid: 20 },
  { name: 'Legendary', min: 1000, grid: 24 },
] as const

function getEvolutionStage(score: number) {
  let stage = EVOLUTION_STAGES[0]
  for (const s of EVOLUTION_STAGES) if (score >= s.min) stage = s
  return stage
}

function getNextEvolutionThreshold(score: number): number | null {
  const remaining = EVOLUTION_STAGES.filter(s => s.min > score).sort((a,b) => a.min - b.min)
  return remaining.length ? remaining[0].min : null
}

function generateEvolvingSpriteSVG(score: number, profileId: number): string {
  const W = 400, H = 400
  const stage = getEvolutionStage(score)
  const grid = stage.grid
  const cell = Math.floor(W / grid)
  const baseHue = (profileId * 41 + score * 13 + stage.grid * 7) % 360
  const colors = palette(baseHue)
  const rnd = mulberry32(profileId ^ ((score + stage.grid) << 2))

  // Background & aura intensity increases with stage
  const auraStrength = Math.min(0.6, 0.15 + (EVOLUTION_STAGES.indexOf(stage) * 0.1))

  // Creature placement (central area) - shrink at early stages
  const creatureFraction = 0.55 + (EVOLUTION_STAGES.indexOf(stage) * 0.05)
  const creatureWidth = Math.floor(grid * creatureFraction)
  const xStart = Math.floor((grid - creatureWidth) / 2)

  const pixels: string[] = []
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(creatureWidth / 2); x++) {
      const r = rnd()
      // density scales with score & stage
      const densityBase = 0.38 - (EVOLUTION_STAGES.indexOf(stage) * 0.04)
      const on = r > densityBase
      const idx = Math.floor(r * 3)
      if (on) {
        const color = colors[idx]
        const rx = (x + xStart) * cell
        const ry = y * cell
        pixels.push(`<rect x="${rx}" y="${ry}" width="${cell}" height="${cell}" fill="${color}" />`)
        const mirrorX = (grid - 1 - (x + xStart)) * cell
        if (mirrorX !== rx) pixels.push(`<rect x="${mirrorX}" y="${ry}" width="${cell}" height="${cell}" fill="${color}" />`)
      }
    }
  }

  // Special stage visuals
  const extras: string[] = []
  if (stage.name === 'Egg') {
    // Simple egg shell ellipse
    extras.push(`<ellipse cx="${W/2}" cy="${H/2}" rx="${W*0.20}" ry="${H*0.26}" fill="${colors[1]}" stroke="${colors[0]}" stroke-width="4" />`)
    // Crack preview when close to hatching
    if (score >= 40) {
      extras.push(`<path d="M ${W/2 - 30} ${H/2} l 15 20 l 15 -18 l 15 22" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round" />`)
    }
  } else if (stage.name === 'Legendary') {
    // Aura & sparkles
    for (let i = 0; i < 30; i++) {
      const r = rnd()
      const sx = Math.floor(r * W)
      const sy = Math.floor(rnd() * H)
      const sc = colors[Math.floor(rnd() * 3)]
      extras.push(`<rect x="${sx}" y="${sy}" width="6" height="6" fill="${sc}" fill-opacity="0.7" rx="2" />`)
    }
  }

  const bg = `
    <defs>
      <radialGradient id="aura" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stop-color="${colors[1]}" stop-opacity="${auraStrength}" />
        <stop offset="100%" stop-color="#000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${colors[3]}"/>
    <rect width="${W}" height="${H}" fill="url(#aura)"/>
  `

  const overlay = `
    <text x="${W/2}" y="${H-50}" font-size="20" text-anchor="middle" fill="#ffffff" font-family="sans-serif">Score: ${score}</text>
    <text x="${W/2}" y="${H-24}" font-size="16" text-anchor="middle" fill="#ffffff" font-family="sans-serif">Stage: ${stage.name}</text>
  `

  return `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${bg}
      ${pixels.join('')}
      ${extras.join('')}
      ${overlay}
    </svg>
  `
}
