# Design Document

## Overview

This design document outlines the technical architecture and implementation approach for redesigning the TrustFi V2 platform. The redesign will modernize the user interface with a dark, space-themed aesthetic inspired by contemporary NFT marketplaces while fully supporting the V2 contract architecture (child NFT model, achievement tiers, and user-triggered score recalculation). The design integrates Supabase for off-chain data management, authentication, and real-time notifications.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  (React + TypeScript + Vite + Tailwind CSS)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │    Hooks     │     │
│  │              │  │              │  │              │     │
│  │ - Home       │  │ - Navigation │  │ - useWallet  │     │
│  │ - Dashboard  │  │ - NFT Cards  │  │ - useProfile │     │
│  │ - Profile    │  │ - Modals     │  │ - useNotify  │     │
│  │ - Gallery    │  │ - Forms      │  │ - useContract│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    State Management                          │
│                  (Zustand Stores)                           │
│                                                              │
│  - Wallet Store  - Profile Store  - Notification Store     │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   Blockchain     │  │    Supabase      │  │   External   │
│   (Moonbase)     │  │                  │  │   Services   │
│                  │  │ - Auth (SIWE)    │  │              │
│ - ProfileNFT     │  │ - Database       │  │ - IPFS       │
│ - ReputationCard │  │ - Storage        │  │ - Pinata     │
│ - Contracts      │  │ - Realtime       │  │              │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- React 19.1.1 with TypeScript
- Vite 7.1.7 for build tooling
- Tailwind CSS 3.4.18 for styling
- Wouter 3.7.1 for routing
- Radix UI for accessible components

**State Management:**
- Zustand (to be added) for global state
- React Query (@tanstack/react-query) for server state

**Web3:**
- ethers.js 6.15.0 for blockchain interaction
- @talismn/connect-wallets for Polkadot wallets
- @metamask/detect-provider for EVM wallets

**Backend:**
- Supabase for database, auth, storage, and realtime
- PostgreSQL (via Supabase)
- Row Level Security (RLS) for data protection

**UI Components:**
- Radix UI primitives (already installed)
- Custom components built with Tailwind
- Lucide React for icons

## Components and Interfaces

### Core Layout Components

#### 1. Navigation Component (`components/Navigation.tsx`)

**Purpose:** Primary navigation bar with wallet connection and user menu

**Props:**
```typescript
interface NavigationProps {
  className?: string;
}
```

**Features:**
- TrustFi logo (left)
- Navigation links: Marketplace, Rankings, Connect Wallet
- User avatar/menu when authenticated
- Mobile hamburger menu (< 768px)
- Notification bell with unread count
- Dark theme with purple accent

**State Dependencies:**
- Wallet connection status
- User profile data
- Unread notification count

#### 2. Footer Component (`components/Footer.tsx`)

**Purpose:** Site-wide footer with links and newsletter signup

**Features:**
- TrustFi logo and description
- Explore section (Marketplace, Rankings, Connect Wallet)
- Newsletter subscription form
- Social media icons (Discord, Twitter, GitHub)
- Copyright notice

#### 3. Layout Component (`components/Layout.tsx`)

**Purpose:** Wrapper component providing consistent page structure

**Features:**
- Navigation header
- Main content area
- Footer
- Toast notifications container
- Realtime subscription initialization

### Page Components

#### 1. Home Page (`pages/Home.tsx`)

**Sections:**
1. **Hero Section**
   - Large heading: "Discover Digital Art & Collect NFTs"
   - Subheading explaining TrustFi
   - Primary CTA button: "Create My Profile" or "Explore Collectibles"
   - Featured collectible with countdown timer
   - Background: Space-themed gradient or image

2. **Trending Collection**
   - Horizontal scrollable grid of 4-6 collectible cards
   - Each card shows: image, title, issuer avatar, issuer name
   - "View All" link

3. **Top Creators**
   - Grid of creator/issuer cards (3-4 columns)
   - Each shows: avatar, name, credential count
   - Circular avatars with hover effects

4. **Browse Categories**
   - 4 category cards in grid
   - Categories: Art, Collectibles, Music, Photography (or credential types)
   - Each with icon and count

5. **Notable Drops**
   - Featured upcoming credential releases
   - Countdown timers
   - "Notify Me" buttons

#### 2. Dashboard Page (`pages/Dashboard.tsx`)

**Sections:**
1. **Reputation Score Card**
   - Large display of current score
   - "Recalculate Score" button
   - Score trend indicator
   - Last updated timestamp

2. **Living Profile Preview**
   - Dynamic SVG art from ProfileNFT tokenURI
   - "View Full Profile" link
   - Explanation text about generative art

3. **Recent Credentials Feed**
   - List of recently acquired ReputationCards
   - Each shows: image, title, issuer, date, tier
   - "View All" link to profile

4. **Quick Actions**
   - "Discover Collectibles" button
   - "View My Profile" button
   - "Settings" button

#### 3. Profile Page (`pages/PublicProfile.tsx`)

**Sections:**
1. **Hero Banner**
   - Cover image (from profile or default)
   - Gradient overlay

2. **Profile Header**
   - Avatar (large, centered)
   - Username and display name
   - Bio text
   - Statistics: Reputation Score, Credentials Count, Followers
   - Action buttons: "Activate Profile", "Follow", "Share"

3. **Tabs**
   - Created (for issuers)
   - Owned (credentials)
   - Collections (grouped credentials)

4. **Credentials Grid**
   - Responsive grid (4 cols desktop, 2 tablet, 1 mobile)
   - Filter buttons: All, Credentials, Collectibles
   - Each card shows: image, title, issuer, tier badge

#### 4. Collectibles Gallery (`pages/CollectiblesGallery.tsx`)

**Sections:**
1. **Search and Filter Bar**
   - Search input
   - Category filter dropdown
   - Sort dropdown (Recent, Popular, Ending Soon)

2. **Tabs**
   - NFTs (individual collectibles)
   - Collections (grouped by issuer/type)

3. **Collectibles Grid**
   - Responsive grid layout
   - Each card shows:
     - Image
     - Title
     - Issuer avatar and name
     - Eligibility status badge
     - "Claim Now" or "View Details" button
   - Infinite scroll or pagination

4. **Featured Collectible**
   - "Civic Duty: Active Polkadot Voter" badge
   - Prominent placement
   - Eligibility check display

#### 5. Collectible Detail Page (`pages/CollectibleDetail.tsx`)

**Layout:**
- Left: Large image display
- Right: Details panel
  - Title
  - Issuer info (avatar, name, link)
  - Description
  - Achievement tier badge
  - Score value
  - Countdown timer (if applicable)
  - Eligibility status
  - "Claim Now" button
  - Requirements list
  - Statistics (total claimed, max supply)

**Bottom Section:**
- "More From This Issuer" grid
- Related collectibles

#### 6. Rankings Page (`pages/Rankings.tsx`)

**Sections:**
1. **Header**
   - "Top Creators" heading
   - Time period tabs: Today, This Week, This Month, All Time

2. **Rankings Table**
   - Columns: Rank, User, Change %, Credentials, Reputation Score
   - Each row shows:
     - Rank number
     - Avatar and username
     - Change percentage (green/red)
     - Credential count
     - Reputation score
   - Hover effects
   - Click to view profile

#### 7. Authentication Pages

**Sign Up Page (`pages/SignUp.tsx`):**
- Split layout: image left, form right
- Space-themed background image
- Form fields: Username, Email, Password, Confirm Password
- "Create Account" button
- "Already have an account? Sign In" link

**Connect Wallet Page (`pages/ConnectWallet.tsx`):**
- Split layout: image left, options right
- Wallet provider buttons:
  - Metamask (with icon)
  - WalletConnect (with icon)
  - Coinbase (with icon)
  - Talisman (with icon)
  - Polkadot.js (with icon)
  - SubWallet (with icon)
- Each button shows provider name and icon
- "What is a wallet?" help link

#### 8. Settings Pages

**Profile Settings (`pages/ProfileSettingsPage.tsx`):**
- Tabs: Profile, Application, Security, Activity, Payment Method, API
- Profile tab:
  - Avatar upload
  - Display name input
  - Bio textarea
  - Email input
  - Password change
  - Save button

**Privacy Settings (`pages/PrivacySettingsPage.tsx`):**
- Privacy level toggle: Public / Private
- Explanation text
- Save button

**Integrations Settings (`pages/IntegrationsSettings.tsx`):**
- Litentry section:
  - Description
  - "Link Litentry Account" button (placeholder)
- Kilt section:
  - Description about credential portability
  - Status indicator

#### 9. Issuer Portal Pages

**Issue Credential (`pages/issuer/IssueCredential.tsx`):**
- Form fields:
  - Recipient address input
  - Credential title
  - Description
  - Achievement tier dropdown (5 options with scores)
  - Image upload
  - Metadata JSON editor
- "Issue Credential" button

**Manage Collectibles (`pages/issuer/ManageCollectibles.tsx`):**
- "Create New Collectible" button
- Table of existing collectibles:
  - Columns: Image, Title, Tier, Max Supply, Claimed, Status, Actions
  - Actions: Edit, Pause, Delete

**Create Collectible Form:**
- Title input
- Description textarea
- Achievement tier dropdown
- Max supply input
- Eligibility type dropdown
- Eligibility criteria inputs
- Image upload
- "Create Collectible" button

### Shared Components

#### 1. CollectibleCard (`components/collectibles/CollectibleCard.tsx`)

**Props:**
```typescript
interface CollectibleCardProps {
  id: string;
  image: string;
  title: string;
  issuer: {
    avatar: string;
    name: string;
    address: string;
  };
  tier?: number;
  claimStatus?: 'available' | 'claimed' | 'ineligible';
  onClick?: () => void;
}
```

**Features:**
- Rounded corners (18px)
- Image with aspect ratio 1:1
- Issuer avatar overlay (bottom left)
- Title and issuer name
- Tier badge (if provided)
- Claim status indicator
- Hover effect (scale + shadow)

#### 2. TierBadge (`components/TierBadge.tsx`)

**Props:**
```typescript
interface TierBadgeProps {
  tier: 1 | 2 | 3 | 4 | 5;
  showScore?: boolean;
}
```

**Tier Mapping:**
- Tier 1: "Social Engagement" (10 points) - Light blue
- Tier 2: "Active Participation" (25 points) - Green
- Tier 3: "Significant Contribution" (50 points) - Yellow
- Tier 4: "Outstanding Achievement" (100 points) - Orange
- Tier 5: "Exceptional Leadership" (200 points) - Purple

#### 3. CountdownTimer (`components/CountdownTimer.tsx`)

**Props:**
```typescript
interface CountdownTimerProps {
  endTime: Date;
  onExpire?: () => void;
}
```

**Display:**
- Days : Hours : Minutes : Seconds
- Updates every second
- Styled with monospace font

#### 4. NotificationBell (`components/NotificationBell.tsx`)

**Features:**
- Bell icon
- Badge with unread count
- Dropdown menu on click
- List of recent notifications
- "View All" link
- Mark as read on click

#### 5. WalletButton (`components/WalletButton.tsx`)

**States:**
- Not connected: "Connect Wallet"
- Connecting: "Connecting..." with spinner
- Connected: Shortened address (0x1234...5678)
- Dropdown menu: View Profile, Settings, Disconnect

## Data Models

### Supabase Database Schema

#### profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  profile_nft_id NUMERIC,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private')),
  reputation_score INTEGER DEFAULT 0,
  is_issuer BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_nft_id ON profiles(profile_nft_id);
```

#### notifications Table

```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
```

### TypeScript Interfaces

```typescript
// Profile
interface Profile {
  id: string;
  walletAddress: string;
  profileNftId?: number;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  privacyLevel: 'public' | 'private';
  reputationScore: number;
  isIssuer: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification
interface Notification {
  id: number;
  userId: string;
  type: 'NEW_CREDENTIAL' | 'COLLECTIBLE_AVAILABLE' | 'SCORE_UPDATE' | 'FOLLOW';
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// ReputationCard (from blockchain)
interface ReputationCard {
  tokenId: number;
  profileId: number;
  issuer: string;
  title: string;
  description: string;
  imageUrl: string;
  achievementTier: 1 | 2 | 3 | 4 | 5;
  isCollectible: boolean;
  timestamp: number;
}

// CollectibleTemplate (from blockchain)
interface CollectibleTemplate {
  templateId: number;
  issuer: string;
  title: string;
  description: string;
  imageUrl: string;
  achievementTier: 1 | 2 | 3 | 4 | 5;
  maxSupply: number;
  currentSupply: number;
  eligibilityType: number;
  isActive: boolean;
}

// Wallet State
interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any | null;
  signer: any | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

## Error Handling

### Error Categories

1. **Wallet Errors**
   - User rejected connection
   - Wrong network
   - Wallet not installed
   - Transaction rejected

2. **Contract Errors**
   - Insufficient permissions
   - Invalid parameters
   - Contract reverted
   - Gas estimation failed

3. **API Errors**
   - Network timeout
   - Server error
   - Invalid response
   - Rate limiting

4. **Validation Errors**
   - Invalid input
   - Missing required fields
   - Format errors

### Error Handling Strategy

```typescript
// Custom error types
class WalletError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'WalletError';
  }
}

class ContractError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ContractError';
  }
}

// Error handler utility
function handleError(error: unknown): string {
  if (error instanceof WalletError) {
    return `Wallet Error: ${error.message}`;
  }
  if (error instanceof ContractError) {
    return `Contract Error: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Toast notifications for errors
import { toast } from '@/components/ui/use-toast';

function showError(error: unknown) {
  const message = handleError(error);
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
}
```

## Testing Strategy

### Unit Testing

**Tools:** Vitest (to be added)

**Coverage:**
- Utility functions
- Custom hooks
- State management stores
- Component logic

**Example:**
```typescript
describe('useWallet', () => {
  it('should connect to wallet', async () => {
    const { result } = renderHook(() => useWallet());
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.isConnected).toBe(true);
  });
});
```

### Integration Testing

**Tools:** React Testing Library

**Coverage:**
- User flows (connect wallet → view profile → claim collectible)
- Form submissions
- Navigation
- Authentication

### E2E Testing

**Tools:** Playwright (to be added)

**Coverage:**
- Critical user journeys
- Wallet connection flow
- Credential claiming
- Profile management

### Manual Testing Checklist

- [ ] Wallet connection (all providers)
- [ ] Profile creation and editing
- [ ] Collectible claiming
- [ ] Score recalculation
- [ ] Notification system
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark theme consistency
- [ ] Accessibility (keyboard navigation, screen readers)

## Design System

### Color Palette

```css
/* Dark Theme */
--background: #0D1421;
--background-secondary: #1A202C;
--card-background: #2D3748;
--text-primary: #FFFFFF;
--text-secondary: #A0AEC0;
--text-muted: #718096;

/* Accent Colors */
--primary: #6F4FF2;
--primary-hover: #5A3FD6;
--secondary: #E6007A;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;

/* Borders */
--border: #374151;
--border-light: #4B5563;
```

### Typography

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Space Mono', Menlo, monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing

```css
/* Spacing Scale (Tailwind default) */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1.125rem;  /* 18px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
```

### Component Patterns

#### Button Variants

```typescript
// Primary Button
className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors"

// Secondary Button
className="bg-card-background hover:bg-border-light text-white font-semibold py-3 px-6 rounded-lg transition-colors"

// Outline Button
className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-3 px-6 rounded-lg transition-all"

// Ghost Button
className="text-primary hover:bg-primary/10 font-semibold py-3 px-6 rounded-lg transition-colors"
```

#### Card Pattern

```typescript
className="bg-card-background rounded-xl p-6 border border-border hover:border-border-light transition-colors"
```

#### Input Pattern

```typescript
className="bg-background-secondary border border-border rounded-lg px-4 py-3 text-white placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors"
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/PublicProfile'));
const CollectiblesGallery = lazy(() => import('@/pages/CollectiblesGallery'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Image Optimization

- Use WebP format with fallbacks
- Implement lazy loading for images
- Use appropriate image sizes (responsive)
- Compress images before upload

### Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### Bundle Size Optimization

- Tree shaking (Vite handles this)
- Dynamic imports for large libraries
- Remove unused dependencies
- Use production builds

## Security Considerations

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (privacy_level = 'public');

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

### Input Validation

```typescript
// Zod schemas for validation
import { z } from 'zod';

const profileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

// Validate before submission
function validateProfile(data: unknown) {
  return profileSchema.parse(data);
}
```

### XSS Prevention

- Sanitize user input
- Use React's built-in XSS protection
- Avoid dangerouslySetInnerHTML
- Validate URLs before rendering

### CSRF Protection

- Supabase handles CSRF tokens
- Use secure cookies
- Validate origin headers

## Deployment Strategy

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Blockchain
VITE_CHAIN_ID=1287
VITE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
VITE_PROFILE_NFT_ADDRESS=0x...
VITE_REPUTATION_CARD_ADDRESS=0x...

# IPFS
VITE_PINATA_API_KEY=xxx
VITE_PINATA_SECRET_KEY=xxx
```

### Build Process

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Hosting

- **Platform:** Vercel or Netlify
- **CDN:** Automatic via hosting platform
- **SSL:** Automatic via hosting platform
- **Custom Domain:** trustfi.com

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
```

## Migration Plan

### Phase 1: Foundation (Week 1-2)

1. Set up Supabase project and database
2. Implement authentication (SIWE)
3. Create base layout components
4. Set up routing structure
5. Implement wallet connection

### Phase 2: Core Features (Week 3-4)

1. Build dashboard with score recalculation
2. Implement profile pages
3. Create collectibles gallery
4. Add notification system
5. Build settings pages

### Phase 3: Issuer Portal (Week 5)

1. Create issuer dashboard
2. Implement credential issuance
3. Build collectible management
4. Add analytics

### Phase 4: Polish & Testing (Week 6)

1. Responsive design refinement
2. Accessibility improvements
3. Performance optimization
4. Bug fixes
5. User testing

### Phase 5: Launch (Week 7)

1. Final QA
2. Documentation
3. Deployment
4. Monitoring setup
