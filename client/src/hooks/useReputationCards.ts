// hooks/useReputationCards.ts
import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, type Hex, parseAbiItem } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import { parseContractError, retryWithBackoff, isUserRejection } from '../lib/errors';
import { executeTransactionFlow } from '../lib/transactionHelpers';

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
            maxRetries: 3,
            delayMs: 1000,
            backoffMultiplier: 2,
            onRetry: (attempt) => {
              setRetryCount(attempt);
            },
          },
        }
      );

      // Listen for CardIssued event to get the card ID
      const cardIssuedEvent = receipt.logs.find((log) => {
        try {
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
        const decoded = publicClient.decodeEventLog({
          abi: ReputationCardABI,
          data: cardIssuedEvent.data,
          topics: cardIssuedEvent.topics,
        });
        
        const cardId = decoded.args.cardId as bigint;
        setRetryCount(0);
        return { cardId, txHash: hash };
      }

      throw new Error('CardIssued event not found in transaction receipt');
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
  }, [walletClient, address, publicClient]);

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
            maxRetries: 3,
            delayMs: 1000,
            backoffMultiplier: 2,
            onRetry: (attempt) => {
              setRetryCount(attempt);
            },
          },
        }
      );

      // Listen for CardIssued event to get the card ID
      const cardIssuedEvent = receipt.logs.find((log) => {
        try {
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
        const decoded = publicClient.decodeEventLog({
          abi: ReputationCardABI,
          data: cardIssuedEvent.data,
          topics: cardIssuedEvent.topics,
        });
        
        const cardId = decoded.args.cardId as bigint;
        setRetryCount(0);
        return { cardId, txHash: hash };
      }

      throw new Error('CardIssued event not found in transaction receipt');
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
  }, [walletClient, address, publicClient]);

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
