/**
 * Custom hook for claiming collectibles
 * Handles gas estimation, transaction submission, and state management
 */

import { useState, useCallback } from 'react';
import { collectibleContractService } from '@/services/collectibleContractService';
import type { GasEstimate, ClaimCollectibleResult } from '@/types/collectible';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';

type ClaimingState = 'idle' | 'estimating' | 'claiming' | 'success' | 'error';

export interface UseCollectibleClaimReturn {
  claim: (templateId: number) => Promise<ClaimCollectibleResult | null>;
  claimingState: ClaimingState;
  error: Error | null;
  txHash: string | null;
  cardId: number | null;
  gasEstimate: GasEstimate | null;
  estimateGas: (templateId: number) => Promise<GasEstimate | null>;
  reset: () => void;
}

export function useCollectibleClaim(): UseCollectibleClaimReturn {
  const { provider, address } = useWallet();
  const { toast } = useToast();
  
  const [claimingState, setClaimingState] = useState<ClaimingState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [cardId, setCardId] = useState<number | null>(null);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);

  // Estimate gas for claiming
  const estimateGas = useCallback(async (templateId: number): Promise<GasEstimate | null> => {
    if (!address) {
      console.warn('No wallet address available for gas estimation');
      return null;
    }

    setClaimingState('estimating');
    setError(null);

    try {
      // Initialize service if needed
      if (provider && !collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      const estimate = await collectibleContractService.estimateClaimGas(
        templateId,
        address
      );

      setGasEstimate(estimate);
      setClaimingState('idle');
      return estimate;
    } catch (err: any) {
      console.error('Failed to estimate gas:', err);
      setError(err);
      setClaimingState('error');
      return null;
    }
  }, [address, provider]);

  // Claim a collectible
  const claim = useCallback(async (templateId: number): Promise<ClaimCollectibleResult | null> => {
    if (!provider) {
      const err = new Error('Wallet not connected');
      setError(err);
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to claim collectibles',
        variant: 'destructive',
      });
      return null;
    }

    if (!address) {
      const err = new Error('No wallet address available');
      setError(err);
      return null;
    }

    setClaimingState('claiming');
    setError(null);
    setTxHash(null);
    setCardId(null);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Claim the collectible
      const result = await collectibleContractService.claimCollectible(
        templateId,
        signer
      );

      setTxHash(result.txHash);
      setCardId(result.cardId);
      setClaimingState('success');

      toast({
        title: 'Collectible Claimed!',
        description: `Successfully claimed collectible. Card ID: ${result.cardId}`,
      });

      return result;
    } catch (err: any) {
      console.error('Failed to claim collectible:', err);
      setError(err);
      setClaimingState('error');

      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to claim collectible';
      toast({
        title: 'Claim Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    }
  }, [provider, address, toast]);

  // Reset state
  const reset = useCallback(() => {
    setClaimingState('idle');
    setError(null);
    setTxHash(null);
    setCardId(null);
    setGasEstimate(null);
  }, []);

  return {
    claim,
    claimingState,
    error,
    txHash,
    cardId,
    gasEstimate,
    estimateGas,
    reset,
  };
}
