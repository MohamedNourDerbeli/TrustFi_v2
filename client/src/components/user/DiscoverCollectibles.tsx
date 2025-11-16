// components/user/DiscoverCollectibles.tsx
import { useState } from 'react';
import { useCollectibles } from '../../hooks/useCollectibles';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { useReputationCards } from '../../hooks/useReputationCards';
import { supabase } from '../../lib/supabase';
import { showCardClaimedNotification, showErrorNotification } from '../../lib/notifications';
import { parseContractError } from '../../lib/errors';
import type { Collectible } from '../../types/collectible';
import type { Address, Hex } from 'viem';

interface CollectibleCardProps {
  collectible: Collectible & { isClaimable?: boolean };
  onClaim: (templateId: bigint) => Promise<void>;
  hasProfile: boolean;
  isClaiming: boolean;
}

function CollectibleCard({ collectible, onClaim, hasProfile, isClaiming }: CollectibleCardProps) {
  // Check if this is the Kusama Living Profile (template 999)
  const isKusamaLivingProfile = collectible.templateId === 999n;
  
  // Determine eligibility status
  let eligibilityStatus = '';
  let canClaim = false;

  if (!hasProfile) {
    eligibilityStatus = 'Create profile to claim';
  } else if (collectible.hasClaimed) {
    eligibilityStatus = 'Already Claimed';
  } else if (collectible.isClaimable) {
    eligibilityStatus = 'Claimable';
    canClaim = true;
  } else if (collectible.maxSupply && collectible.currentSupply && collectible.currentSupply >= collectible.maxSupply) {
    eligibilityStatus = 'Max Supply Reached';
  } else {
    eligibilityStatus = 'Not Available';
  }

  const getTierColor = (tier?: number) => {
    switch (tier) {
      case 1:
        return 'bg-amber-600 text-white';
      case 2:
        return 'bg-gray-400 text-gray-900';
      case 3:
        return 'bg-yellow-500 text-yellow-900';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTierName = (tier?: number) => {
    switch (tier) {
      case 1:
        return 'Bronze';
      case 2:
        return 'Silver';
      case 3:
        return 'Gold';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
      {/* Banner Image */}
      {collectible.bannerUrl && (
        <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <img 
            src={collectible.bannerUrl} 
            alt={collectible.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Card Image */}
      <div className="flex justify-center -mt-12 px-6">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
          <img 
            src={collectible.imageUrl} 
            alt={collectible.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="p-6 pt-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{collectible.title}</h3>
            {isKusamaLivingProfile && (
              <div className="flex items-center gap-1 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Dynamic NFT
                </span>
              </div>
            )}
          </div>
          {collectible.tier && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTierColor(collectible.tier)}`}>
              {getTierName(collectible.tier)}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-4 text-sm line-clamp-3">{collectible.description}</p>
        
        {isKusamaLivingProfile && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-md border border-purple-200">
            <p className="text-xs font-semibold text-purple-900 mb-1">✨ Living Profile</p>
            <p className="text-xs text-purple-800">
              This NFT updates automatically to reflect your current reputation score in real-time.
            </p>
          </div>
        )}
        
        {/* Requirements */}
        {collectible.requirements && Object.keys(collectible.requirements).length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs font-semibold text-blue-900 mb-1">Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              {Object.entries(collectible.requirements).map(([key, value]) => (
                <li key={key}>• {key}: {String(value)}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Supply Info */}
        {collectible.maxSupply && collectible.maxSupply > 0n && (
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-500">Supply:</span>
            <span className="text-gray-900 font-medium">
              {collectible.currentSupply?.toString() || '0'} / {collectible.maxSupply.toString()}
            </span>
          </div>
        )}
        
        {/* Claim Type Badge */}
        <div className="mb-4">
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            collectible.claimType === 'signature' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {collectible.claimType === 'signature' ? '🔗 Claim Link' : '⚡ Direct Issue'}
          </span>
        </div>
        
        {/* Action Button */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            canClaim ? 'text-green-600' : 
            collectible.hasClaimed ? 'text-blue-600' : 
            'text-gray-500'
          }`}>
            {eligibilityStatus}
          </span>
          
          <button
            onClick={() => onClaim(collectible.templateId)}
            disabled={!canClaim || isClaiming}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              canClaim && !isClaiming
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Claiming...
              </span>
            ) : collectible.hasClaimed ? (
              'Claimed'
            ) : (
              'Claim'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DiscoverCollectibles() {
  const { hasProfile, address } = useAuth();
  const { profileId } = useProfile();
  const { collectibles, loading, error, refreshCollectibles } = useCollectibles(profileId);
  const { claimWithSignature, isProcessing } = useReputationCards();
  const [claimingTemplateId, setClaimingTemplateId] = useState<bigint | null>(null);

  const handleClaim = async (templateId: bigint) => {
    if (!address || !profileId || !hasProfile) {
      showErrorNotification('Profile Required', 'You need to create a profile before claiming collectibles.');
      return;
    }

    setClaimingTemplateId(templateId);

    try {
      // Find the collectible to get its data
      const collectible = collectibles.find(c => c.templateId === templateId);
      if (!collectible) {
        throw new Error('Collectible not found');
      }

      // Check if this is template 999 (Kusama Living Profile)
      const isKusamaLivingProfile = templateId === 999n;
      let tokenURI: string;

      if (isKusamaLivingProfile) {
        // For template 999, construct dynamic metadata URI using token_uri field as prefix
        // The token_uri field should contain the Edge Function URL prefix
        tokenURI = `${collectible.tokenUri}${profileId.toString()}`;
        console.log('[DiscoverCollectibles] Using dynamic URI for template 999:', tokenURI);
      } else {
        // For other templates, use the static token URI (or upload to IPFS if needed)
        tokenURI = collectible.tokenUri;
        console.log('[DiscoverCollectibles] Using static URI:', tokenURI);
      }

      // Request signature from backend
      const { data: signatureData, error: signatureError } = await supabase.functions.invoke('generate-signature', {
        body: {
          user: address,
          profileOwner: address,
          templateId: templateId.toString(),
          tokenURI,
        },
      });

      if (signatureError || !signatureData) {
        throw new Error(signatureError?.message || 'Failed to generate signature');
      }

      const { nonce, signature } = signatureData;

      // Claim the collectible with signature
      const result = await claimWithSignature({
        user: address,
        profileOwner: address,
        templateId,
        nonce: BigInt(nonce),
        tokenURI,
        signature: signature as Hex,
      });

      // Show success notification
      showCardClaimedNotification(result.cardId, result.txHash);

      // Refresh collectibles list
      await refreshCollectibles();
    } catch (err) {
      console.error('[DiscoverCollectibles] Error claiming collectible:', err);
      const parsed = parseContractError(err);
      showErrorNotification('Claim Failed', parsed.message);
    } finally {
      setClaimingTemplateId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Collectibles</h3>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={refreshCollectibles}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Collectibles</h1>
        <p className="text-gray-600">
          Browse and claim reputation cards to build your profile
        </p>
      </div>

      {!hasProfile && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <span className="font-semibold">Note:</span> You need to create a profile before you can claim collectibles.
          </p>
        </div>
      )}

      {collectibles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-gray-500 text-lg mb-2">No collectibles available yet</p>
          <p className="text-gray-400 text-sm">Check back soon for new reputation cards!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectibles.map((collectible) => (
            <CollectibleCard
              key={collectible.id}
              collectible={collectible}
              onClaim={handleClaim}
              hasProfile={hasProfile}
              isClaiming={claimingTemplateId === collectible.templateId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
