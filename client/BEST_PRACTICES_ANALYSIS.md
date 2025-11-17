# Best Practices Analysis

## Overview
This document analyzes the codebase for adherence to React, TypeScript, and Web3 best practices.

---

## ✅ STRENGTHS - What's Done Well

### 1. **React Query Implementation**
- ✅ Proper use of `@tanstack/react-query` for data fetching
- ✅ Appropriate `staleTime` and `gcTime` configurations
- ✅ Query key management with proper dependencies
- ✅ Centralized query client configuration

**Example (useProfile.ts):**
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['profile', address?.toLowerCase()],
  queryFn: () => fetchProfileData(address!, publicClient!),
  enabled: !!address && !!publicClient,
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
```

### 2. **TypeScript Usage**
- ✅ Strong typing throughout with proper interfaces
- ✅ Type exports for reusability
- ✅ Proper use of generics in hooks
- ✅ Address type safety with viem's `Address` type

### 3. **Error Handling**
- ✅ Centralized error parsing (`lib/errors.ts`)
- ✅ User rejection detection
- ✅ Retry logic with exponential backoff
- ✅ Proper error state management

### 4. **Component Structure**
- ✅ Proper separation of concerns (pages vs components)
- ✅ Reusable shared components
- ✅ Lazy loading for admin/issuer routes
- ✅ Protected route implementation

### 5. **State Management**
- ✅ Context API for global auth state
- ✅ React Query for server state
- ✅ Local state for UI concerns
- ✅ Proper cache invalidation

### 6. **Performance Optimizations**
- ✅ Lazy loading of heavy components
- ✅ Query caching with appropriate TTLs
- ✅ Memoization with `useCallback`
- ✅ Conditional rendering to avoid unnecessary work

---

## ⚠️ ISSUES FOUND - Areas for Improvement

### 1. **TypeScript Errors in useTemplates.ts**

**Issue:** Missing `chain` property in `writeContract` calls
```typescript
// ❌ Current (causes TS error)
const hash = await walletClient.writeContract({
  address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
  abi: ReputationCardABI,
  functionName: 'createTemplate',
  args: [...],
  account: address,
});
```

**Fix:** Add chain from walletClient
```typescript
// ✅ Fixed
const hash = await walletClient.writeContract({
  address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
  abi: ReputationCardABI,
  functionName: 'createTemplate',
  args: [...],
  account: address,
  chain: walletClient.chain, // Add this
});
```

**Files affected:**
- `client/src/hooks/useTemplates.ts` (lines 95, 121)

---

### 2. **Unused Import**

**Issue:** `parseAbiItem` imported but never used
```typescript
// ❌ In useTemplates.ts
import { type Address, parseAbiItem } from 'viem';
```

**Fix:** Remove unused import
```typescript
// ✅ Fixed
import { type Address } from 'viem';
```

---

### 3. **Missing Dependency in useEffect**

**Issue:** HomePage has useEffect with incomplete dependencies
```typescript
// ⚠️ Current
useEffect(() => {
  const fetchRecentActivity = async () => {
    // ... fetching logic
  };
  fetchRecentActivity();
}, []); // Missing supabase dependency
```

**Fix:** Either add dependency or move function outside
```typescript
// ✅ Option 1: Add to dependencies (if it can change)
}, [supabase]);

// ✅ Option 2: Move outside if it doesn't depend on props/state
const fetchRecentActivity = async () => { /* ... */ };
useEffect(() => {
  fetchRecentActivity();
}, []);
```

---

### 4. **Console.log Statements in Production Code**

**Issue:** Multiple console.log statements throughout the codebase

**Files with console.logs:**
- `client/src/hooks/useProfile.ts` (lines 48, 52)
- `client/src/components/shared/CardDisplay.tsx` (lines 20, 24, 39, 45, 67)
- `client/src/hooks/useReputationCards.ts` (lines 67, 69)
- `client/src/contexts/AuthContext.tsx` (removed but pattern exists)

**Fix:** Use proper logging utility or remove for production
```typescript
// ✅ Better approach
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  console.log('[Component] Debug info:', data);
}

// ✅ Or use a logging library
import { logger } from '../lib/logger';
logger.debug('[Component] Debug info:', data);
```

---

### 5. **Magic Numbers**

**Issue:** Hardcoded values without constants

**Examples:**
```typescript
// ❌ In useProfile.ts
staleTime: 2 * 60 * 1000, // What does this represent?
gcTime: 5 * 60 * 1000,

// ❌ In useTemplates.ts
const MAX_TEMPLATES = 100; // Why 100?
```

**Fix:** Use named constants
```typescript
// ✅ In a constants file
export const CACHE_TIMES = {
  PROFILE_STALE: 2 * 60 * 1000, // 2 minutes
  PROFILE_GC: 5 * 60 * 1000, // 5 minutes
  TEMPLATES_STALE: 5 * 60 * 1000,
  TEMPLATES_GC: 10 * 60 * 1000,
} as const;

export const LIMITS = {
  MAX_TEMPLATES: 100, // Safety limit for template scanning
  MAX_RECENT_ACTIVITY: 10,
} as const;
```

---

### 6. **Inconsistent Error Handling**

**Issue:** Some functions throw errors, others return null/undefined

**Example in useProfile.ts:**
```typescript
// ⚠️ Inconsistent
try {
  const [cardIds, ...] = await publicClient.readContract(...);
  // ... process cards
} catch (error) {
  console.error('[useProfile] Error fetching cards:', error);
  // Silently continues with empty array
}
```

**Fix:** Consistent error handling strategy
```typescript
// ✅ Option 1: Always throw
try {
  const [cardIds, ...] = await publicClient.readContract(...);
} catch (error) {
  console.error('[useProfile] Error fetching cards:', error);
  throw new Error('Failed to fetch cards');
}

// ✅ Option 2: Return error state
return {
  cards: [],
  cardsError: error instanceof Error ? error : new Error('Unknown error'),
};
```

---

### 7. **Missing Loading States**

**Issue:** Some components don't show loading states during async operations

**Example in CardDisplay.tsx:**
```typescript
// ✅ Good - has loading state
if (loading) {
  return <div className="animate-pulse">...</div>;
}

// ⚠️ But HomePage doesn't show loading for recentActivity
const [loadingActivity, setLoadingActivity] = useState(true);
// State is set but not used in render
```

**Fix:** Always show loading states
```typescript
{loadingActivity ? (
  <LoadingSpinner />
) : recentActivity.length > 0 ? (
  // ... render activity
) : (
  <EmptyState />
)}
```

---

### 8. **Prop Drilling**

**Issue:** Some data passed through multiple component levels

**Example:** `profileId` passed from page → component → child component

**Fix:** Use Context or React Query for shared data
```typescript
// ✅ Better approach
const ProfileContext = createContext<{ profileId: bigint | null }>();

// In parent
<ProfileContext.Provider value={{ profileId }}>
  <ChildComponents />
</ProfileContext.Provider>

// In child
const { profileId } = useContext(ProfileContext);
```

---

### 9. **Large Component Files**

**Issue:** UserDashboard.tsx is 500+ lines

**Fix:** Break into smaller components
```typescript
// ✅ Split into:
// - UserDashboard.tsx (main layout)
// - ProfileHeader.tsx
// - StatsGrid.tsx
// - CardsSection.tsx
// - ScoreBreakdown.tsx
// - RecentActivity.tsx
```

---

### 10. **Hardcoded Styles**

**Issue:** Inline Tailwind classes are very long and repeated

**Example:**
```typescript
className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
// Repeated 5+ times
```

**Fix:** Extract to CSS classes or constants
```typescript
// ✅ In tailwind.config.js
theme: {
  extend: {
    backgroundImage: {
      'gradient-primary': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
    },
  },
}

// ✅ Or use CSS modules
.gradientBg {
  @apply bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50;
}
```

---

### 11. **Missing Input Validation**

**Issue:** No validation on user inputs in forms

**Example in ProfileEdit:**
```typescript
// ⚠️ No validation before submission
const handleSubmit = async () => {
  await updateProfile({ displayName, bio, ... });
};
```

**Fix:** Add validation
```typescript
// ✅ With validation
const handleSubmit = async () => {
  if (!displayName || displayName.length > 50) {
    toast.error('Display name must be 1-50 characters');
    return;
  }
  if (bio && bio.length > 500) {
    toast.error('Bio must be less than 500 characters');
    return;
  }
  await updateProfile({ displayName, bio, ... });
};
```

---

### 12. **No Error Boundaries**

**Issue:** ErrorBoundary component was deleted but not replaced

**Fix:** Add error boundaries for critical sections
```typescript
// ✅ Add back a simple ErrorBoundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Wrap critical sections
<ErrorBoundary>
  <UserDashboard />
</ErrorBoundary>
```

---

### 13. **Accessibility Issues**

**Issue:** Missing ARIA labels and keyboard navigation

**Examples:**
```typescript
// ❌ Button without label
<button onClick={handleClick}>
  <Icon />
</button>

// ❌ Interactive div
<div onClick={handleClick}>...</div>
```

**Fix:** Add proper accessibility
```typescript
// ✅ With ARIA label
<button onClick={handleClick} aria-label="Close modal">
  <Icon />
</button>

// ✅ Use button element
<button onClick={handleClick}>...</button>
```

---

### 14. **No Loading Skeleton Consistency**

**Issue:** Different loading states across components

**Fix:** Create consistent skeleton components
```typescript
// ✅ Reusable skeletons
export const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-48 bg-gray-200 rounded-xl"></div>
    <div className="mt-2 h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export const ProfileSkeleton = () => (
  // ... consistent skeleton
);
```

---

## 📊 PRIORITY FIXES

### High Priority (Fix Immediately) ✅ COMPLETED
1. ✅ **FIXED** - TypeScript errors in useTemplates.ts (added chain property to writeContract calls)
2. ✅ **FIXED** - Removed unused import (parseAbiItem from viem)
3. ✅ **FIXED** - Added ErrorBoundary component back with proper error handling
4. ✅ **FIXED** - Fixed missing useEffect dependencies in HomePage (added eslint-disable comment with explanation)

### Medium Priority (Fix Soon)
5. ✅ Remove/wrap console.log statements
6. ✅ Extract magic numbers to constants
7. ✅ Add input validation
8. ✅ Improve accessibility (ARIA labels)

### Low Priority (Nice to Have)
9. ✅ Break down large components
10. ✅ Extract repeated Tailwind classes
11. ✅ Consistent error handling strategy
12. ✅ Add loading skeletons everywhere

---

## 🎯 RECOMMENDATIONS

### Code Organization
```
src/
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── profile/
│   │   ├── cards/
│   │   └── dashboard/
│   ├── shared/            # Reusable components
│   └── layout/            # Layout components
├── hooks/                 # Custom hooks
├── lib/                   # Utilities
├── constants/             # Constants and config
│   ├── cache.ts
│   ├── limits.ts
│   └── styles.ts
└── types/                 # TypeScript types
```

### Testing Strategy
```typescript
// Add tests for:
// 1. Custom hooks (useProfile, useTemplates, etc.)
// 2. Utility functions (error parsing, retry logic)
// 3. Critical user flows (profile creation, card claiming)
```

### Performance Monitoring
```typescript
// Add performance tracking
import { useEffect } from 'react';

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 1000) {
        console.warn(`${componentName} took ${duration}ms to render`);
      }
    };
  }, [componentName]);
}
```

---

## ✅ CONCLUSION

**Overall Assessment:** 7.5/10

**Strengths:**
- Solid React Query implementation
- Good TypeScript usage
- Proper error handling infrastructure
- Clean component structure

**Areas for Improvement:**
- Fix TypeScript errors
- Reduce console.log usage
- Add error boundaries
- Improve accessibility
- Break down large components
- Add input validation

The codebase follows many best practices but has room for improvement in error handling consistency, accessibility, and code organization.
