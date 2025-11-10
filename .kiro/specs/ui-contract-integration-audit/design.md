# Design Document

## Overview

This design document outlines the architecture and implementation strategy for auditing and improving the UI's contract integration, ensuring clean UX patterns, proper role-based access control, and complete page functionality. The system currently has three distinct user roles (User, Issuer, Admin) with varying levels of access to platform features.

The design focuses on:
1. **Consistent Contract Fetching Patterns** - Standardized loading states, error handling, and data fetching across all pages
2. **Role-Based Access Control** - Proper enforcement of permissions at both the route and component levels
3. **User Experience Improvements** - Clear feedback, smooth transitions, and intuitive interfaces
4. **Error Resilience** - Graceful degradation and recovery from contract interaction failures

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Dashboard │  │   Issuer   │  │   Admin    │            │
│  │    Page    │  │    Page    │  │    Page    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                    Context & State Layer                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WalletContext                            │   │
│  │  - Connection State                                   │   │
│  │  - User Profile & Roles                               │   │
│  │  - Provider Instance                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Contract    │  │  Reputation  │  │ Collectible  │      │
│  │  Service     │  │  Card Service│  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ProfileNFT  │  │  Reputation  │  │ Collectible  │      │
│  │  Contract    │  │  Card        │  │  Contract    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Pattern

```
User Action → Component → Service Layer → Contract → Blockchain
                ↓              ↓            ↓
            Loading UI    Error Handler  Transaction
                ↓              ↓            ↓
            Success UI    Toast Message  Event Logs
```

## Components and Interfaces

### 1. Enhanced ProtectedRoute Component

**Purpose**: Enforce role-based access control at the route level

**Current Issues**:
- Basic role checking without granular permissions
- No loading state differentiation
- Generic error messages

**Improvements**:

```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
  requireAdmin?: boolean;
  requireIssuer?: boolean;
  fallbackPath?: string;
  customUnauthorizedMessage?: string;
}

interface RoleCheckResult {
  authorized: boolean;
  reason?: 'no-wallet' | 'no-profile' | 'insufficient-role';
  redirectPath?: string;
}
```

**Features**:
- Granular role checking with clear feedback
- Custom fallback paths per route
- Loading skeleton while checking permissions
- Contextual error messages based on failure reason

### 2. Contract Fetching Hook Pattern

**Purpose**: Standardize data fetching across all pages

**Pattern**:

```typescript
interface ContractFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  initialized: boolean;
}

function useContractData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[],
  options?: {
    requiresAuth?: boolean;
    requiresProfile?: boolean;
    onError?: (error: Error) => void;
  }
): ContractFetchState<T>
```

**Implementation Strategy**:
- Wrap all contract service calls in this pattern
- Automatic initialization checking
- Consistent error handling
- Retry mechanism for transient failures

### 3. Loading State Components

**Purpose**: Provide consistent loading feedback across the application

**Components**:

```typescript
// Page-level skeleton
<PageLoadingSkeleton 
  variant="dashboard" | "issuer" | "admin"
/>

// Card-level skeleton
<CardLoadingSkeleton 
  count={3}
  layout="grid" | "list"
/>

// Inline loading
<InlineLoader 
  message="Fetching credentials..."
  size="sm" | "md" | "lg"
/>
```

### 4. Error Boundary Component

**Purpose**: Catch and handle errors gracefully at component boundaries

```typescript
interface ErrorBoundaryProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
}

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => logError(error)}
  resetKeys={[userAddress]}
>
  <DashboardContent />
</ErrorBoundary>
```

### 5. Transaction Status Component

**Purpose**: Provide clear feedback during blockchain transactions

```typescript
interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'error';
  message?: string;
  txHash?: string;
  onClose?: () => void;
}

<TransactionStatus
  status={txStatus}
  message="Issuing credential..."
  txHash={receipt?.hash}
/>
```

## Data Models

### User Profile Model

```typescript
interface UserProfile {
  // On-chain data
  tokenId: string;
  hasProfile: boolean;
  reputationScore: number;
  createdAt: number;
  
  // Role flags
  isAdmin: boolean;
  isIssuer: boolean;
  
  // Off-chain data
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  profileViews: number;
}
```

### Contract Fetch Result Model

```typescript
interface ContractFetchResult<T> {
  data: T;
  timestamp: number;
  blockNumber: number;
  cached: boolean;
}

interface ContractError {
  code: string;
  message: string;
  originalError?: any;
  retryable: boolean;
}
```

### Page State Model

```typescript
interface PageState {
  initialized: boolean;
  loading: boolean;
  error: ContractError | null;
  lastFetch: number;
  dataStale: boolean;
}
```

## Error Handling

### Error Classification

```typescript
enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  TRANSACTION = 'TRANSACTION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

interface ClassifiedError {
  type: ErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  action?: 'retry' | 'reconnect' | 'switch-network' | 'contact-support';
}
```

### Error Handling Strategy

1. **Service Layer**: Throw typed errors with context
2. **Hook Layer**: Catch errors and classify them
3. **Component Layer**: Display user-friendly messages
4. **Global Layer**: Log errors for monitoring

### Error Recovery Patterns

```typescript
// Automatic retry for transient errors
const fetchWithRetry = async (
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  // Implementation with exponential backoff
}

// Fallback to cached data
const fetchWithFallback = async (
  fn: () => Promise<T>,
  cacheKey: string
): Promise<T> => {
  try {
    const data = await fn();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    throw error;
  }
}
```

## Testing Strategy

### Unit Tests

**Contract Services**:
- Test initialization with valid/invalid providers
- Test error throwing for uninitialized services
- Test error classification
- Mock blockchain responses

**Hooks**:
- Test loading states
- Test error handling
- Test refetch functionality
- Test dependency updates

### Integration Tests

**Page Components**:
- Test role-based access control
- Test data fetching and display
- Test error states
- Test user interactions

**User Flows**:
- Connect wallet → View dashboard
- Issue credential → Verify in history
- Claim collectible → See in gallery
- Admin authorize issuer → Issuer can issue

### E2E Tests

**Critical Paths**:
1. User onboarding flow
2. Credential issuance flow
3. Collectible claiming flow
4. Admin management flow

## Page-Specific Designs

### Dashboard Page

**Data Requirements**:
- User profile (on-chain + off-chain)
- Reputation score
- Credentials list with minting modes
- Profile views count
- Eligible collectibles count
- Claim history statistics

**Loading Strategy**:
```typescript
// Parallel fetching for independent data
const [profile, cards, collectibles, stats] = await Promise.all([
  fetchProfile(),
  fetchCards(),
  fetchCollectibles(),
  fetchStats()
]);

// Sequential for dependent data
const profile = await fetchProfile();
const cards = await fetchCards(profile.tokenId);
```

**Error Handling**:
- Partial failure support (show available data)
- Retry buttons for failed sections
- Graceful degradation (hide sections if data unavailable)

### Issuer Page

**Data Requirements**:
- Issued credentials history
- Created collectibles
- Collectible analytics
- Whitelist management

**Access Control**:
- Check `userProfile.isIssuer` before rendering
- Show authorization request if not issuer
- Disable forms during submission

**Real-time Updates**:
- Listen for CardIssued events
- Listen for CollectibleCreated events
- Auto-refresh lists on events

### Admin Page

**Data Requirements**:
- Total credentials count
- Authorized issuers list
- System audit logs
- Configuration settings

**Access Control**:
- Check `userProfile.isAdmin` before rendering
- Show access denied for non-admins
- Confirm destructive actions (revoke issuer)

**Security**:
- Validate addresses before authorization
- Confirm before revoking issuers
- Log all admin actions

### Collectibles Gallery Page

**Data Requirements**:
- All active collectibles
- User eligibility status per collectible
- Claim status per collectible
- Collectible metadata

**Filtering**:
- By category
- By eligibility (Available, Claimed, Locked)
- By rarity tier
- By expiration

**Claiming Flow**:
```
1. User clicks "Claim"
2. Check eligibility (show error if not eligible)
3. Show transaction modal
4. Submit transaction
5. Wait for confirmation
6. Update UI with claimed status
7. Show success message
```

## Performance Optimizations

### Caching Strategy

```typescript
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate: boolean;
  key: string;
}

// Cache user profile for 5 minutes
const profileCache: CacheConfig = {
  ttl: 5 * 60 * 1000,
  staleWhileRevalidate: true,
  key: 'user-profile'
};
```

### Batch Requests

```typescript
// Instead of fetching cards one by one
const cards = await Promise.all(
  cardIds.map(id => fetchCard(id))
);

// Batch fetch with multicall
const cards = await batchFetchCards(cardIds);
```

### Lazy Loading

- Load collectibles on demand (not on dashboard)
- Load issuer history only when tab is active
- Load admin logs only when tab is active

### Memoization

```typescript
// Memoize expensive computations
const eligibleCollectibles = useMemo(() => {
  return collectibles.filter(c => 
    claimStatus.get(c.templateId)?.isEligible
  );
}, [collectibles, claimStatus]);
```

## Accessibility

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Proper tab order
- Focus indicators

### Screen Readers
- Semantic HTML elements
- ARIA labels for dynamic content
- Status announcements for loading/errors

### Visual Feedback
- Loading spinners with labels
- Error messages with icons
- Success confirmations

## Security Considerations

### Input Validation
- Validate all addresses before contract calls
- Sanitize user inputs
- Check bounds on numeric inputs

### Transaction Safety
- Show transaction preview before submission
- Require explicit confirmation
- Display gas estimates
- Prevent double submissions

### Role Verification
- Verify roles on both client and contract
- Don't trust client-side role checks alone
- Re-verify on sensitive operations

## Migration Plan

### Phase 1: Audit Current Implementation
- Document all contract fetching patterns
- Identify inconsistencies
- List missing error handling
- Note UX issues

### Phase 2: Implement Core Improvements
- Create standardized hooks
- Add loading skeletons
- Implement error boundaries
- Add transaction status component

### Phase 3: Page-by-Page Refactoring
- Dashboard page
- Issuer page
- Admin page
- Collectibles page

### Phase 4: Testing & Validation
- Unit tests for services
- Integration tests for pages
- E2E tests for critical flows
- User acceptance testing

### Phase 5: Monitoring & Iteration
- Add error tracking
- Monitor performance
- Gather user feedback
- Iterate on UX improvements
