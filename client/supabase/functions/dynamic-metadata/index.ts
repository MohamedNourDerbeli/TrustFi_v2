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

    // Get reputation score
    const REPUTATION_CARD_ADDRESS = '0x60BdA778B580262376aAd0Bc8a15AEe374168559'
    const ReputationCardABI = [
      {
        inputs: [{ internalType: 'uint256', name: 'profileId', type: 'uint256' }],
        name: 'calculateScoreForProfile',
        outputs: [{ internalType: 'uint256', name: 'total', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const

    let score = 0n
    try {
      score = await publicClient.readContract({
        address: REPUTATION_CARD_ADDRESS as `0x${string}`,
        abi: ReputationCardABI,
        functionName: 'calculateScoreForProfile',
        args: [BigInt(profileId)],
      })
      console.log('[dynamic-metadata] Score:', score.toString())
    } catch (err) {
      console.error('[dynamic-metadata] Error reading score:', err)
      // Continue with score = 0 if read fails
    }

    // Generate metadata
    const metadata = {
      name: `Kusama Living Profile #${profileId}`,
      description: `A dynamic NFT that reflects your on-chain reputation score. Current score: ${score.toString()} points.`,
      image: `data:image/svg+xml;base64,${btoa(generateSVG(Number(score)))}`,
      attributes: [
        {
          trait_type: 'Reputation Score',
          value: score.toString(),
        },
        {
          trait_type: 'Profile ID',
          value: profileId,
        },
        {
          trait_type: 'Dynamic',
          value: 'true',
        },
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
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateSVG(score: number): string {
  const level = Math.min(Math.floor(score / 50) + 1, 5)
  const colors = ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90', '#4169E1']
  const color = colors[level - 1]

  return `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)"/>
      <circle cx="200" cy="200" r="150" fill="none" stroke="white" stroke-width="3"/>
      <text x="200" y="180" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
        Level ${level}
      </text>
      <text x="200" y="240" font-size="32" text-anchor="middle" fill="white">
        ${score} pts
      </text>
      <text x="200" y="320" font-size="20" text-anchor="middle" fill="white" opacity="0.8">
        Kusama Living Profile
      </text>
    </svg>
  `
}
