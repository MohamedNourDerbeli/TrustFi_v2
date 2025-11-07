# Design Document

## Overview

This design document outlines the technical approach for implementing comprehensive user experience improvements to the TrustFi Reputation Platform. The improvements focus on enhancing user onboarding, providing better feedback mechanisms, improving the reputation card gallery experience, and creating a more polished, professional interface.

The design leverages React's component architecture, custom hooks for state management, and TailwindCSS for styling. All improvements will be implemented incrementally to maintain system stability while progressively enhancing the user experience.

### Key Design Principles

1. **Progressive Enhancement**: Build features that work for all users while providing enhanced experiences where supported
2. **Feedback-First**: Every user action should receive immediate visual feedback
3. **Error Recovery**: Users should always have a clear path forward when errors occur
4. **Accessibility**: All interactive elements must be keyboard navigable and screen reader friendly
5. **Performance**: Animations and transitions should be smooth (60fps) without blocking the main thread

## Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header (with Navigation)
│   ├── Main Content Area
│   └── Footer
├── Pages
│   ├── HomePage (with WalletConnect & Onboarding)
│   ├── DashboardPage (enhanced with stats)
│   ├── ProfilePage (with edit capabilities)
│   ├── ExplorePage (gallery view)
│   └── AnalyticsPage (charts and insights)
├── Shared Components
│   ├── Toast Notification System
│   ├── Modal System
│   ├── Loading States (Skeletons, Spinners)
│   ├── Empty States
│   ├── Error Boundaries
│   ├── Tooltip Component
│   └── Confirmation Dialog
└── Reputation Card Components
    ├── CardGallery (grid layout with filters)
    ├── CardItem (individual card display)
    ├── CardDetail (expanded view modal)
    ├── CardFilters (search and filter controls)
    └── CardShare (sharing functionality)
```

### State Management Strategy

The application will use a combination of:
- **React Context** for global UI state (toasts, modals, onboarding progress)
- **Custom Hooks** for blockchain interactions and data fetching
- **Local Component State** for UI-specific state (form inputs, toggles)
- **URL State** for shareable views (filters, card details)

## Components and Interfaces

### 1. Toast Notification System

**Purpose**: Provide non-intrusive feedback for user actions and system events

**Component Structure**:
```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}
```

**Implementation Details**:
- Toast container positioned fixed at top-right of viewport
- Maximum 3 toasts visible simultaneously
- Auto-dismiss after 5 seconds (configurable)
- Slide-in animation from right
- Stack vertically with 8px gap
- Include transaction hash links for blockchain operations

### 2. Loading States

**Skeleton Loaders**:
- Profile skeleton: Mimics profile card layout with animated gradient
- Card skeleton: Matches reputation card dimensions
- List skeleton: For transaction history and activity feeds

**Spinner Component**:
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}
```

**Transaction Progress Indicator**:
```typescript
interface TransactionProgressProps {
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  confirmations?: number;
  requiredConfirmations?: number;
  txHash?: string;
  estimatedTime?: number;
}
```

### 3. Modal System

**Base Modal Component**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}
```

**Specialized Modals**:
- **WelcomeModal**: First-time user onboarding
- **CardDetailModal**: Expanded reputation card view
- **ConfirmationModal**: Destructive action confirmations
- **ShareModal**: Card sharing options

**Features**:
- Focus trap within modal
- Escape key to close
- Backdrop blur effect
- Scale and fade animations
- Scroll lock on body when open

### 4. Onboarding System

**Onboarding Flow**:
```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  hasCompletedOnboarding: boolean;
}
```

**Implementation**:
- Store completion status in localStorage
- Spotlight effect on target elements
- Overlay with cutout for highlighted element
- Skip option available at any step
- Progress indicator showing step count

### 5. Reputation Card Gallery

**CardGallery Component**:
```typescript
interface CardGalleryProps {
  cards: ReputationCard[];
  loading: boolean;
  onCardClick: (card: ReputationCard) => void;
  viewMode?: 'grid' | 'list';
}
```

**Features**:
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Staggered fade-in animation on load
- Hover effects (elevation, scale)
- Empty state when no cards
- Skeleton loaders during fetch

**CardItem Component**:
```typescript
interface CardItemProps {
  card: ReputationCard;
  onClick: () => void;
  isNew?: boolean;
  showVerificationBadge?: boolean;
}
```

**Visual Design**:
- Card-style with rounded corners and shadow
- Gradient background based on card type/rarity
- Issuer logo in top-left corner
- Verification badge in top-right
- Card title and description
- Points value prominently displayed
- Issuance date at bottom

### 6. Card Filtering and Search

**CardFilters Component**:
```typescript
interface CardFiltersProps {
  onSearchChange: (query: string) => void;
  onIssuerFilter: (issuer: string | null) => void;
  onTypeFilter: (type: string | null) => void;
  onSortChange: (sort: SortOption) => void;
  availableIssuers: string[];
  availableTypes: string[];
  resultCount: number;
}

type SortOption = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc' | 'name-asc';
```

**Implementation**:
- Debounced search input (300ms)
- Multi-select dropdown for issuers
- Single-select for card type
- Sort dropdown with icons
- Clear all filters button
- Active filter chips with remove option

### 7. Card Sharing

**ShareModal Component**:
```typescript
interface ShareModalProps {
  card: ReputationCard;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareOptions {
  copyLink: () => Promise<void>;
  generateQR: () => string;
  exportJSON: () => void;
  shareToSocial?: (platform: 'twitter' | 'linkedin') => void;
}
```

**Shareable Link Format**:
```
https://trustfi.app/card/{chainId}/{contractAddress}/{cardId}
```

**Verification Page**:
- Public view of card details
- Blockchain verification status
- Issuer information
- No wallet connection required
- Link to platform to create own profile

### 8. Empty States

**EmptyState Component**:
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string;
}
```

**Contexts**:
- No reputation cards yet
- No search results
- No profiles in explore
- No transaction history
- No analytics data

### 9. Error Handling

**Error Boundary**:
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}
```

**Error Display Component**:
```typescript
interface ErrorDisplayProps {
  error: string;
  type: 'inline' | 'toast' | 'page';
  retry?: () => void;
  troubleshooting?: string[];
}
```

**Error Categories**:
- **Wallet Errors**: Connection failed, wrong network, rejected transaction
- **Contract Errors**: Insufficient gas, contract call failed, unauthorized
- **Network Errors**: RPC timeout, network unavailable
- **Validation Errors**: Invalid input, missing required fields

### 10. Tooltip System

**Tooltip Component**:
```typescript
interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}
```

**Implementation**:
- Portal rendering for proper z-index
- Smart positioning (flip if near viewport edge)
- 500ms delay before showing
- Fade in animation
- Arrow pointing to target element

### 11. Transaction History

**TransactionHistory Component**:
```typescript
interface Transaction {
  id: string;
  type: 'profile_created' | 'profile_updated' | 'card_received' | 'card_shared';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  details: Record<string, any>;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
  onTransactionClick: (tx: Transaction) => void;
  filters?: {
    type?: string[];
    dateRange?: [Date, Date];
  };
}
```

**Features**:
- Chronological list with newest first
- Status indicators (pending spinner, success checkmark, error icon)
- Click to view details in modal
- Link to blockchain explorer
- Filter by type and date range
- Infinite scroll or pagination

### 12. Analytics Dashboard

**AnalyticsCharts Component**:
```typescript
interface AnalyticsData {
  totalCards: number;
  totalPoints: number;
  cardsByType: Record<string, number>;
  cardsByIssuer: Record<string, number>;
  cardsOverTime: Array<{ date: string; count: number }>;
  percentileRank?: number;
}
```

**Chart Types**:
- **Donut Chart**: Cards by type distribution
- **Bar Chart**: Cards by issuer
- **Line Chart**: Card acquisition timeline
- **Stat Cards**: Total cards, points, rank

**Implementation**:
- Use lightweight chart library (Chart.js or Recharts)
- Responsive sizing
- Animated on scroll into view
- Export data as CSV option
- Empty state when no data

## Data Models

### Enhanced ReputationCard

```typescript
interface ReputationCard {
  cardId: string;
  profileId: number;
  category: string;
  description: string;
  value: number;
  issuer: string;
  issuerName?: string;
  issuerLogo?: string;
  issuedAt: number;
  txHash: string;
  verified: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  metadata?: {
    imageUrl?: string;
    externalUrl?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}
```

### UI State Models

```typescript
interface UIState {
  toasts: Toast[];
  modals: {
    welcome: boolean;
    cardDetail: { isOpen: boolean; cardId?: string };
    confirmation: { isOpen: boolean; config?: ConfirmationConfig };
  };
  onboarding: OnboardingState;
  filters: {
    search: string;
    issuer: string | null;
    type: string | null;
    sort: SortOption;
  };
}

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}
```

## Error Handling

### Error Handling Strategy

**Levels of Error Handling**:

1. **Component Level**: Try-catch in async functions, display inline errors
2. **Hook Level**: Catch errors in custom hooks, update error state
3. **Boundary Level**: Error boundaries catch rendering errors
4. **Global Level**: Unhandled promise rejections logged and displayed

**Error Recovery Patterns**:

```typescript
// Retry with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**User-Friendly Error Messages**:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  'user rejected transaction': 'Transaction was cancelled. No changes were made.',
  'insufficient funds': 'Insufficient ETH for gas fees. Please add funds to your wallet.',
  'network error': 'Network connection issue. Please check your internet and try again.',
  'contract not deployed': 'Smart contract not found. Please ensure you\'re on the correct network.',
  'unauthorized': 'You don\'t have permission to perform this action.',
};
```

### Network Error Handling

**Network Mismatch Detection**:
```typescript
interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

async function detectNetworkMismatch(): Promise<boolean> {
  const walletChainId = await getWalletChainId();
  const expectedChainId = getExpectedChainId();
  return walletChainId !== expectedChainId;
}

async function promptNetworkSwitch(network: NetworkConfig): Promise<boolean> {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    // Handle error
    return false;
  }
}
```

## Testing Strategy

### Unit Testing

**Components to Test**:
- Toast notification system
- Modal behavior (open, close, focus trap)
- Card filtering logic
- Search debouncing
- Error message formatting
- Tooltip positioning

**Testing Tools**:
- Jest for test runner
- React Testing Library for component testing
- Mock Service Worker for API mocking

**Example Test**:
```typescript
describe('CardGallery', () => {
  it('displays skeleton loaders while loading', () => {
    render(<CardGallery cards={[]} loading={true} />);
    expect(screen.getAllByTestId('card-skeleton')).toHaveLength(6);
  });

  it('displays empty state when no cards', () => {
    render(<CardGallery cards={[]} loading={false} />);
    expect(screen.getByText(/no reputation cards/i)).toBeInTheDocument();
  });

  it('filters cards by search query', async () => {
    const cards = [
      { id: '1', category: 'Developer', ... },
      { id: '2', category: 'Designer', ... },
    ];
    render(<CardGallery cards={cards} loading={false} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'Developer');
    
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.queryByText('Designer')).not.toBeInTheDocument();
  });
});
```

### Integration Testing

**Flows to Test**:
- Complete onboarding flow
- Card issuance and display
- Profile creation and update
- Error recovery scenarios
- Transaction submission and confirmation

### Accessibility Testing

**Requirements**:
- All interactive elements keyboard accessible
- Proper ARIA labels and roles
- Focus indicators visible
- Color contrast meets WCAG AA standards
- Screen reader announcements for dynamic content

**Testing Tools**:
- axe-core for automated accessibility testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA/JAWS)

### Performance Testing

**Metrics to Monitor**:
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1
- Animation frame rate 60fps

**Optimization Strategies**:
- Code splitting by route
- Lazy loading for modals and heavy components
- Image optimization and lazy loading
- Debouncing and throttling for expensive operations
- Memoization for expensive calculations

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

1. Toast notification system
2. Modal system with focus management
3. Error boundary implementation
4. Loading state components (skeletons, spinners)
5. Base tooltip component

### Phase 2: User Feedback (Immediate Response)

1. Transaction progress indicators
2. Button loading states
3. Form validation and inline errors
4. Success/error toast integration
5. Optimistic UI updates

### Phase 3: Onboarding (First Impressions)

1. Welcome modal for new users
2. Guided tour system
3. Empty states for all sections
4. Help documentation integration
5. Onboarding progress tracking

### Phase 4: Card Gallery (Core Feature)

1. Enhanced card display components
2. Grid layout with responsive design
3. Card hover effects and animations
4. Card detail modal
5. Verification badge display

### Phase 5: Filtering & Search (Discovery)

1. Search functionality with debouncing
2. Filter dropdowns (issuer, type)
3. Sort options
4. Active filter display
5. Clear filters functionality

### Phase 6: Sharing & Verification (Social Proof)

1. Share modal with options
2. Shareable link generation
3. QR code generation
4. Public verification page
5. Export to JSON

### Phase 7: Analytics (Insights)

1. Statistics calculation
2. Chart components
3. Timeline visualization
4. Percentile ranking
5. Export functionality

### Phase 8: Polish (Final Touches)

1. Animations and transitions
2. Mobile responsiveness
3. Keyboard navigation
4. Accessibility improvements
5. Performance optimization

## Technical Considerations

### Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum versions: Last 2 major versions
- Polyfills for Web3 APIs if needed
- Graceful degradation for older browsers

### Mobile Considerations

- Touch-friendly tap targets (minimum 44x44px)
- Swipe gestures for card navigation
- Responsive breakpoints: 640px, 768px, 1024px, 1280px
- Mobile-optimized modals (full screen)
- Reduced animations on low-power devices

### Performance Budget

- Initial bundle size: < 200KB gzipped
- Route chunks: < 50KB each
- Images: WebP format, lazy loaded
- Fonts: Subset and preload
- Third-party scripts: Defer or async load

### Security Considerations

- Sanitize user input to prevent XSS
- Validate all data from blockchain
- Secure localStorage usage (no sensitive data)
- HTTPS only for production
- Content Security Policy headers

### Accessibility Standards

- WCAG 2.1 Level AA compliance
- Semantic HTML elements
- Proper heading hierarchy
- Alt text for all images
- Keyboard navigation support
- Screen reader compatibility
- Focus management in modals
- Color contrast ratios
- Text resizing support

## Design System

### Color Palette

```typescript
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827',
  },
};
```

### Typography

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

### Spacing

```typescript
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
};
```

### Animation Timings

```typescript
const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

## Conclusion

This design provides a comprehensive blueprint for enhancing the TrustFi platform's user experience. The modular component architecture allows for incremental implementation while maintaining system stability. Each component is designed with reusability, accessibility, and performance in mind.

The phased implementation approach ensures that the most impactful improvements (feedback systems and loading states) are delivered first, followed by feature enhancements (card gallery, filtering) and polish (animations, analytics).

All design decisions prioritize user needs while respecting technical constraints of blockchain interactions, ensuring a smooth and professional experience throughout the platform.
