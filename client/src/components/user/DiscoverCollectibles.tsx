// components/user/DiscoverCollectibles.tsx
import { useCollectibles } from '../../hooks/useCollectibles';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import type { Collectible } from '../../types/collectible';

interface CollectibleCardProps {
  collectible: Collectible & { isClaimable?: boolean };
  onClaim: (templateId: bigint) => void;
  hasProfile: boolean;
}

function CollectibleCard({ collectible, onClaim, hasProfile }: CollectibleCardProps) {
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
          <h3 className="text-xl font-semibold text-gray-900">{collectible.title}</h3>
          {collectible.tier && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTierColor(collectible.tier)}`}>
              {getTierName(collectible.tier)}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-4 text-sm line-clamp-3">{collectible.description}</p>
        
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
            disabled={!canClaim}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              canClaim
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {collectible.hasClaimed ? 'Claimed' : 'Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DiscoverCollectibles() {
  const { hasProfile } = useAuth();
  const { profileId } = useProfile();
  const { collectibles, loading, error, refreshCollectibles } = useCollectibles(profileId);

  const handleClaim = (templateId: bigint) => {
    // This will be implemented in ClaimCard component
    // For now, just log
    console.log('Claim collectible with template:', templateId);
    // TODO: Navigate to claim page or open claim modal
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
