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
import { Sparkles, Award, Zap, Users, CheckCircle, Lock, AlertCircle, Filter, Grid, List, Search } from 'lucide-react';

interface CollectibleCardProps {
  collectible: Collectible & { isClaimable?: boolean };
  onClaim: (templateId: bigint) => Promise<void>;
  hasProfile: boolean;
  isClaiming: boolean;
  viewMode: 'grid' | 'list';
}

function CollectibleCard({ collectible, onClaim, hasProfile, isClaiming, viewMode }: CollectibleCardProps) {
  const isKusamaLivingProfile = collectible.templateId === 999n;
  
  let eligibilityStatus = '';
  let canClaim = false;
  let statusIcon = null;

  if (!hasProfile) {
    eligibilityStatus = 'Create profile to claim';
    statusIcon = <Lock className="w-4 h-4" />;
  } else if (collectible.hasClaimed) {
    eligibilityStatus = 'Already Claimed';
    statusIcon = <CheckCircle className="w-4 h-4" />;
  } else if (collectible.isClaimable) {
    eligibilityStatus = 'Ready to Claim';
    statusIcon = <Sparkles className="w-4 h-4" />;
    canClaim = true;
  } else if (collectible.maxSupply && collectible.currentSupply && collectible.currentSupply >= collectible.maxSupply) {
    eligibilityStatus = 'Sold Out';
    statusIcon = <AlertCircle className="w-4 h-4" />;
  } else {
    eligibilityStatus = 'Not Available';
    statusIcon = <Lock className="w-4 h-4" />;
  }

  const getTierGradient = (tier?: number) => {
    switch (tier) {
      case 1:
        return 'from-green-400 via-green-500 to-green-600';
      case 2:
        return 'from-blue-400 via-blue-500 to-blue-600';
      case 3:
        return 'from-purple-400 via-purple-500 to-purple-600';
      default:
        return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getTierName = (tier?: number) => {
    switch (tier) {
      case 1: return 'Bronze';
      case 2: return 'Silver';
      case 3: return 'Gold';
      default: return 'Standard';
    }
  };

  const supplyPercentage = collectible.maxSupply && collectible.maxSupply > 0n
    ? (Number(collectible.currentSupply || 0n) / Number(collectible.maxSupply)) * 100
    : 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative sm:w-48 h-48 sm:h-auto flex-shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${getTierGradient(collectible.tier)} opacity-20`}></div>
            <img 
              src={collectible.imageUrl} 
              alt={collectible.title}
              className="w-full h-full object-cover"
            />
            {collectible.tier && (
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTierGradient(collectible.tier)} text-white shadow-lg`}>
                {getTierName(collectible.tier)}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{collectible.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{collectible.description}</p>
                
                {isKusamaLivingProfile && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 mb-3">
                    <Zap className="w-3 h-3" />
                    Dynamic NFT - Updates in Real-Time
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-4">
              {collectible.maxSupply && collectible.maxSupply > 0n && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {collectible.currentSupply?.toString() || '0'} / {collectible.maxSupply.toString()} claimed
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {collectible.claimType === 'signature' ? (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Claim Link</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Direct Issue</span>
                  </>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onClaim(collectible.templateId)}
                disabled={!canClaim || isClaiming}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  canClaim && !isClaiming
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isClaiming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Claiming...
                  </>
                ) : collectible.hasClaimed ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Claimed
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Claim Now
                  </>
                )}
              </button>

              <div className={`flex items-center gap-1.5 text-sm font-medium ${
                canClaim ? 'text-green-600' : 
                collectible.hasClaimed ? 'text-blue-600' : 
                'text-gray-500'
              }`}>
                {statusIcon}
                {eligibilityStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
      {/* Banner with Gradient Overlay */}
      <div className="relative h-40 overflow-hidden">
        {collectible.bannerUrl ? (
          <img 
            src={collectible.bannerUrl} 
            alt={collectible.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getTierGradient(collectible.tier)}`}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        {/* Tier Badge */}
        {collectible.tier && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTierGradient(collectible.tier)} text-white shadow-lg`}>
            {getTierName(collectible.tier)}
          </div>
        )}
      </div>
      
      {/* Avatar */}
      <div className="flex justify-center -mt-12 px-6 relative z-10">
        <div className="relative group/avatar">
          <div className={`absolute -inset-1 bg-gradient-to-r ${getTierGradient(collectible.tier)} rounded-full blur opacity-75 group-hover/avatar:opacity-100 transition duration-300`}></div>
          <div className="relative w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
            <img 
              src={collectible.imageUrl} 
              alt={collectible.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      <div className="p-6 pt-4">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{collectible.title}</h3>
        
        {/* Dynamic NFT Badge */}
        {isKusamaLivingProfile && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
              <Zap className="w-3 h-3" />
              Dynamic NFT
            </span>
          </div>
        )}
        
        {/* Description */}
        <p className="text-gray-600 mb-4 text-sm text-center line-clamp-3">{collectible.description}</p>
        
        {/* Living Profile Info */}
        {isKusamaLivingProfile && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-purple-900 mb-1">Living Profile Feature</p>
                <p className="text-xs text-purple-800">
                  Updates automatically to reflect your reputation score in real-time
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Requirements */}
        {collectible.requirements && Object.keys(collectible.requirements).length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Requirements
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              {Object.entries(collectible.requirements).map(([key, value]) => (
                <li key={key} className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {key}: {String(value)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Supply Progress */}
        {collectible.maxSupply && collectible.maxSupply > 0n && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600 font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                Supply
              </span>
              <span className="text-gray-900 font-bold">
                {collectible.currentSupply?.toString() || '0'} / {collectible.maxSupply.toString()}
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getTierGradient(collectible.tier)} rounded-full transition-all duration-500`}
                style={{ width: `${supplyPercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Claim Type Badge */}
        <div className="mb-4 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            collectible.claimType === 'signature' 
              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {collectible.claimType === 'signature' ? (
              <>
                <Sparkles className="w-3 h-3" />
                Claim Link
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                Direct Issue
              </>
            )}
          </span>
        </div>
        
        {/* Status */}
        <div className="mb-3 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
            canClaim ? 'text-green-600' : 
            collectible.hasClaimed ? 'text-blue-600' : 
            'text-gray-500'
          }`}>
            {statusIcon}
            {eligibilityStatus}
          </span>
        </div>
        
        {/* Claim Button */}
        <button
          onClick={() => onClaim(collectible.templateId)}
          disabled={!canClaim || isClaiming}
          className={`w-full px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            canClaim && !isClaiming
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isClaiming ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Claiming...
            </>
          ) : collectible.hasClaimed ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Claimed
            </>
          ) : (
            <>
              <Award className="w-5 h-5" />
              Claim Now
            </>
          )}
        </button>
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTier, setFilterTier] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleClaim = async (templateId: bigint) => {
    if (!address || !profileId || !hasProfile) {
      showErrorNotification('Profile Required', 'You need to create a profile before claiming collectibles.');
      return;
    }

    setClaimingTemplateId(templateId);

    try {
      const collectible = collectibles.find(c => c.templateId === templateId);
      if (!collectible) {
        throw new Error('Collectible not found');
      }

      const isKusamaLivingProfile = templateId === 999n;
      let tokenURI: string;

      if (isKusamaLivingProfile) {
        tokenURI = `${collectible.tokenUri}${profileId.toString()}`;
        console.log('[DiscoverCollectibles] Using dynamic URI for template 999:', tokenURI);
      } else {
        tokenURI = collectible.tokenUri;
        console.log('[DiscoverCollectibles] Using static URI:', tokenURI);
      }

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

      const result = await claimWithSignature({
        user: address,
        profileOwner: address,
        templateId,
        nonce: BigInt(nonce),
        tokenURI,
        signature: signature as Hex,
      });

      showCardClaimedNotification(result.cardId, result.txHash);
      await refreshCollectibles();
    } catch (err) {
      console.error('[DiscoverCollectibles] Error claiming collectible:', err);
      const parsed = parseContractError(err);
      showErrorNotification('Claim Failed', parsed.message);
    } finally {
      setClaimingTemplateId(null);
    }
  };

  const filteredCollectibles = collectibles
    .filter(c => {
      if (filterTier !== 'all' && c.tier !== filterTier) return false;
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading collectibles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Collectibles</h3>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <button
              onClick={refreshCollectibles}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Discover Collectibles
          </h1>
          <p className="text-gray-600 text-lg">
            Browse and claim reputation cards to build your on-chain credentials
          </p>
        </div>

        {/* Profile Required Notice */}
        {!hasProfile && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-1">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Profile Required</h3>
                  <p className="text-gray-600 text-sm">
                    Create your profile to start claiming collectibles and building your reputation
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search collectibles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all ${
                  showFilters
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top">
              <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Tier</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterTier('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterTier === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  All Tiers
                </button>
                {[1, 2, 3].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFilterTier(tier)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterTier === tier
                        ? tier === 1
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                          : tier === 2
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Tier {tier}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {filteredCollectibles.length}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {filteredCollectibles.filter(c => c.isClaimable && !c.hasClaimed).length}
                </p>
                <p className="text-sm text-gray-600">Claimable</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {filteredCollectibles.filter(c => c.hasClaimed).length}
                </p>
                <p className="text-sm text-gray-600">Claimed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collectibles Grid/List */}
        {filteredCollectibles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery || filterTier !== 'all' ? 'No matching collectibles' : 'No collectibles available yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterTier !== 'all' 
                ? 'Try adjusting your filters or search query' 
                : 'Check back soon for new reputation cards!'}
            </p>
            {(searchQuery || filterTier !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTier('all');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          }>
            {filteredCollectibles.map((collectible) => (
              <CollectibleCard
                key={collectible.id}
                collectible={collectible}
                onClaim={handleClaim}
                hasProfile={hasProfile}
                isClaiming={claimingTemplateId === collectible.templateId}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Feature Highlights */}
        {filteredCollectibles.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-1">
            <div className="bg-white rounded-xl p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
                Why Collect Reputation Cards?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Build Reputation</h3>
                  <p className="text-sm text-gray-600">
                    Earn points and showcase your achievements on-chain
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Dynamic Updates</h3>
                  <p className="text-sm text-gray-600">
                    Some cards update automatically to reflect your current status
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Exclusive Access</h3>
                  <p className="text-sm text-gray-600">
                    Unlock special features and rewards as you collect more cards
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}