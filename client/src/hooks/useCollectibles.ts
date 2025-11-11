/**
 * Custom hook for fetching and managing collectibles
 * Handles loading active collectibles with filtering and sorting capabilities
 */

import { useState, useMemo, useCallback } from 'react';
import { collectibleContractService } from '@/services/collectibleContractService';
import type { CollectibleTemplate, CollectibleSortBy } from '@/types/collectible';
import { useContractData } from './useContractData';

interface UseCollectiblesOptions {
  enabled?: boolean;
}

export interface UseCollectiblesReturn {
  collectibles: CollectibleTemplate[];
  filteredCollectibles: CollectibleTemplate[];
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
  filterByCategory: (category: string | null) => void;
  filterByEligibility: (eligible: boolean | null) => void;
  sortBy: (field: CollectibleSortBy) => void;
  currentCategory: string | null;
  currentEligibilityFilter: boolean | null;
  currentSort: CollectibleSortBy;
  initialized: boolean;
}

export function useCollectibles(options: UseCollectiblesOptions = {}): UseCollectiblesReturn {
  const { enabled = true } = options;
  
  // Filter and sort state
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [currentEligibilityFilter, setCurrentEligibilityFilter] = useState<boolean | null>(null);
  const [currentSort, setCurrentSort] = useState<CollectibleSortBy>('newest');

  // Fetch collectibles using standardized hook
  const {
    data: collectibles,
    loading,
    error,
    refetch,
    initialized
  } = useContractData<CollectibleTemplate[]>(
    () => collectibleContractService.getActiveCollectibles(),
    [],
    {
      enabled,
      initialData: [],
      cacheTime: 60000, // Cache for 1 minute
      staleTime: 30000, // Consider stale after 30 seconds
    }
  );

  // Filter by category
  const filterByCategory = useCallback((category: string | null) => {
    setCurrentCategory(category);
  }, []);

  // Filter by eligibility (placeholder - actual eligibility check requires user address)
  const filterByEligibility = useCallback((eligible: boolean | null) => {
    setCurrentEligibilityFilter(eligible);
  }, []);

  // Sort collectibles
  const sortByField = useCallback((field: CollectibleSortBy) => {
    setCurrentSort(field);
  }, []);

  // Apply filters and sorting
  const filteredCollectibles = useMemo(() => {
    if (!collectibles) return [];
    
    let result = [...collectibles];

    // Filter by category
    if (currentCategory) {
      result = result.filter(c => c.category === currentCategory);
    }

    // Note: Eligibility filtering requires checking each collectible against user address
    // This is handled separately in components that have access to user address
    // For now, we just pass through the filter state

    // Sort collectibles
    switch (currentSort) {
      case 'newest':
        result.sort((a, b) => b.templateId - a.templateId);
        break;
      
      case 'oldest':
        result.sort((a, b) => a.templateId - b.templateId);
        break;
      
      case 'popularity':
        result.sort((a, b) => b.currentSupply - a.currentSupply);
        break;
      
      case 'expiration':
        result.sort((a, b) => {
          // Sort by end time (soonest first)
          // 0 means no expiration, so put those at the end
          if (a.endTime === 0) return 1;
          if (b.endTime === 0) return -1;
          return a.endTime - b.endTime;
        });
        break;
      
      case 'supply':
        result.sort((a, b) => {
          // Sort by remaining supply (lowest first)
          const aRemaining = a.maxSupply === 0 ? Infinity : a.maxSupply - a.currentSupply;
          const bRemaining = b.maxSupply === 0 ? Infinity : b.maxSupply - b.currentSupply;
          
          if (aRemaining === Infinity) return 1;
          if (bRemaining === Infinity) return -1;
          return aRemaining - bRemaining;
        });
        break;
      
      case 'rarity':
        result.sort((a, b) => b.rarityTier - a.rarityTier);
        break;
      
      default:
        break;
    }

    return result;
  }, [collectibles, currentCategory, currentSort]);

  return {
    collectibles: collectibles || [],
    filteredCollectibles,
    loading,
    error,
    refetch,
    filterByCategory,
    filterByEligibility,
    sortBy: sortByField,
    currentCategory,
    currentEligibilityFilter,
    currentSort,
    initialized,
  };
}
