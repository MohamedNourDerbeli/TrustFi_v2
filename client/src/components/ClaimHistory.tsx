/**
 * ClaimHistory Component
 * Displays a chronological list of user's collectible claims
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, ExternalLink, Calendar, Award, Filter, Loader2 } from 'lucide-react';
import { claimHistoryService, type ClaimHistoryEntry, type ClaimHistoryFilters } from '@/services/claimHistoryService';
import { RarityTier } from '@/types/collectible';
import { useWallet } from '@/contexts/WalletContext';

interface ClaimHistoryProps {
  userAddress?: string;
  limit?: number;
  showFilters?: boolean;
  showTitle?: boolean;
}

const RARITY_NAMES: Record<number, string> = {
  [RarityTier.COMMON]: 'Common',
  [RarityTier.UNCOMMON]: 'Uncommon',
  [RarityTier.RARE]: 'Rare',
  [RarityTier.EPIC]: 'Epic',
  [RarityTier.LEGENDARY]: 'Legendary',
};

const RARITY_COLORS: Record<number, string> = {
  [RarityTier.COMMON]: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
  [RarityTier.UNCOMMON]: 'bg-green-500/20 text-green-700 dark:text-green-400',
  [RarityTier.RARE]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  [RarityTier.EPIC]: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  [RarityTier.LEGENDARY]: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
};

export default function ClaimHistory({
  userAddress,
  limit,
  showFilters = true,
  showTitle = true,
}: ClaimHistoryProps) {
  const { address: walletAddress } = useWallet();
  const effectiveAddress = userAddress || walletAddress;

  const [claims, setClaims] = useState<ClaimHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadClaims();
  }, [effectiveAddress, categoryFilter, rarityFilter, sortBy, limit]);

  const loadClaims = async () => {
    if (!effectiveAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Initialize service if needed
      await claimHistoryService.initialize();

      // Build filters
      const filters: ClaimHistoryFilters = {};
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (rarityFilter !== 'all') {
        filters.rarityTier = parseInt(rarityFilter);
      }

      // Fetch claims
      let fetchedClaims = await claimHistoryService.getUserClaims(
        effectiveAddress,
        filters,
        limit
      );

      // Apply sorting
      if (sortBy === 'oldest') {
        fetchedClaims = [...fetchedClaims].reverse();
      }

      setClaims(fetchedClaims);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          fetchedClaims
            .map((c) => c.collectibleData?.category)
            .filter((c): c is string => !!c)
        )
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load claim history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExplorerUrl = (txHash: string): string => {
    // This should be dynamic based on chain ID, but for now using a default
    return `https://etherscan.io/tx/${txHash}`;
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Claim History</CardTitle>
            <CardDescription>Your collectible claims over time</CardDescription>
          </CardHeader>
        )}
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading claim history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Claim History</CardTitle>
              <CardDescription>
                {claims.length} claim{claims.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            {showFilters && (
              <Button variant="outline" size="sm" onClick={loadClaims}>
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value={RarityTier.COMMON.toString()}>Common</SelectItem>
                <SelectItem value={RarityTier.UNCOMMON.toString()}>Uncommon</SelectItem>
                <SelectItem value={RarityTier.RARE.toString()}>Rare</SelectItem>
                <SelectItem value={RarityTier.EPIC.toString()}>Epic</SelectItem>
                <SelectItem value={RarityTier.LEGENDARY.toString()}>Legendary</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'oldest')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Claims List */}
        {claims.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No claims yet</h3>
            <p className="text-muted-foreground mb-4">
              {categoryFilter !== 'all' || rarityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start claiming collectibles to see your history here'}
            </p>
            {(categoryFilter !== 'all' || rarityFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter('all');
                  setRarityFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Icon */}
                <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title and Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {claim.collectibleData?.description || `Collectible #${claim.templateId}`}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {claim.collectibleData?.category && (
                          <Badge variant="outline" className="text-xs">
                            {claim.collectibleData.category}
                          </Badge>
                        )}
                        {claim.collectibleData?.rarityTier !== undefined && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              RARITY_COLORS[claim.collectibleData.rarityTier]
                            }`}
                          >
                            <Award className="w-3 h-3 mr-1" />
                            {RARITY_NAMES[claim.collectibleData.rarityTier]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(claim.timestamp)}</span>
                    </div>
                    <span>{formatTime(claim.timestamp)}</span>
                  </div>

                  {/* Transaction Hash */}
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                      {claim.txHash}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => window.open(getExplorerUrl(claim.txHash), '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
