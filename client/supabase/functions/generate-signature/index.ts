// supabase/functions/generate-signature/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createWalletClient, http, parseEther } from 'https://esm.sh/viem@2.7.6';
import { privateKeyToAccount } from 'https://esm.sh/viem@2.7.6/accounts';
import { moonbaseAlpha } from 'https://esm.sh/viem@2.7.6/chains';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, profileOwner, templateId, tokenURI } = await req.json();

    if (!user || !profileOwner || !templateId || !tokenURI) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get issuer private key from environment
    const issuerPrivateKey = Deno.env.get('ISSUER_PRIVATE_KEY');
    if (!issuerPrivateKey) {
      throw new Error('ISSUER_PRIVATE_KEY not configured');
    }

    // Create wallet client for signing
    const account = privateKeyToAccount(issuerPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: moonbaseAlpha,
      transport: http(),
    });

    // Generate nonce (timestamp + random)
    const nonce = BigInt(Date.now()) * 1000000n + BigInt(Math.floor(Math.random() * 1000000));

    // Create message hash for signing
    // This should match the contract's CLAIM_TYPEHASH: keccak256("Claim(address user,address profileOwner,uint256 templateId,uint256 nonce)")
    const messageHash = await walletClient.signTypedData({
      domain: {
        name: 'TrustFi ReputationCard',
        version: '1',
        chainId: moonbaseAlpha.id,
        verifyingContract: Deno.env.get('REPUTATION_CARD_CONTRACT_ADDRESS') as `0x${string}`,
      },
      types: {
        Claim: [
          { name: 'user', type: 'address' },
          { name: 'profileOwner', type: 'address' },
          { name: 'templateId', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      },
      primaryType: 'Claim',
      message: {
        user: user as `0x${string}`,
        profileOwner: profileOwner as `0x${string}`,
        templateId: BigInt(templateId),
        nonce,
      },
    });

    return new Response(
      JSON.stringify({
        nonce: nonce.toString(),
        signature: messageHash,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating signature:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
