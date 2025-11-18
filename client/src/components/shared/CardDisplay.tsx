// components/shared/CardDisplay.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  const [imageFailed, setImageFailed] = useState(false);

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
              setImageFailed(false);
              setLoading(false);
              return; // skip on-chain tokenURI path
            } catch (e) {
              console.warn('[CardDisplay] Dynamic metadata endpoint failed, falling back to tokenURI', e);
              // continue to tokenURI fallback below
            }
          }
        }

        // Fetch tokenURI from contract (standard metadata path)
        // @ts-expect-error wagmi v2 typing quirk for readContract
        const tokenURI = await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'tokenURI',
          args: [card.cardId]
        });

        if (typeof tokenURI === 'string' && tokenURI.length > 0) {
          let url = tokenURI;
          // Handle ipfs:// URIs
          if (url.startsWith('ipfs://')) {
            url = `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`;
          }
          try {
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              setMetadata(json);
              setImageFailed(false);
              setLoading(false);
              return;
            } else {
              throw new Error(`Metadata HTTP ${res.status}`);
            }
          } catch (e) {
            logger.warn('[CardDisplay] Failed to fetch tokenURI metadata, using fallback', e);
          }
        }

        // Fallback metadata if nothing loaded
        setMetadata(createFallbackMetadata(card));
        setImageFailed(true);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [card, publicClient]);

  useEffect(() => {
    setImageFailed(false);
  }, [card.cardId, metadata?.image]);

  const renderFallbackVisual = (variant: 'grid' | 'list') => (
    <div
      className={`flex h-full w-full items-center justify-center ${
        variant === 'grid'
          ? 'bg-gradient-to-br from-indigo-500/60 via-purple-500/60 to-blue-500/60'
          : 'bg-slate-800/80'
      } text-white`}
    >
      <div className="text-center">
        <div className={variant === 'grid' ? 'text-3xl font-black' : 'text-base font-semibold'}>
          #{card.cardId.toString()}
        </div>
        <div
          className={`${
            variant === 'grid'
              ? 'mt-1 text-xs tracking-wide uppercase text-slate-100/90'
              : 'mt-0.5 text-[10px] uppercase tracking-wide text-slate-300/80'
          }`}
        >
          Tier {card.tier}
        </div>
      </div>
    </div>
  );

  if (loading) {
    if (compact) {
      return (
        <div className="grid animate-pulse grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[minmax(0,2.6fr)_repeat(4,minmax(0,1fr))]">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-slate-800/70" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-800/70" />
              <div className="h-3 w-20 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="hidden sm:block h-4 w-20 rounded bg-slate-800/70" />
          <div className="hidden sm:block h-4 w-16 rounded bg-slate-800/70" />
          <div className="hidden sm:block h-4 w-24 rounded bg-slate-800/70" />
          <div className="hidden sm:block h-4 w-28 rounded bg-slate-800/70" />
        </div>
      );
    }

    return (
      <div className="tf-card tf-card-skeleton tf-card-grid">
        <div className="tf-card-media">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-t-transparent border-white/70"></div>
        </div>
        <div className="tf-card-footer">
          <div className="h-3 w-5/6 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-1/4 rounded bg-gray-200" />
          </div>
          <div className="flex flex-wrap gap-1">
            <div className="h-4 w-14 rounded bg-gray-200" />
            <div className="h-4 w-12 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const tierPoints = card.tier === 1 ? 10 : card.tier === 2 ? 50 : 200;
  const issueDate = new Date(card.claimedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const issueTime = new Date(card.claimedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  if (error || !metadata) {
    if (compact) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm sm:grid-cols-[minmax(0,2.6fr)_repeat(4,minmax(0,1fr))]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/30 text-xl">⚠️</div>
            <div className="flex flex-col">
              <span className="font-semibold text-rose-100">Card #{card.cardId.toString()}</span>
              <span className="text-xs text-rose-200/80">{error || 'Failed to load metadata'}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center text-xs font-semibold uppercase text-rose-200/80">Tier {card.tier}</div>
          <div className="hidden sm:flex items-center text-xs text-rose-200/80">{tierPoints} pts</div>
          <div className="hidden sm:flex items-center text-xs text-rose-200/80">Status unknown</div>
          <div className="hidden sm:flex flex-col text-xs text-rose-200/80">
            <span>{issueDate}</span>
            <span>{issueTime}</span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="tf-card tf-card-grid border border-rose-500/40 bg-rose-500/10"
      >
        <div className="tf-card-media">
          {renderFallbackVisual('grid')}
        </div>
        <div className="tf-card-footer">
          <div className="flex items-center">
            <span className="tf-card-title" style={{ color: '#fecaca' }}>Card #{card.cardId.toString()}</span>
            <span className="tf-card-pts" style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>ERR</span>
          </div>
          <p className="text-xs" style={{ color: '#fecaca' }}>{error || 'Failed to load metadata'}</p>
        </div>
      </motion.article>
    );
  }

  return (
    <div className="group rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 hover:from-blue-500/60 hover:via-purple-500/60 hover:to-pink-500/60 transition-all duration-300 hover:shadow-xl">
      <div className="tf-card rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white/30 group-hover:border-white/50 transition-colors">
        <div className="tf-card-media relative">
        {credential && <CredentialBadge card={card} credential={credential} compact={compact} />}
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide text-white shadow-lg bg-gradient-to-r ${card.tier === 1 ? 'from-green-500 to-green-600' : card.tier === 2 ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'}`}>
            T{card.tier}
          </div>
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
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white">
            <div className="text-4xl font-black">#{card.cardId.toString()}</div>
            <div className="text-xs tracking-wide mt-1">Tier {card.tier}</div>
          </div>
        )}
        </div>
        <div className="tf-card-footer p-4">
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
    </div>
  );
}
