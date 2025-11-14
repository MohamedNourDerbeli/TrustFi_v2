// components/user/DiscoverCollectibles.tsx
import { useTemplates } from '../../hooks/useTemplates';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import type { Template } from '../../types/template';

interface TemplateCardProps {
  template: Template & { hasClaimed?: boolean };
  onClaim: (templateId: bigint) => void;
  isEligible: boolean;
  hasProfile: boolean;
}

function TemplateCard({ template, onClaim, isEligible, hasProfile }: TemplateCardProps) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  // Determine eligibility status
  let eligibilityStatus = '';
  let canClaim = false;

  if (!hasProfile) {
    eligibilityStatus = 'Create profile to claim';
  } else if (template.hasClaimed) {
    eligibilityStatus = 'Already Claimed';
  } else if (template.isPaused) {
    eligibilityStatus = 'Paused';
  } else if (template.startTime > 0n && now < template.startTime) {
    eligibilityStatus = 'Not Started';
  } else if (template.endTime > 0n && now > template.endTime) {
    eligibilityStatus = 'Ended';
  } else if (template.maxSupply > 0n && template.currentSupply >= template.maxSupply) {
    eligibilityStatus = 'Max Supply Reached';
  } else {
    eligibilityStatus = 'Claimable';
    canClaim = true;
  }

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-bronze-500 text-bronze-900';
      case 2:
        return 'bg-silver-500 text-silver-900';
      case 3:
        return 'bg-gold-500 text-gold-900';
      default:
        return 'bg-gray-500 text-gray-900';
    }
  };

  const getTierName = (tier: number) => {
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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(template.tier)}`}>
          {getTierName(template.tier)}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{template.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Issuer:</span>
          <span className="text-gray-900 font-mono text-xs">
            {template.issuer.slice(0, 6)}...{template.issuer.slice(-4)}
          </span>
        </div>
        
        {template.maxSupply > 0n && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Supply:</span>
            <span className="text-gray-900">
              {template.currentSupply.toString()} / {template.maxSupply.toString()}
            </span>
          </div>
        )}
        
        {template.startTime > 0n && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Start:</span>
            <span className="text-gray-900">
              {new Date(Number(template.startTime) * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {template.endTime > 0n && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">End:</span>
            <span className="text-gray-900">
              {new Date(Number(template.endTime) * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          canClaim ? 'text-green-600' : 
          template.hasClaimed ? 'text-blue-600' : 
          'text-gray-500'
        }`}>
          {eligibilityStatus}
        </span>
        
        <button
          onClick={() => onClaim(template.templateId)}
          disabled={!canClaim}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            canClaim
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Claim
        </button>
      </div>
      
      {template.isPaused && (
        <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <span className="text-sm text-yellow-800 font-medium">⚠️ Paused</span>
        </div>
      )}
    </div>
  );
}

export function DiscoverCollectibles() {
  const { hasProfile } = useAuth();
  const { profileId } = useProfile();
  const { templates, loading, error, refreshTemplates } = useTemplates(profileId);

  const handleClaim = (templateId: bigint) => {
    // This will be implemented in ClaimCard component
    // For now, just log
    console.log('Claim template:', templateId);
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
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Templates</h3>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={refreshTemplates}
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

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No collectibles available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.templateId.toString()}
              template={template}
              onClaim={handleClaim}
              isEligible={!template.hasClaimed && !template.isPaused}
              hasProfile={hasProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
