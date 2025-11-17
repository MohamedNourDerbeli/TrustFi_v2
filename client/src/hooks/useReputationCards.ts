// hooks/useReputationCards.ts
import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, type Hex } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS, PROFILE_NFT_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import ProfileNFTABI from '../lib/ProfileNFT.abi.json';
import { parseContractError, isUserRejection } from '../lib/errors';
import { executeTransactionFlow } from '../lib/transactionHelpers';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { RETRY } from '../lib/constants';

export interface IssueDirectParams {
  recipient: Address;
  templateId: bigint;
  tokenURI: string;
}

export interface ClaimWithSignatureParams {
  user: Address;
  profileOwner: Address;
  templateId: bigint;
  nonce: bigint;
  tokenURI: string;
  signature: Hex;
}

export interface CardIssuanceResult {
  cardId: bigint;
  txHash: Hex;
}

export interface UseReputationCardsReturn {
  issueDirect: (params: IssueDirectParams) => Promise<CardIssuanceResult>;
  claimWithSignature: (params: ClaimWithSignatureParams) => Promise<CardIssuanceResult>;
  isProcessing: boolean;
  error: Error | null;
  retryCount: number;
  clearError: () => void;
}

export function useReputationCards(): UseReputationCardsReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Helper function to log claim to Supabase
  const logClaim = useCallback(async (
    recipientAddress: Address,
    templateId: bigint,
    cardId: bigint,
    claimType: 'direct' | 'signature'
  ) => {
    try {
      if (!publicClient) return;

      // Get profile ID for recipient
      // @ts-ignore - wagmi v2 type issue with readContract
      const profileId = await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as Address,
        abi: ProfileNFTABI,
        functionName: 'addressToProfileId',
        args: [recipientAddress],
      }) as bigint;

      if (profileId === 0n) {
        console.warn('[useReputationCards] Cannot log claim: recipient has no profile');
        return;
      }

      // Insert into claims_log
      const { error } = await supabase
        .from('claims_log')
        .insert({
          profile_id: Number(profileId),
          template_id: Number(templateId),
          card_id: Number(cardId),
          claim_type: claimType,
        });

      if (error) {
        console.error('[useReputationCards] Error logging claim:', error);
      } else {
        logger.debug('[useReputationCards] Claim logged successfully');
      }
    } catch (err) {
      console.error('[useReputationCards] Error logging claim:', err);
    }
  }, [publicClient]);

  // Issue card directly (issuer only)
  const issueDirect = useCallback(async (params: IssueDirectParams): Promise<CardIssuanceResult> => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    setError(null);
    setRetryCount(0);

    try {
      // Execute transaction with retry logic
      // @ts-ignore - Complex type inference issue with executeTransactionFlow
      const { hash, receipt } = await executeTransactionFlow(
        walletClient,
        publicClient,
        {
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'issueDirect',
          args: [params.recipient, params.templateId, params.tokenURI],
          account: address,
        },
        {
          retryOptions: {
            maxRetries: RETRY.MAX_RETRIES,
            delayMs: RETRY.INITIAL_DELAY,
            backoffMultiplier: RETRY.BACKOFF_MULTIPLIER,
            onRetry: (attempt) => {
              setRetryCount(attempt);
            },
          },
        }
      );

      // Listen for CardIssued event to get the card ID
      const cardIssuedEvent = receipt.logs.find((log) => {
        try {
          // @ts-ignore - wagmi v2 type issue with decodeEventLog
          const decoded = publicClient.decodeEventLog({
            abi: ReputationCardABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'CardIssued';
        } catch {
          return false;
        }
      });

      if (cardIssuedEvent) {
        // @ts-ignore - wagmi v2 type issue with decodeEventLog
        const decoded = publicClient.decodeEventLog({
          abi: ReputationCardABI,
          data: cardIssuedEvent.data,
          topics: cardIssuedEvent.topics,
        });
        
        const cardId = decoded.args.cardId as bigint;
        
        // Log claim to Supabase (don't await to avoid blocking)
        logClaim(params.recipient, params.templateId, cardId, 'direct').catch(console.error);
        
        setRetryCount(0);
        return { cardId, txHash: hash };
      }

      console.warn('[useReputationCards] CardIssued event not found, but transaction succeeded');
      setRetryCount(0);
      return { cardId: 0n, txHash: hash };
    } catch (err: any) {
      // Don't set error state for user rejections
      if (!isUserRejection(err)) {
        const parsedError = parseContractError(err);
        const error = new Error(parsedError.message);
        setError(error);
      }
      setRetryCount(0);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [walletClient, address, publicClient, logClaim]);

  // Claim card with signature
  const claimWithSignature = useCallback(async (params: ClaimWithSignatureParams): Promise<CardIssuanceResult> => {
    if (!walletClient || !address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setIsProcessing(true);
    setError(null);
    setRetryCount(0);

    try {
      // Execute transaction with retry logic
      const { hash, receipt } = await executeTransactionFlow(
        walletClient,
        publicClient,
        {
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'claimWithSignature',
          args: [
            params.user,
            params.profileOwner,
            params.templateId,
            params.nonce,
            params.tokenURI,
            params.signature,
          ],
          account: address,
        },
        {
          retryOptions: {
            maxRetries: RETRY.MAX_RETRIES,
            delayMs: RETRY.INITIAL_DELAY,
            backoffMultiplier: RETRY.BACKOFF_MULTIPLIER,
            onRetry: (attempt) => {
              setRetryCount(attempt);
            },
          },
        }
      );

      // Listen for CardIssued event to get the card ID
      const cardIssuedEvent = receipt.logs.find((log) => {
        try {
          // @ts-ignore - wagmi v2 type issue with decodeEventLog
          const decoded = publicClient.decodeEventLog({
            abi: ReputationCardABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'CardIssued';
        } catch {
          return false;
        }
      });

      if (cardIssuedEvent) {
        // @ts-ignore - wagmi v2 type issue with decodeEventLog
        const decoded = publicClient.decodeEventLog({
          abi: ReputationCardABI,
          data: cardIssuedEvent.data,
          topics: cardIssuedEvent.topics,
        });
        
        const cardId = decoded.args.cardId as bigint;
        
        // Log claim to Supabase (don't await to avoid blocking)
        logClaim(params.profileOwner, params.templateId, cardId, 'signature').catch(console.error);
        
        setRetryCount(0);
        return { cardId, txHash: hash };
      }

      console.warn('[useReputationCards] CardIssued event not found, but transaction succeeded');
      setRetryCount(0);
      return { cardId: 0n, txHash: hash };
    } catch (err: any) {
      // Don't set error state for user rejections
      if (!isUserRejection(err)) {
        const parsedError = parseContractError(err);
        const error = new Error(parsedError.message);
        setError(error);
      }
      setRetryCount(0);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [walletClient, address, publicClient, logClaim]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    issueDirect,
    claimWithSignature,
    isProcessing,
    error,
    retryCount,
    clearError,
  };
}
