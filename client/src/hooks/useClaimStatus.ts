/**
 * Custom hook for checking claim eligibility status for collectibles
 * Manages eligibility checks for multiple templates with caching and parallel fetching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collectibleContractService } from '@/services/collectibleContractService';
import type { ClaimStatus } from '@/types/collectible';
import { useWallet } from '@/contexts/WalletContext';

export interface UseClaimStatusReturn {
  claimStatus: Map<number, ClaimStatus>;
  loading: boolean;
  error: Error | null;
  checkEligibility: (templateId: number) => Promise<ClaimStatus | null>;
  refreshStatus: (templateId: number) => Promise<void>;
  refreshAll: () => Promise<void>;
}

// Cache for eligibility results (5 minute TTL)
const eligibilityCache = new Map<string, { status: ClaimStatus; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(templateId: number, address: string): string {
  return `${templateId}-${address.toLowerCase()}`;
}

function getCachedStatus(templateId: number, address: string): ClaimStatus | null {
  const key = getCacheKey(templateId, address);
  const cached = eligibilityCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.status;
  }
  
  // Remove stale cache entry
  if (cached) {
    eligibilityCache.delete(key);
  }
  
  return null;
}

function setCachedStatus(templateId: number, address: string, status: ClaimStatus): void {
  const key = getCacheKey(templateId, address);
  eligibilityCache.set(key, { status, timestamp: Date.now() });
}

export function useClaimStatus(
  templateIds: number[],
  userAddress?: string
): UseClaimStatusReturn {
  const { provider, address: walletAddress } = useWallet();
  const effectiveAddress = userAddress || walletAddress;
  
  const [claimStatus, setClaimStatus] = useState<Map<number, ClaimStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  // Check eligibility for a single template with caching
  const checkEligibility = useCallback(async (templateId: number): Promise<ClaimStatus | null> => {
    if (!effectiveAddress) {
      console.warn('No user address available for eligibility check');
      return null;
    }

    // Check cache first
    const cached = getCachedStatus(templateId, effectiveAddress);
    if (cached) {
      // Update state with cached value
      if (isMountedRef.current) {
        setClaimStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(templateId, cached);
          return newMap;
        });
      }
      return cached;
    }

    try {
      // Initialize service if needed
      if (provider && !collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      const status = await collectibleContractService.checkEligibility(
        templateId,
        effectiveAddress
      );

      // Cache the result
      setCachedStatus(templateId, effectiveAddress, status);

      // Update the map with new status
      if (isMountedRef.current) {
        setClaimStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(templateId, status);
          return newMap;
        });
      }

      return status;
    } catch (err: any) {
      console.error(`Failed to check eligibility for template ${templateId}:`, err);
      return null;
    }
  }, [effectiveAddress, provider]);

  // Refresh status for a specific template
  const refreshStatus = useCallback(async (templateId: number) => {
    await checkEligibility(templateId);
  }, [checkEligibility]);

  // Refresh all statuses with parallel fetching and caching
  const refreshAll = useCallback(async () => {
    if (!effectiveAddress || templateIds.length === 0) {
      if (isMountedRef.current) {
        setClaimStatus(new Map());
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize service if needed
      if (provider && !collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Check cache first for all templates
      const newStatusMap = new Map<number, ClaimStatus>();
      const templatesToFetch: number[] = [];

      templateIds.forEach(templateId => {
        const cached = getCachedStatus(templateId, effectiveAddress);
        if (cached) {
          newStatusMap.set(templateId, cached);
        } else {
          templatesToFetch.push(templateId);
        }
      });

      // Fetch eligibility for uncached templates in parallel
      if (templatesToFetch.length > 0) {
        const statusPromises = templatesToFetch.map(templateId =>
          collectibleContractService.checkEligibility(templateId, effectiveAddress)
            .then(status => {
              // Cache the result
              setCachedStatus(templateId, effectiveAddress, status);
              return { templateId, status };
            })
            .catch(err => {
              console.error(`Failed to check eligibility for template ${templateId}:`, err);
              return null;
            })
        );

        const results = await Promise.all(statusPromises);

        // Add fetched results to status map
        results.forEach(result => {
          if (result) {
            newStatusMap.set(result.templateId, result.status);
          }
        });
      }

      if (isMountedRef.current) {
        setClaimStatus(newStatusMap);
      }
    } catch (err: any) {
      console.error('Failed to refresh claim statuses:', err);
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [templateIds, effectiveAddress, provider]);

  // Auto-fetch statuses when templateIds or address changes
  useEffect(() => {
    if (effectiveAddress && templateIds.length > 0) {
      refreshAll();
    }
  }, [templateIds.join(','), effectiveAddress]); // Use join to avoid infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    claimStatus,
    loading,
    error,
    checkEligibility,
    refreshStatus,
    refreshAll,
  };
}
