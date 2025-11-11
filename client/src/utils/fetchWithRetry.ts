/**
 * Utility function for retrying failed operations with exponential backoff
 * Handles transient failures in contract interactions
 */

import { isRetryableError, logClassifiedError } from './errorClassification';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  onRetry: () => {},
  shouldRetry: isRetryableError
};

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retries fail
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // First attempt or retry
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = config.shouldRetry(error);
      const isLastAttempt = attempt === config.maxRetries;

      // Log the error
      logClassifiedError(error, `Attempt ${attempt + 1}/${config.maxRetries + 1}`);

      // If this is the last attempt or error is not retryable, throw
      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      // Call retry callback
      config.onRetry(attempt + 1, error);

      // Wait before retrying with exponential backoff
      await sleep(delay);

      // Increase delay for next retry, capped at maxDelay
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with custom retry condition
 */
export async function retryIf<T>(
  fn: () => Promise<T>,
  condition: (error: unknown) => boolean,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return fetchWithRetry(fn, {
    ...options,
    shouldRetry: condition
  });
}

/**
 * Retry only network errors
 */
export async function retryNetworkErrors<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'shouldRetry'> = {}
): Promise<T> {
  return fetchWithRetry(fn, {
    ...options,
    shouldRetry: (error) => {
      if (error instanceof Error) {
        return error.message.includes('network') || 
               error.message.includes('timeout') ||
               error.message.includes('NETWORK_ERROR');
      }
      return false;
    }
  });
}

/**
 * Batch retry multiple operations
 * Continues with successful operations even if some fail
 */
export async function batchFetchWithRetry<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(
    operations.map(op => fetchWithRetry(op, options))
  );

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error('Batch operation failed:', result.reason);
      return null;
    }
  });
}

/**
 * Fetch with timeout
 * Wraps a promise with a timeout that rejects if not resolved in time
 */
export async function fetchWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

/**
 * Combine retry and timeout
 */
export async function fetchWithRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutMs: number = 30000
): Promise<T> {
  return fetchWithRetry(
    () => fetchWithTimeout(fn, timeoutMs),
    retryOptions
  );
}
