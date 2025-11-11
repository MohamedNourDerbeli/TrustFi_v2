# Loading State Components

This directory contains reusable loading skeleton components for consistent loading states across the application.

## Components

### PageLoadingSkeleton

Full-page loading skeleton with variants for different page types.

**Usage:**
```tsx
import { PageLoadingSkeleton } from '@/components/skeletons';

// Dashboard variant (default)
<PageLoadingSkeleton variant="dashboard" />

// Issuer page variant
<PageLoadingSkeleton variant="issuer" />

// Admin page variant
<PageLoadingSkeleton variant="admin" />
```

**Props:**
- `variant?: 'dashboard' | 'issuer' | 'admin'` - Page layout variant (default: 'dashboard')

### CardLoadingSkeleton

Loading skeleton for credential and collectible cards.

**Usage:**
```tsx
import { CardLoadingSkeleton } from '@/components/skeletons';

// Grid layout with 3 credential cards (default)
<CardLoadingSkeleton count={3} layout="grid" variant="credential" />

// List layout with collectible cards
<CardLoadingSkeleton count={5} layout="list" variant="collectible" />
```

**Props:**
- `count?: number` - Number of skeleton cards to display (default: 3)
- `layout?: 'grid' | 'list'` - Layout style (default: 'grid')
- `variant?: 'credential' | 'collectible'` - Card type (default: 'credential')

### InlineLoader

Compact inline loading indicator with optional message.

**Usage:**
```tsx
import { InlineLoader } from '@/components/skeletons';

// Small loader with message
<InlineLoader size="sm" message="Loading..." />

// Medium loader (default)
<InlineLoader size="md" message="Fetching credentials..." />

// Large loader without message
<InlineLoader size="lg" />
```

**Props:**
- `message?: string` - Optional loading message
- `size?: 'sm' | 'md' | 'lg'` - Loader size (default: 'md')
- `className?: string` - Additional CSS classes

## Design Principles

1. **Consistency**: All skeletons use the same base `Skeleton` component from `@/components/ui/skeleton`
2. **Accessibility**: Loading states are visually clear and maintain proper spacing
3. **Performance**: Lightweight components that render quickly
4. **Flexibility**: Variants and props allow customization for different use cases

## Requirements Satisfied

- **Requirement 1.1**: Loading indicators displayed during contract fetching
- **Requirement 1.2**: Clear visual feedback while data loads
