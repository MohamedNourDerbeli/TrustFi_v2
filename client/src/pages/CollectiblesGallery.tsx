/**
 * CollectiblesGalleryPage - Clean, modern collectibles marketplace
 */

import { useState, useMemo } from 'react';
// import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import { CollectibleCard } from '@/components/collectibles/CollectibleCard';
import { CollectibleDetailModal } from '@/components/collectibles/CollectibleDetailModal';
import { useCollectibles } from '@/hooks/useCollectibles';
import { useClaimStatus } from '@/hooks/useClaimStatus';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CollectibleTemplate, CollectibleSortBy, RarityTier } from '@/types/collectible';
import { RarityTier as RarityTierEnum } from '@/types/collectible';
import { Filter, LayoutGrid, Sparkles } from 'lucide-react';
import { useLazyLoadWithObserver } from '@/hooks/useLazyLoad';

type ClaimStatusFilter = 'all' | 'available' | 'claimed' | 'locked';

export default function CollectiblesGallery() {
  const { address } = useWallet();
  // const [location] = useLocation();
  const [selectedCollectible, setSelectedCollectible] = useState<CollectibleTemplate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<RarityTier | null>(null);
  const [claimStatusFilter, setClaimStatusFilter] = useState<ClaimStatusFilter>('all');
  // const highlightedCardRef = useRef<HTMLDivElement>(null);
  
  const {
    filteredCollectibles,
    loading,
    error,
    refetch,
    filterByCategory,
    sortBy,
    currentCategory,
    currentSort,
  } = useCollectibles();

  // Get claim status for all collectibles
  const templateIds = filteredCollectibles.map(c => c.templateId);
  const { claimStatus, loading: loadingEligibility, refreshAll: refreshClaimStatus } = useClaimStatus(templateIds, address);

  // Memoize unique categories to avoid recalculation
  const categories = useMemo(() => {
    return Array.from(
      new Set(filteredCollectibles.map(c => c.category))
    ).filter(Boolean);
  }, [filteredCollectibles]);

  // Memoize filtered collectibles to avoid expensive recalculation
  const displayedCollectibles = useMemo(() => {
    return filteredCollectibles.filter(c => {
      // Apply rarity filter
      if (selectedRarity !== null && c.rarityTier !== selectedRarity) {
        return false;
      }

      // Apply claim status filter (only if user is connected)
      if (address && claimStatusFilter !== 'all') {
        const status = claimStatus.get(c.templateId);
        
        if (claimStatusFilter === 'available') {
          // Available: eligible + not claimed + can claim now
          return status?.isEligible && !status?.hasClaimed && status?.canClaimNow;
        } else if (claimStatusFilter === 'claimed') {
          // Claimed: already claimed by user
          return status?.hasClaimed;
        } else if (claimStatusFilter === 'locked') {
          // Locked: not eligible or cannot claim yet
          return !status?.isEligible || (status?.isEligible && !status?.canClaimNow && !status?.hasClaimed);
        }
      }

      return true;
    });
  }, [filteredCollectibles, selectedRarity, address, claimStatusFilter, claimStatus]);

  // Lazy loading for collectibles
  const {
    visibleItems: visibleCollectibles,
    hasMore: hasMoreCollectibles,
    isLoadingMore: isLoadingMoreCollectibles,
    sentinelRef,
  } = useLazyLoadWithObserver(displayedCollectibles, {
    initialCount: 12,
    pageSize: 12,
  });

  const handleCategoryFilter = (category: string) => {
    filterByCategory(category === 'all' ? null : category);
  };

  const handleRarityFilter = (rarity: string) => {
    setSelectedRarity(rarity === 'all' ? null : parseInt(rarity) as RarityTier);
  };

  const handleSortChange = (sort: string) => {
    sortBy(sort as CollectibleSortBy);
  };

  const clearFilters = () => {
    filterByCategory(null);
    setSelectedRarity(null);
    setClaimStatusFilter('all');
  };

  const hasActiveFilters = currentCategory !== null || selectedRarity !== null || claimStatusFilter !== 'all';

  // Calculate stats
  const totalItems = filteredCollectibles.length;
  const totalClaims = filteredCollectibles.reduce((sum, c) => sum + c.currentSupply, 0);
  const eligibleCount = address ? Array.from(claimStatus.values()).filter(
    status => status?.isEligible && !status?.hasClaimed && status?.canClaimNow
  ).length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Collectibles</h1>
              <p className="text-muted-foreground">
                Discover and claim reputation cards from verified issuers
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          {!loading && totalItems > 0 && (
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="font-bold text-2xl">{totalItems}</span>
                <span className="text-muted-foreground ml-2">items</span>
              </div>
              <div>
                <span className="font-bold text-2xl">{totalClaims}</span>
                <span className="text-muted-foreground ml-2">total claims</span>
              </div>
              {loadingEligibility && address && (
                <div>
                  <Badge variant="outline" className="animate-pulse">
                    Checking eligibility...
                  </Badge>
                </div>
              )}
              {!loadingEligibility && eligibleCount > 0 && (
                <div>
                  <Badge variant="default" className="bg-purple-600">
                    {eligibleCount} eligible for you
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {(currentCategory ? 1 : 0) + (selectedRarity !== null ? 1 : 0) + (claimStatusFilter !== 'all' ? 1 : 0)}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popularity">Popular</SelectItem>
                  <SelectItem value="expiration">Expiring Soon</SelectItem>
                  <SelectItem value="supply">Low Supply</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="mt-4 p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={currentCategory || 'all'}
                    onValueChange={handleCategoryFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Rarity</label>
                  <Select
                    value={selectedRarity !== null ? selectedRarity.toString() : 'all'}
                    onValueChange={handleRarityFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      <SelectItem value={RarityTierEnum.COMMON.toString()}>Common</SelectItem>
                      <SelectItem value={RarityTierEnum.UNCOMMON.toString()}>Uncommon</SelectItem>
                      <SelectItem value={RarityTierEnum.RARE.toString()}>Rare</SelectItem>
                      <SelectItem value={RarityTierEnum.EPIC.toString()}>Epic</SelectItem>
                      <SelectItem value={RarityTierEnum.LEGENDARY.toString()}>Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {address && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Claim Status</label>
                    <Select
                      value={claimStatusFilter}
                      onValueChange={(value) => setClaimStatusFilter(value as ClaimStatusFilter)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="claimed">Claimed</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center">
            <p className="text-destructive mb-2 font-semibold">Failed to load collectibles</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.userMessage || 'An error occurred while fetching collectibles'}
            </p>
            <Button onClick={refetch} variant="outline">
              Try Again
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && displayedCollectibles.length === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Collectibles Found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'No active collectibles at the moment'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </Card>
        )}

        {/* Collectibles Grid with Lazy Loading */}
        {!loading && !error && displayedCollectibles.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleCollectibles.map(collectible => {
                const status = claimStatus.get(collectible.templateId);
                return (
                  <CollectibleCard
                    key={collectible.templateId}
                    template={collectible}
                    claimStatus={status}
                    onClick={() => setSelectedCollectible(collectible)}
                    onClaim={() => setSelectedCollectible(collectible)}
                  />
                );
              })}
            </div>
            
            {/* Lazy loading sentinel */}
            {hasMoreCollectibles && (
              <div ref={sentinelRef} className="flex items-center justify-center py-8">
                {isLoadingMoreCollectibles && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading more collectibles...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Results Count */}
        {!loading && !error && displayedCollectibles.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {visibleCollectibles.length} of {displayedCollectibles.length} collectible{displayedCollectibles.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCollectible && (
        <CollectibleDetailModal
          template={selectedCollectible}
          claimStatus={claimStatus.get(selectedCollectible.templateId)}
          open={!!selectedCollectible}
          onOpenChange={(open) => !open && setSelectedCollectible(null)}
          onClaimSuccess={() => {
            // Refresh claim status and collectibles list after successful claim
            refreshClaimStatus();
            refetch();
          }}
        />
      )}
    </div>
  );
}
