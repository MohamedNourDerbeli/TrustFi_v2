// hooks/useTransactionHandler.ts
import { useState, useCallback } from 'react';
import { type Hash } from 'viem';
import { usePublicClient } from 'wagmi';
import { 
  parseContractError, 
  retryWithBackoff, 
  isUserRejection,
  type ParsedError,
  type RetryOptions 
} from '../lib/errors';

export interface TransactionState {
  isProcessing: boolean;
  error: ParsedError | null;
  txHash: Hash | null;
  retryCount: number;
}

export interface UseTransactionHandlerReturn {
  state: TransactionState;
  executeTransaction: <T>(
    fn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void | Promise<void>;
      onError?: (error: ParsedError) => void;
      retryOptions?: RetryOptions;
    }
  ) => Promise<T | undefined>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for handling transactions with automatic retry logic and error parsing
 */
export function useTransactionHandler(): UseTransactionHandlerReturn {
  const publicClient = usePublicClient();
  
  const [state, setState] = useState<TransactionState>({
    isProcessing: false,
    error: null,
    txHash: null,
    retryCount: 0,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      txHash: null,
      retryCount: 0,
    });
  }, []);

  const executeTransaction = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void | Promise<void>;
        onError?: (error: ParsedError) => void;
        retryOptions?: RetryOptions;
      }
    ): Promise<T | undefined> => {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      try {
        // Execute with retry logic
        const result = await retryWithBackoff(fn, {
          ...options?.retryOptions,
          onRetry: (attempt, error) => {
            setState(prev => ({ ...prev, retryCount: attempt }));
            options?.retryOptions?.onRetry?.(attempt, error);
          },
        });

        // If result is a transaction hash, store it
        if (typeof result === 'string' && result.startsWith('0x')) {
          setState(prev => ({ 
            ...prev, 
            txHash: result as Hash,
            isProcessing: false,
            retryCount: 0,
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            retryCount: 0,
          }));
        }

        // Call success callback
        if (options?.onSuccess) {
          await options.onSuccess(result);
        }

        return result;
      } catch (error) {
        // Parse the error
        const parsedError = parseContractError(error);
        
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: parsedError,
          retryCount: 0,
        }));

        // Call error callback
        if (options?.onError) {
          options.onError(parsedError);
        }

        // Don't throw if user rejected - just return undefined
        if (isUserRejection(error)) {
          return undefined;
        }

        throw error;
      }
    },
    []
  );

  return {
    state,
    executeTransaction,
    clearError,
    reset,
  };
}

/**
 * Hook for handling transaction confirmation with retry
 */
export function useTransactionConfirmation() {
  const publicClient = usePublicClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<ParsedError | null>(null);

  const waitForConfirmation = useCallback(
    async (hash: Hash, retryOptions?: RetryOptions) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      setIsConfirming(true);
      setError(null);

      try {
        const receipt = await retryWithBackoff(
          () => publicClient.waitForTransactionReceipt({ hash }),
          {
            maxRetries: 3,
            delayMs: 2000,
            ...retryOptions,
          }
        );

        setIsConfirming(false);
        return receipt;
      } catch (err) {
        const parsedError = parseContractError(err);
        setError(parsedError);
        setIsConfirming(false);
        throw err;
      }
    },
    [publicClient]
  );

  return {
    waitForConfirmation,
    isConfirming,
    error,
  };
}
