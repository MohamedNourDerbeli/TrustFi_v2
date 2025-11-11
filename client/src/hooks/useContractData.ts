/**
 * Custom hook for standardized contract data fetching
 * Provides consistent loading, error handling, and retry logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry, type RetryOptions } from '@/utils/fetchWithRetry';
import { classifyError, type ClassifiedError } from '@/utils/errorClassification';
import { useWallet } from '@/contexts/WalletContext';
import { logError, logPerformance, type ErrorContext } from '@/services/errorTrackingService';

export interface ContractDataState<T> {
  data: T | null;
  loading: boolean;
  error: ClassifiedError | null;
  initialized: boolean;
}

export interface UseContractDataOptions<T> {
  // Whether to fetch automatically on mount
  enabled?: boolean;
  
  // Whether wallet connection is required
  requiresAuth?: boolean;
  
  // Whether on-chain profile is required
  requiresProfile?: boolean;
  
  // Retry configuration
  retryOptions?: RetryOptions;
  
  // Callbacks
  onSuccess?: (data: T) => void;
  onError?: (error: ClassifiedError) => void;
  
  // Cache configuration
  cacheTime?: number; // Time in ms to cache data (0 = no cache)
  staleTime?: number; // Time in ms before data is considered stale
  
  // Initial data
  initialData?: T;
  
  // Error tracking context
  operationName?: string;
  page?: string;
  component?: string;
}

export interface UseContractDataReturn<T> extends ContractDataState<T> {
  refetch: () => Promise<void>;
  reset: () => void;
  isStale: boolean;
}

/**
 * Hook for fetching contract data with standardized patterns
 * 
 * @param fetchFn - Async function that fetches the data
 * @param dependencies - Array of dependencies that trigger refetch
 * @param options - Configuration options
 * @returns Contract data state and control functions
 */
export function useContractData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseContractDataOptions<T> = {}
): UseContractDataReturn<T> {
  const {
    enabled = true,
    requiresAuth = false,
    requiresProfile = false,
    retryOptions = {},
    onSuccess,
    onError,
    cacheTime = 0,
    staleTime = 0,
    initialData,
    operationName = 'contract-fetch',
    page,
    component
  } = options;

  const { address, userProfile } = useWallet();
  
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if data is stale
  const isStale = staleTime > 0 && Date.now() - lastFetchTime > staleTime;

  // Check if requirements are met
  const canFetch = useCallback(() => {
    if (!enabled) return false;
    if (requiresAuth && !address) return false;
    if (requiresProfile && !userProfile?.hasProfile) return false;
    return true;
  }, [enabled, requiresAuth, requiresProfile, address, userProfile]);

  // Main fetch function
  const fetchData = useCallback(async () => {
    // Check if we can fetch
    if (!canFetch()) {
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const startTime = performance.now();
    const errorContext: ErrorContext = {
      userAddress: address,
      userRole: userProfile?.isAdmin ? 'admin' : userProfile?.isIssuer ? 'issuer' : 'user',
      hasProfile: userProfile?.hasProfile,
      page,
      component,
      action: operationName
    };

    try {
      // Execute fetch with retry logic
      const result = await fetchWithRetry(fetchFn, {
        maxRetries: 3,
        initialDelay: 1000,
        ...retryOptions,
        onRetry: (attempt, err) => {
          console.log(`Retrying fetch (attempt ${attempt})...`);
          retryOptions.onRetry?.(attempt, err);
        }
      });

      // Log performance
      const duration = performance.now() - startTime;
      logPerformance(operationName, duration, errorContext, { success: true });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
        setLastFetchTime(Date.now());
        setInitialized(true);
        onSuccess?.(result);
      }
    } catch (err) {
      // Classify the error
      const classifiedError = classifyError(err);
      
      // Log the error with context
      logError(err, errorContext);
      
      // Log performance (failed operation)
      const duration = performance.now() - startTime;
      logPerformance(operationName, duration, errorContext, { success: false });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(classifiedError);
        onError?.(classifiedError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, canFetch, retryOptions, onSuccess, onError, operationName, page, component, address, userProfile]);

  // Refetch function (can be called manually)
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Reset function
  const reset = useCallback(() => {
    setData(initialData ?? null);
    setError(null);
    setLoading(false);
    setInitialized(false);
    setLastFetchTime(0);
  }, [initialData]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (canFetch()) {
      // Check cache
      if (cacheTime > 0 && data !== null && Date.now() - lastFetchTime < cacheTime) {
        // Data is still cached, don't refetch
        return;
      }

      fetchData();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [canFetch, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    initialized,
    refetch,
    reset,
    isStale
  };
}

/**
 * Hook for fetching contract data that requires authentication
 */
export function useAuthenticatedContractData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: Omit<UseContractDataOptions<T>, 'requiresAuth'> = {}
): UseContractDataReturn<T> {
  return useContractData(fetchFn, dependencies, {
    ...options,
    requiresAuth: true
  });
}

/**
 * Hook for fetching contract data that requires a profile
 */
export function useProfileContractData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: Omit<UseContractDataOptions<T>, 'requiresAuth' | 'requiresProfile'> = {}
): UseContractDataReturn<T> {
  return useContractData(fetchFn, dependencies, {
    ...options,
    requiresAuth: true,
    requiresProfile: true
  });
}
