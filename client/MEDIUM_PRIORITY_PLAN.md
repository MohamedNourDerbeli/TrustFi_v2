# Medium Priority Fixes - Action Plan

## Overview
Now that all critical issues are resolved, these medium-priority improvements will enhance code quality, maintainability, and production readiness.

---

## 1. Remove/Wrap Console.log Statements 🔴 HIGH IMPACT

### Why This Matters
- **Security:** Console logs can expose sensitive data in production
- **Performance:** Excessive logging impacts performance
- **Professionalism:** Production apps shouldn't have debug logs

### Files Affected (7 files)
1. `client/src/hooks/useProfile.ts` - Lines 48, 52
2. `client/src/components/shared/CardDisplay.tsx` - Lines 20, 24, 39, 45, 67
3. `client/src/hooks/useReputationCards.ts` - Lines 67, 69
4. `client/src/hooks/useTemplates.ts` - Line 46
5. `client/src/contexts/AuthContext.tsx` - Multiple locations
6. `client/src/pages/HomePage.tsx` - Lines 57, 60
7. `client/src/pages/UserDashboard.tsx` - Line 36

### Solution Options

**Option A: Create Logger Utility (Recommended)**
```typescript
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => isDev && console.log('[DEBUG]', ...args),
  info: (...args: any[]) => isDev && console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};
```

**Option B: Remove All (Quick Fix)**
- Simply delete all console.log statements
- Keep console.error for actual errors

### Estimated Time: 30 minutes

---

## 2. Extract Magic Numbers to Constants 🟡 MEDIUM IMPACT

### Why This Matters
- **Maintainability:** Change values in one place
- **Readability:** Named constants are self-documenting
- **Consistency:** Ensures same values used everywhere

### Files Affected (4 files)
1. `client/src/hooks/useProfile.ts` - Cache times (2min, 5min)
2. `client/src/hooks/useTemplates.ts` - Cache times (5min, 10min), MAX_TEMPLATES (100)
3. `client/src/hooks/useCollectibles.ts` - Cache times (2min, 5min)
4. `client/src/contexts/AuthContext.tsx` - Cache TTL (60s)

### Solution

**Create Constants File:**
```typescript
// lib/constants.ts

// React Query Cache Times (in milliseconds)
export const CACHE_TIMES = {
  PROFILE_STALE: 2 * 60 * 1000, // 2 minutes
  PROFILE_GC: 5 * 60 * 1000, // 5 minutes
  TEMPLATES_STALE: 5 * 60 * 1000, // 5 minutes
  TEMPLATES_GC: 10 * 60 * 1000, // 10 minutes
  COLLECTIBLES_STALE: 2 * 60 * 1000, // 2 minutes
  COLLECTIBLES_GC: 5 * 60 * 1000, // 5 minutes
  AUTH_CACHE_TTL: 60 * 1000, // 1 minute
} as const;

// Query Limits
export const LIMITS = {
  MAX_TEMPLATES: 100, // Safety limit for template scanning
  MAX_RECENT_ACTIVITY: 10, // Recent activity items to fetch
  MAX_RECENT_CLAIMS: 5, // Recent claims on homepage
} as const;

// Validation Limits
export const VALIDATION = {
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 50,
  BIO_MAX: 500,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
} as const;
```

### Estimated Time: 20 minutes

---

## 3. Add Input Validation 🟡 MEDIUM IMPACT

### Why This Matters
- **Data Integrity:** Prevent invalid data from being submitted
- **User Experience:** Immediate feedback on errors
- **Security:** Prevent malicious inputs

### Files Affected (3 files)
1. `client/src/components/user/ProfileEdit.tsx`
2. `client/src/components/user/CreateProfile.tsx`
3. `client/src/components/admin/CreateTemplate.tsx`

### Solution

**Create Validation Utility:**
```typescript
// lib/validation.ts
import { VALIDATION } from './constants';

export const validateDisplayName = (name: string): string | null => {
  if (!name || name.trim().length < VALIDATION.DISPLAY_NAME_MIN) {
    return 'Display name is required';
  }
  if (name.length > VALIDATION.DISPLAY_NAME_MAX) {
    return `Display name must be ${VALIDATION.DISPLAY_NAME_MAX} characters or less`;
  }
  return null;
};

export const validateBio = (bio: string): string | null => {
  if (bio && bio.length > VALIDATION.BIO_MAX) {
    return `Bio must be ${VALIDATION.BIO_MAX} characters or less`;
  }
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return null; // Optional field
  
  if (username.length < VALIDATION.USERNAME_MIN) {
    return `Username must be at least ${VALIDATION.USERNAME_MIN} characters`;
  }
  if (username.length > VALIDATION.USERNAME_MAX) {
    return `Username must be ${VALIDATION.USERNAME_MAX} characters or less`;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};
```

### Estimated Time: 45 minutes

---

## 4. Improve Accessibility (ARIA Labels) 🟢 LOW-MEDIUM IMPACT

### Why This Matters
- **Compliance:** WCAG 2.1 accessibility standards
- **Inclusivity:** Better experience for users with disabilities
- **SEO:** Better semantic HTML improves search rankings

### Files Affected (Multiple)
- All button components without text
- All interactive divs
- All form inputs without labels
- All icon-only buttons

### Common Issues

**Issue 1: Icon-only buttons**
```typescript
// ❌ Bad
<button onClick={handleClose}>
  <X />
</button>

// ✅ Good
<button onClick={handleClose} aria-label="Close modal">
  <X />
</button>
```

**Issue 2: Interactive divs**
```typescript
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

**Issue 3: Form inputs without labels**
```typescript
// ❌ Bad
<input type="text" placeholder="Search..." />

// ✅ Good
<label htmlFor="search" className="sr-only">Search</label>
<input id="search" type="text" placeholder="Search..." />
```

### Estimated Time: 1-2 hours

---

## Recommended Order

### Phase 1: Quick Wins (1 hour)
1. ✅ Create logger utility
2. ✅ Replace all console.log with logger
3. ✅ Create constants file
4. ✅ Replace magic numbers with constants

### Phase 2: Quality Improvements (1.5 hours)
5. ✅ Create validation utilities
6. ✅ Add validation to ProfileEdit
7. ✅ Add validation to CreateProfile
8. ✅ Add validation to CreateTemplate

### Phase 3: Accessibility (2 hours)
9. ✅ Add ARIA labels to icon buttons
10. ✅ Replace interactive divs with buttons
11. ✅ Add labels to form inputs
12. ✅ Test with screen reader

---

## Total Estimated Time: 4-5 hours

---

## Which Should We Start With?

I recommend starting with **Phase 1: Quick Wins** because:
- ✅ Immediate production benefits
- ✅ Low effort, high impact
- ✅ Sets foundation for other improvements
- ✅ Can be completed in ~1 hour

**Shall we start with creating the logger utility and removing console.logs?**
