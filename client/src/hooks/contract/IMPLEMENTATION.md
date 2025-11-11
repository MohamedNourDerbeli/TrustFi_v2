# Contract Fetching Infrastructure Implementation

## Overview

This implementation provides a standardized infrastructure for fetching data from smart contracts with consistent loading states, error handling, and retry logic. It addresses Requirements 1.1, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, and 10.3 from the specification.

## Components Implemented

### 1. Error Classification Utility (`utils/errorClassification.ts`)

**Purpose**: Maps contract errors to user-friendly messages with retry information.

**Features**:
- Classifies errors into 7 distinct types (Network, Validation, Transaction, Authorization, Not Found, Initialization, Unknown)
- Provides user-friendly error messages for each error type
- Determines if errors are retryable
- Suggests appropriate actions (retry, reconnect, switch-network, contact-support, check-wallet)
- Handles custom error types from contract services (NetworkError, ValidationError, TransactionError, ContractError)
- Handles standard JavaScript Error objects with pattern matching
- Includes logging utilities for consistent error tracking

**Key Functions**:
- `classifyError(error)` - Main classification function
- `isRetryableError(error)` - Quick check if error can be retried
- `getErrorAction(error)` - Get suggested action for error
- `logClassifiedError(error, context)` - Log with classification context

**Requirements Addressed**:
- 3.1: Typed errors with descriptive messages
- 3.2: Component-level error catching
- 3.3: Toast notifications with error messages
- 3.4: User cancellation detection
- 3.5: Network error distinction

### 2. Retry Utility (`utils/fetchWithRetry.ts`)

**Purpose**: Provides retry logic with exponential backoff for transient failures.

**Features**:
- Configurable retry attempts (default: 3)
- Exponential backoff with configurable multiplier (default: 2x)
- Maximum delay cap to prevent excessive waiting
- Custom retry conditions
- Retry callbacks for progress tracking
- Batch operations with partial failure support
- Timeout support
- Network-specific retry helpers

**Key Functions**:
- `fetchWithRetry(fn, options)` - Main retry function with exponential backoff
- `retryIf(fn, condition, options)` - Retry with custom condition
- `retryNetworkErrors(fn, options)` - Retry only network errors
- `batchFetchWithRetry(operations, options)` - Batch operations with retry
- `fetchWithTimeout(fn, timeoutMs)` - Add timeout to operations
- `fetchWithRetryAndTimeout(fn, retryOptions, timeoutMs)` - Combined retry and timeout

**Requirements Addressed**:
- 1.4: Retry mechanism for network timeouts
- 3.5: Network error handling
- 10.3: Automatic reinitialization support

### 3. Contract Data Hook (`hooks/useContractData.ts`)

**Purpose**: Custom React hook that wraps contract service calls with consistent patterns.

**Features**:
- Automatic loading state management
- Error classification and handling
- Retry logic integration
- Authentication requirement checking
- Profile requirement checking
- Cache support with configurable TTL
- Stale data detection
- Abort controller for cleanup
- Success/error callbacks
- Manual refetch capability
- Reset functionality
- Initial data support

**Key Hooks**:
- `useContractData(fetchFn, dependencies, options)` - Main hook
- `useAuthenticatedContractData(fetchFn, dependencies, options)` - Requires wallet connection
- `useProfileContractData(fetchFn, dependencies, options)` - Requires wallet + profile

**Options**:
- `enabled` - Auto-fetch on mount (default: true)
- `requiresAuth` - Requires wallet connection (default: false)
- `requiresProfile` - Requires on-chain profile (default: false)
- `retryOptions` - Retry configuration
- `onSuccess` - Success callback
- `onError` - Error callback
- `cacheTime` - Cache duration in ms (default: 0)
- `staleTime` - Stale threshold in ms (default: 0)
- `initialData` - Initial data value

**Return Values**:
- `data` - Fetched data or null
- `loading` - Loading state boolean
- `error` - Classified error or null
- `initialized` - Whether data has been fetched at least once
- `refetch` - Function to manually refetch data
- `reset` - Function to reset state
- `isStale` - Whether data is stale based on staleTime

**Requirements Addressed**:
- 1.1: Loading indicators during fetch
- 1.2: Display data within 500ms of completion
- 1.3: User-friendly error messages
- 1.4: Retry mechanism
- 1.5: Prevent interactions during loading
- 3.1: Typed errors
- 3.2: Component-level error handling
- 10.1: Initialization verification
- 10.2: Descriptive errors when not initialized
- 10.3: Reinitialization on network changes

## File Structure

```
client/src/
├── hooks/
│   ├── useContractData.ts          # Main hook implementation
│   └── contract/
│       ├── index.ts                # Centralized exports
│       ├── README.md               # Usage documentation
│       ├── IMPLEMENTATION.md       # This file
│       └── examples.tsx            # Example implementations
└── utils/
    ├── errorClassification.ts      # Error classification utility
    └── fetchWithRetry.ts           # Retry utility functions
```

## Usage Patterns

### Basic Usage

```typescript
const { data, loading, error, refetch } = useContractData(
  async () => await contractService.getProfile(tokenId),
  [tokenId]
);
```

### With Authentication

```typescript
const { data, loading, error } = useAuthenticatedContractData(
  async () => await reputationCardService.getProfileCards(tokenId),
  [tokenId]
);
```

### With Profile Requirement

```typescript
const { data, loading, error } = useProfileContractData(
  async () => await collectibleService.getActiveCollectibles(),
  []
);
```

### With Caching

```typescript
const { data, loading, error, isStale } = useContractData(
  async () => await fetchData(),
  [dependency],
  {
    cacheTime: 5 * 60 * 1000,  // Cache for 5 minutes
    staleTime: 60 * 1000        // Stale after 1 minute
  }
);
```

### With Custom Retry Logic

```typescript
const { data, loading, error } = useContractData(
  async () => await fetchData(),
  [dependency],
  {
    retryOptions: {
      maxRetries: 5,
      initialDelay: 2000,
      onRetry: (attempt) => console.log(`Retry ${attempt}`)
    }
  }
);
```

## Integration Points

### With Existing Services

The infrastructure integrates seamlessly with existing contract services:
- `contractService` - Profile NFT operations
- `reputationCardService` - Reputation card operations
- `collectibleContractService` - Collectible operations

### With Existing Error Types

Reuses and extends existing error types:
- `ContractError` - Base contract error
- `NetworkError` - Network-related errors
- `ValidationError` - Input validation errors
- `TransactionError` - Transaction failures

### With WalletContext

Integrates with `WalletContext` for:
- Authentication checks (`address`)
- Profile requirement checks (`userProfile.hasProfile`)
- Provider access (for service initialization)

## Testing Considerations

While unit tests are marked as optional (task 14), the implementation includes:
- Type safety through TypeScript
- Error boundary support
- Abort controller cleanup
- Mounted state tracking
- Comprehensive examples in `examples.tsx`

## Next Steps

This infrastructure is now ready to be used in the following tasks:
- Task 5: Dashboard page contract fetching
- Task 6: Issuer page contract fetching
- Task 7: Admin page contract fetching
- Task 8: Collectibles page contract fetching

Each page can now use these standardized patterns for consistent UX across the application.

## Performance Considerations

- **Caching**: Reduces redundant blockchain calls
- **Stale-while-revalidate**: Shows cached data while fetching fresh data
- **Abort controllers**: Prevents memory leaks from unmounted components
- **Batch operations**: Supports parallel fetching with partial failure handling
- **Exponential backoff**: Prevents overwhelming the network during failures

## Accessibility

- Loading states are exposed for screen reader announcements
- Error messages are user-friendly and actionable
- Retry mechanisms provide clear feedback
- State changes are predictable and consistent
