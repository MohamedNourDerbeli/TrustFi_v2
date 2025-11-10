/**
 * Custom hook for checking claim eligibility status for collectibles
 * Manages eligibility checks for multiple templates and provides refresh functionality
 */

import { useState, useEffect, useCallback } from 'react';
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

export function useClaimStatus(
  templateIds: number[],
  userAddress?: string
): UseClaimStatusReturn {
  const { provider, address: walletAddress } = useWallet();
  const effectiveAddress = userAddress || walletAddress;
  
  const [claimStatus, setClaimStatus] = useState<Map<number, ClaimStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check eligibility for a single template
  const checkEligibility = useCallback(async (templateId: number): Promise<ClaimStatus | null> => {
    if (!effectiveAddress) {
      console.warn('No user address available for eligibility check');
      return null;
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

      // Update the map with new status
      setClaimStatus(prev => {
        const newMap = new Map(prev);
        newMap.set(templateId, status);
        return newMap;
      });

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

  // Refresh all statuses
  const refreshAll = useCallback(async () => {
    if (!effectiveAddress || templateIds.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize service if needed
      if (provider && !collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Check eligibility for all templates in parallel
      const statusPromises = templateIds.map(templateId =>
        collectibleContractService.checkEligibility(templateId, effectiveAddress)
          .then(status => ({ templateId, status }))
          .catch(err => {
            console.error(`Failed to check eligibility for template ${templateId}:`, err);
            return null;
          })
      );

      const results = await Promise.all(statusPromises);

      // Build new status map
      const newStatusMap = new Map<number, ClaimStatus>();
      results.forEach(result => {
        if (result) {
          newStatusMap.set(result.templateId, result.status);
        }
      });

      setClaimStatus(newStatusMap);
    } catch (err: any) {
      console.error('Failed to refresh claim statuses:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [templateIds, effectiveAddress, provider]);

  // Auto-fetch statuses when templateIds or address changes
  useEffect(() => {
    if (effectiveAddress && templateIds.length > 0) {
      refreshAll();
    }
  }, [templateIds.join(','), effectiveAddress]); // Use join to avoid infinite loops

  return {
    claimStatus,
    loading,
    error,
    checkEligibility,
    refreshStatus,
    refreshAll,
  };
}
