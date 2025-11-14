// lib/transactionHelpers.ts
/**
 * Transaction helper utilities and example usage patterns
 * for the enhanced error handling system
 */

import { type Hash, type Address } from 'viem';
import type { WalletClient, PublicClient } from 'wagmi';
import { retryWithBackoff, parseContractError, type RetryOptions } from './errors';

/**
 * Example: Execute a contract write with automatic retry
 */
export async function executeContractWriteWithRetry<T = Hash>(
  walletClient: WalletClient,
  params: {
    address: Address;
    abi: any;
    functionName: string;
    args?: readonly any[];
    account: Address;
  },
  retryOptions?: RetryOptions
): Promise<T> {
  return retryWithBackoff(
    async () => {
      const hash = await walletClient.writeContract({
        ...params,
        args: params.args || [],
      } as any);
      return hash as T;
    },
    {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      ...retryOptions,
    }
  );
}

/**
 * Example: Wait for transaction receipt with retry
 */
export async function waitForTransactionWithRetry(
  publicClient: PublicClient,
  hash: Hash,
  retryOptions?: RetryOptions
) {
  return retryWithBackoff(
    async () => {
      return await publicClient.waitForTransactionReceipt({ hash });
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 1.5,
      ...retryOptions,
    }
  );
}

/**
 * Example: Execute a full transaction flow with retry
 * (write + wait for confirmation)
 */
export async function executeTransactionFlow<T = any>(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    address: Address;
    abi: any;
    functionName: string;
    args?: readonly any[];
    account: Address;
  },
  options?: {
    retryOptions?: RetryOptions;
    onHashReceived?: (hash: Hash) => void;
    onConfirmed?: (receipt: any) => void;
  }
): Promise<{ hash: Hash; receipt: any; result?: T }> {
  // Step 1: Execute the transaction
  const hash = await executeContractWriteWithRetry(
    walletClient,
    params,
    options?.retryOptions
  );

  if (options?.onHashReceived) {
    options.onHashReceived(hash);
  }

  // Step 2: Wait for confirmation
  const receipt = await waitForTransactionWithRetry(
    publicClient,
    hash,
    options?.retryOptions
  );

  if (options?.onConfirmed) {
    options.onConfirmed(receipt);
  }

  return { hash, receipt };
}

/**
 * Example: Estimate gas with fallback
 */
export async function estimateGasWithFallback(
  publicClient: PublicClient,
  params: {
    account: Address;
    to: Address;
    data?: `0x${string}`;
    value?: bigint;
  },
  fallbackGas: bigint = 500000n
): Promise<bigint> {
  try {
    const estimate = await publicClient.estimateGas(params);
    // Add 20% buffer to be safe
    return (estimate * 120n) / 100n;
  } catch (error) {
    console.warn('Gas estimation failed, using fallback:', parseContractError(error).message);
    return fallbackGas;
  }
}

/**
 * Example: Check if transaction will likely succeed before sending
 */
export async function simulateTransaction(
  publicClient: PublicClient,
  params: {
    address: Address;
    abi: any;
    functionName: string;
    args?: readonly any[];
    account: Address;
  }
): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    const result = await publicClient.simulateContract({
      ...params,
      args: params.args || [],
    } as any);
    return { success: true, result: result.result };
  } catch (error) {
    const parsed = parseContractError(error);
    return { success: false, error: parsed.message };
  }
}

/**
 * Example: Execute transaction with pre-flight checks
 */
export async function executeTransactionWithChecks<T = any>(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    address: Address;
    abi: any;
    functionName: string;
    args?: readonly any[];
    account: Address;
  },
  options?: {
    skipSimulation?: boolean;
    retryOptions?: RetryOptions;
    onProgress?: (stage: 'simulating' | 'sending' | 'confirming', data?: any) => void;
  }
): Promise<{ hash: Hash; receipt: any; result?: T }> {
  // Step 1: Simulate transaction (unless skipped)
  if (!options?.skipSimulation) {
    options?.onProgress?.('simulating');
    const simulation = await simulateTransaction(publicClient, params);
    
    if (!simulation.success) {
      throw new Error(simulation.error || 'Transaction simulation failed');
    }
  }

  // Step 2: Send transaction
  options?.onProgress?.('sending');
  const hash = await executeContractWriteWithRetry(
    walletClient,
    params,
    options?.retryOptions
  );

  // Step 3: Wait for confirmation
  options?.onProgress?.('confirming', { hash });
  const receipt = await waitForTransactionWithRetry(
    publicClient,
    hash,
    options?.retryOptions
  );

  return { hash, receipt };
}

/**
 * Batch multiple transactions with error handling
 */
export async function executeBatchTransactions(
  walletClient: WalletClient,
  publicClient: PublicClient,
  transactions: Array<{
    address: Address;
    abi: any;
    functionName: string;
    args?: readonly any[];
    account: Address;
  }>,
  options?: {
    stopOnError?: boolean;
    retryOptions?: RetryOptions;
    onTransactionComplete?: (index: number, result: any) => void;
    onTransactionError?: (index: number, error: any) => void;
  }
): Promise<Array<{ success: boolean; hash?: Hash; receipt?: any; error?: string }>> {
  const results: Array<{ success: boolean; hash?: Hash; receipt?: any; error?: string }> = [];

  for (let i = 0; i < transactions.length; i++) {
    try {
      const { hash, receipt } = await executeTransactionFlow(
        walletClient,
        publicClient,
        transactions[i],
        { retryOptions: options?.retryOptions }
      );

      results.push({ success: true, hash, receipt });
      options?.onTransactionComplete?.(i, { hash, receipt });
    } catch (error) {
      const parsed = parseContractError(error);
      results.push({ success: false, error: parsed.message });
      options?.onTransactionError?.(i, error);

      if (options?.stopOnError) {
        break;
      }
    }
  }

  return results;
}
