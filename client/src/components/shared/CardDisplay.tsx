// components/shared/CardDisplay.tsx
import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardABI from '../../lib/ReputationCard.abi.json';
import type { Address } from 'viem';
import type { Card } from '../../types/card';
import type { VerifiableCredential } from '../../types/kilt';
import { logger } from '../../lib/logger';
import { CredentialBadge } from '../user/CredentialBadge';

// Fallback metadata generator for cards with broken/missing metadata
function createFallbackMetadata(card: Card) {
  const tierNames = ['Bronze', 'Silver', 'Gold'];
  const tierName = tierNames[card.tier - 1] || 'Unknown';
  
  return {
    name: `${tierName} Card #${card.cardId.toString()}`,
    description: `A Tier ${card.tier} reputation card. This card represents achievement and contribution to the TrustFi ecosystem.`,
    image: '', // Will use fallback rendering in the component
    attributes: [
      { trait_type: 'Tier', value: card.tier },
      { trait_type: 'Card ID', value: card.cardId.toString() },
      { trait_type: 'Status', value: 'Active' }
    ]
  };
}

interface CardDisplayProps {
  card: Card;
  credential?: VerifiableCredential;
  compact?: boolean;
}

export function CardDisplay({ card, credential, compact = false }: CardDisplayProps) {
  const publicClient = usePublicClient();
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        if (!publicClient) return;

        logger.debug(`[CardDisplay] Fetching metadata for card ${card.cardId.toString()}`);

        // Special case: Kusama Living Profile template (dynamic metadata via Supabase Function)
        if (card.templateId && card.templateId.toString() === '999') {
          const base = import.meta.env.VITE_DYNAMIC_METADATA_URI as string | undefined;
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
          if (base) {
            const url = `${base}${card.profileId.toString()}`;
            const headers: HeadersInit = {};
            if (anonKey) headers['Authorization'] = `Bearer ${anonKey}`;
            try {
              const res = await fetch(url, { headers });
              if (!res.ok) {
                throw new Error(`Dynamic metadata fetch failed: ${res.status}`);
              }
              const dyn = await res.json();
              logger.debug('[CardDisplay] Loaded dynamic Kusama metadata:', dyn);
              setMetadata(dyn);
              setLoading(false);
              return; // skip on-chain tokenURI path
            } catch (e) {
              console.warn('[CardDisplay] Dynamic metadata endpoint failed, falling back to tokenURI', e);
              // continue to tokenURI fallback below
            }
          }
        }

        // Fetch tokenURI from contract
        // @ts-expect-error wagmi v2 typing quirk for readContract
        const tokenURI = await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'tokenURI',
          args: [card.cardId],
        }) as unknown as string;

        logger.debug(`[CardDisplay] TokenURI for card ${card.cardId.toString()}:`, tokenURI);

        // Fetch metadata from tokenURI
        if (tokenURI.startsWith('data:application/json;base64,')) {
          // Base64 encoded JSON
          const base64Data = tokenURI.replace('data:application/json;base64,', '');
          const jsonString = atob(base64Data);
          const metadata = JSON.parse(jsonString);
          logger.debug(`[CardDisplay] Parsed base64 metadata:`, metadata);
          setMetadata(metadata);
        } else if (tokenURI.startsWith('http')) {
          // HTTP URL - add auth header if it's a Supabase function
          const headers: HeadersInit = {};
          if (tokenURI.includes('supabase.co/functions')) {
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (anonKey) {
              headers['Authorization'] = `Bearer ${anonKey}`;
            }
          }
          
          try {
            const response = await fetch(tokenURI, { headers });
            if (!response.ok) {
              // If IPFS gateway fails, create fallback metadata
              if (tokenURI.includes('ipfs.io') || tokenURI.includes('pinata') || tokenURI.includes('ipfs://')) {
                console.warn('[CardDisplay] IPFS gateway failed, using fallback metadata');
                setMetadata(createFallbackMetadata(card));
                return;
              }
              throw new Error(`Failed to fetch metadata: ${response.statusText}`);
            }
            const metadata = await response.json();
            logger.debug(`[CardDisplay] Fetched HTTP metadata:`, metadata);
            setMetadata(metadata);
          } catch (fetchError) {
            // Fallback to generated metadata if fetch fails
            console.error('[CardDisplay] Fetch failed, using fallback:', fetchError);
            setMetadata(createFallbackMetadata(card));
          }
        } else {
          // Unknown format - create fallback
          console.warn('[CardDisplay] Unknown tokenURI format, using fallback');
          setMetadata(createFallbackMetadata(card));
        }
      } catch (err) {
        console.error('[CardDisplay] Error fetching card metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to load card');
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [card, publicClient]);

  if (loading) {
    return (
      <div className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200 animate-pulse">
        <div className="relative w-full h-48 rounded-xl mb-4 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="group bg-gradient-to-br from-red-50 to-white rounded-2xl p-5 border border-red-200">
        <div className="relative w-full h-48 rounded-xl mb-4 bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white">
          <div className="text-center">
            <span className="text-4xl font-bold block">⚠️</span>
            <span className="text-sm mt-2 block">Failed to load</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-900">Card #{card.cardId.toString()}</p>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const tierPoints = card.tier === 1 ? 10 : card.tier === 2 ? 50 : 200;

  return (
    <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:scale-105 cursor-pointer">
      <div className="relative w-full h-48 rounded-xl mb-4 overflow-hidden">
        {/* Credential Badge Overlay */}
        {credential && <CredentialBadge card={card} credential={credential} compact={compact} />}
        {metadata.image ? (
          <img 
            src={metadata.image} 
            alt={metadata.name || `Card #${card.cardId.toString()}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              logger.error('[CardDisplay] Image failed to load:', metadata.image);
              const target = e.currentTarget;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br ${
                    card.tier === 1 ? 'from-green-400 to-green-600' :
                    card.tier === 2 ? 'from-blue-400 to-blue-600' :
                    'from-purple-400 to-purple-600'
                  } flex items-center justify-center text-white">
                    <div class="text-center">
                      <div class="text-5xl font-black drop-shadow-lg">#${card.cardId.toString()}</div>
                      <div class="text-sm mt-2">Tier ${card.tier}</div>
                    </div>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white font-bold ${
            card.tier === 1 ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' :
            card.tier === 2 ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600' :
            'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
          }`}>
            <div className="relative">
              <div className="text-5xl font-black drop-shadow-lg">#{card.cardId.toString()}</div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold">
                T{card.tier}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900 truncate">
            {metadata.name || `Card #${card.cardId.toString()}`}
          </p>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${
            card.tier === 1 ? 'bg-green-100 text-green-700' :
            card.tier === 2 ? 'bg-blue-100 text-blue-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {tierPoints} pts
          </span>
        </div>
        {metadata.description && !compact && (
          <p className="text-xs text-gray-600 line-clamp-2">{metadata.description}</p>
        )}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(card.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {Array.isArray(metadata.attributes) && metadata.attributes.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(metadata.attributes as Array<{ trait_type: string; value: string | number }>).slice(0, 2).map((attr, idx: number) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {attr.trait_type}: {attr.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
