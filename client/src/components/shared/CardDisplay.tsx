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
      <div className="tf-card tf-card-skeleton">
        <div className="tf-card-media">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent border-white/70"></div>
        </div>
        <div className="tf-card-footer">
          <div className="h-3 w-5/6 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-1/4 rounded bg-gray-200" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <div className="h-4 w-14 rounded bg-gray-200" />
            <div className="h-4 w-12 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className="tf-card" style={{borderColor:'var(--tf-danger)'}}>
        <div className="tf-card-media" style={{background:'linear-gradient(135deg,#dc2626,#f87171)'}}>
          <div className="text-center text-white">
            <div className="text-3xl font-black mb-1">⚠️</div>
            <div className="text-xs font-semibold tracking-wide">Failed to load</div>
          </div>
        </div>
        <div className="tf-card-footer">
          <div className="flex items-center">
            <span className="tf-card-title">Card #{card.cardId.toString()}</span>
            <span className="tf-card-pts" style={{background:'linear-gradient(135deg,#dc2626,#ef4444)'}}>ERR</span>
          </div>
          <p className="text-xs" style={{color:'var(--tf-danger)'}}>{error}</p>
        </div>
      </div>
    );
  }

  const tierPoints = card.tier === 1 ? 10 : card.tier === 2 ? 50 : 200;

  return (
    <div className="tf-card">
      <div className="tf-card-media">
        {credential && <CredentialBadge card={card} credential={credential} compact={compact} />}
        <div className={`tf-card-tier t${card.tier}`}>T{card.tier}</div>
        {metadata.image ? (
          <img
            src={metadata.image}
            alt={metadata.name || `Card #${card.cardId.toString()}`}
            loading="lazy"
            onError={(e) => {
              logger.error('[CardDisplay] Image failed to load:', metadata.image);
              const target = e.currentTarget;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = `<div class='w-full h-full flex items-center justify-center text-white'>
                  <div class='text-center'>
                    <div class='text-4xl font-black'>#${card.cardId.toString()}</div>
                    <div class='text-xs mt-1 tracking-wide'>Tier ${card.tier}</div>
                  </div>
                </div>`;
                target.parentElement.classList.add('fallback');
                target.parentElement.classList.add(`tier-${card.tier}`);
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white">
            <div className="text-4xl font-black">#{card.cardId.toString()}</div>
            <div className="text-xs tracking-wide mt-1">Tier {card.tier}</div>
          </div>
        )}
      </div>
      <div className="tf-card-footer">
        <div className="flex items-center">
          <span className="tf-card-title" title={metadata.name}>{metadata.name || `Card #${card.cardId.toString()}`}</span>
          <span className="tf-card-pts">{tierPoints} pts</span>
        </div>
        {metadata.description && !compact && (
          <p className="text-xs line-clamp-2" style={{color:'var(--tf-text-muted)'}}>{metadata.description}</p>
        )}
        <div className="tf-card-meta">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(card.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        {Array.isArray(metadata.attributes) && metadata.attributes.length > 0 && !compact && (
          <div className="tf-attr-tags">
            {(metadata.attributes as Array<{ trait_type: string; value: string | number }>).slice(0,3).map((attr, idx:number) => (
              <span key={idx} className="tf-attr-tag" title={`${attr.trait_type}: ${attr.value}`}>{attr.trait_type}: {attr.value}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
