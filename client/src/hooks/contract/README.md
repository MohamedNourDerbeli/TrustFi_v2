# Contract Data Fetching Infrastructure

This directory contains standardized utilities and hooks for fetching data from smart contracts with consistent loading states, error handling, and retry logic.

## Components

### 1. `useContractData` Hook

A custom React hook that wraps contract service calls with consistent patterns.

**Features:**
- Automatic loading state management
- Error classification and user-friendly messages
- Retry logic with exponential backoff
- Authentication and profile requirement checks
- Cache support with configurable TTL
- Stale data detection
- Abort controller for cleanup

**Basic Usage:**

```typescript
import { useContractData } from '@/hooks/contract';
import { contractService } from '@/services/contractService';

function MyComponent() {
  const { data, loading, error, refetch } = useContractData(
    async () => {
      return await contractService.getProfile(tokenId);
    },
    [tokenId], // Dependencies
    {
      enabled: !!tokenId,
      requiresAuth: true,
      onSuccess: (profile) => console.log('Profile loaded:', profile),
      onError: (error) => console.error('Failed to load:', error.userMessage)
    }
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!data) return null;

  return <ProfileDisplay profile={data} />;
}
```

**With Authentication:**

```typescript
import { useAuthenticatedContractData } from '@/hooks/contract';

const { data, loading, error } = useAuthenticatedContractData(
  async () => await reputationCardService.getProfileCards(tokenId),
  [tokenId]
);
```

**With Profile Requirement:**

```typescript
import { useProfileContractData } from '@/hooks/contract';

const { data, loading, error } = useProfileContractData(
  async () => await collectibleService.getEligibleCollectibles(address),
  [address]
);
```

### 2. Error Classification Utility

Maps contract errors to user-friendly messages with retry information.

**Usage:**

```typescript
import { classifyError, ErrorType } from '@/hooks/contract';

try {
  await contractService.createProfile(metadataURI);
} catch (err) {
  const classified = classifyError(err);
  
  console.log(classified.type); // ErrorType.TRANSACTION
  console.log(classified.userMessage); // "Transaction failed. Please try again."
  console.log(classified.retryable); // true
  console.log(classified.action); // "retry"
  
  // Show user-friendly message
  toast.error(classified.userMessage);
  
  // Show retry button if retryable
  if (classified.retryable) {
    showRetryButton();
  }
}
```

**Error Types:**
- `NETWORK_ERROR` - Network connectivity issues (retryable)
- `VALIDATION_ERROR` - Input validation failures (not retryable)
- `TRANSACTION_ERROR` - Blockchain transaction failures (may be retryable)
- `AUTHORIZATION_ERROR` - Permission denied (not retryable)
- `NOT_FOUND_ERROR` - Resource not found (not retryable)
- `INITIALIZATION_ERROR` - Service not initialized (not retryable)
- `UNKNOWN_ERROR` - Unclassified errors (retryable)

### 3. Retry Utility Functions

Provides retry logic with exponential backoff for transient failures.

**Basic Retry:**

```typescript
import { fetchWithRetry } from '@/hooks/contract';

const profile = await fetchWithRetry(
  async () => await contractService.getProfile(tokenId),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`, error);
    }
  }
);
```

**Network-Only Retry:**

```typescript
import { retryNetworkErrors } from '@/hooks/contract';

const data = await retryNetworkErrors(
  async () => await fetchFromBlockchain(),
  { maxRetries: 5 }
);
```

**Batch Operations:**

```typescript
import { batchFetchWithRetry } from '@/hooks/contract';

const operations = cardIds.map(id => 
  () => reputationCardService.getCard(id)
);

const results = await batchFetchWithRetry(operations);
// Returns array with successful results and null for failures
```

**With Timeout:**

```typescript
import { fetchWithRetryAndTimeout } from '@/hooks/contract';

const data = await fetchWithRetryAndTimeout(
  async () => await slowOperation(),
  { maxRetries: 3 },
  30000 // 30 second timeout
);
```

## Configuration Options

### UseContractDataOptions

```typescript
interface UseContractDataOptions<T> {
  enabled?: boolean;              // Auto-fetch on mount (default: true)
  requiresAuth?: boolean;         // Requires wallet connection (default: false)
  requiresProfile?: boolean;      // Requires on-chain profile (default: false)
  retryOptions?: RetryOptions;    // Retry configuration
  onSuccess?: (data: T) => void;  // Success callback
  onError?: (error: ClassifiedError) => void; // Error callback
  cacheTime?: number;             // Cache duration in ms (default: 0)
  staleTime?: number;             // Stale threshold in ms (default: 0)
  initialData?: T;                // Initial data value
}
```

### RetryOptions

```typescript
interface RetryOptions {
  maxRetries?: number;            // Max retry attempts (default: 3)
  initialDelay?: number;          // Initial delay in ms (default: 1000)
  maxDelay?: number;              // Max delay in ms (default: 10000)
  backoffMultiplier?: number;     // Backoff multiplier (default: 2)
  onRetry?: (attempt: number, error: unknown) => void;
  shouldRetry?: (error: unknown) => boolean;
}
```

## Best Practices

1. **Always use dependencies array**: Include all variables used in fetchFn
2. **Handle loading states**: Show skeletons or spinners during loading
3. **Display user-friendly errors**: Use classified error messages
4. **Provide retry buttons**: For retryable errors
5. **Use appropriate hooks**: Choose based on auth/profile requirements
6. **Set reasonable cache times**: Balance freshness vs performance
7. **Clean up on unmount**: Hook handles this automatically
8. **Log errors properly**: Use logClassifiedError for consistent logging

## Examples

### Dashboard Data Fetching

```typescript
function Dashboard() {
  const { userProfile } = useWallet();
  
  const { data: cards, loading, error, refetch } = useProfileContractData(
    async () => {
      const cardIds = await reputationCardService.getProfileCards(
        Number(userProfile.tokenId)
      );
      return Promise.all(cardIds.map(id => 
        reputationCardService.getCard(id)
      ));
    },
    [userProfile?.tokenId],
    {
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      staleTime: 60 * 1000,      // Stale after 1 minute
      onError: (error) => {
        toast.error(error.userMessage);
      }
    }
  );

  if (loading) return <CardLoadingSkeleton count={3} />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} />;
  
  return <CardGrid cards={cards} />;
}
```

### Transaction with Retry

```typescript
async function issueCredential(recipientAddress: string, category: string) {
  try {
    const cardId = await fetchWithRetry(
      async () => {
        return await reputationCardService.issueCard(
          recipientAddress,
          category,
          metadataURI
        );
      },
      {
        maxRetries: 2, // Only retry once for transactions
        shouldRetry: (error) => {
          // Don't retry if user rejected
          const classified = classifyError(error);
          return classified.retryable && 
                 classified.type !== ErrorType.TRANSACTION;
        }
      }
    );
    
    toast.success(`Credential issued successfully! ID: ${cardId}`);
    return cardId;
  } catch (error) {
    const classified = classifyError(error);
    toast.error(classified.userMessage);
    throw error;
  }
}
```
