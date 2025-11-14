# Design Document

## Overview

This design document outlines the architecture and implementation approach for the TrustFi core user flow and admin portal. The system is built on a three-tier architecture:

1. **Smart Contract Layer**: Solidity contracts deployed on Moonbase Alpha (EVM-compatible Polkadot parachain)
2. **Backend Services Layer**: Supabase for off-chain data storage and serverless functions for metadata generation
3. **Frontend Layer**: React + TypeScript application using Vite, wagmi for Web3 interactions, and Tailwind CSS for styling

The design leverages existing smart contracts (ProfileNFT and ReputationCard) and extends the frontend to provide complete user and admin experiences. The system follows a wallet-first authentication model where users authenticate via Web3 wallet connection, and all on-chain operations are signed transactions.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Portal  │  │ Issuer Portal│  │ Admin Portal │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  wagmi + viem   │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐        ┌─────────▼─────────┐
    │  Smart Contracts  │        │     Supabase      │
    │  ┌─────────────┐  │        │  ┌─────────────┐  │
    │  │ ProfileNFT  │  │        │  │  profiles   │  │
    │  └─────────────┘  │        │  └─────────────┘  │
    │  ┌─────────────┐  │        │  ┌─────────────┐  │
    │  │ReputationCard│ │        │  │  templates  │  │
    │  └─────────────┘  │        │  └─────────────┘  │
    └───────────────────┘        │  ┌─────────────┐  │
    Moonbase Alpha (1287)        │  │   claims    │  │
                                 │  └─────────────┘  │
                                 └───────────────────┘
```

### Component Interaction Flow

**User Profile Creation Flow:**
```
User → Connect Wallet → Check Supabase → No Profile Found
  → Display Create Profile Form → User Submits
  → Call ProfileNFT.createProfile() → Transaction Confirmed
  → Read ProfileCreated Event → Extract tokenId
  → Store in Supabase → Display Success
```

**Card Claiming Flow (Signature-Based):**
```
Issuer → Generate Claim Link → Sign EIP712 Message
  → Share Link → User Opens Link → Connect Wallet
  → Parse URL Parameters → Display Template Info
  → User Clicks Claim → Call ReputationCard.claimWithSignature()
  → Transaction Confirmed → Card Attached to Profile
  → Update UI with New Card
```

**Admin Template Creation Flow:**
```
Admin → Navigate to Admin Portal → Verify Role
  → Fill Template Form → Submit
  → Call ReputationCard.createTemplate()
  → Transaction Confirmed → Template Available
  → Issuers Can Now Use Template
```

**Profile Customization Flow:**
```
User → Navigate to Profile Settings → Click Edit Profile
  → Select Avatar Image File from Device → Validate File (type, size)
  → Upload to Pinata IPFS → Receive IPFS URL
  → Select Banner Image File from Device → Validate File (type, size)
  → Upload to Pinata IPFS → Receive IPFS URL
  → Fill Display Name, Bio, Social Links
  → Submit Form → Store IPFS URLs + Metadata in Supabase
  → Success → Profile View Shows Avatar/Banner Images
```

## Components and Interfaces

### Frontend Components Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── WalletConnect.tsx          # Wallet connection button and modal
│   │   └── AuthGuard.tsx              # Route protection based on wallet connection
│   ├── user/
│   │   ├── CreateProfile.tsx          # Profile creation form (existing)
│   │   ├── ProfileView.tsx            # Display profile, score, and cards
│   │   ├── ProfileEdit.tsx            # Edit profile (avatar, banner, bio, socials)
│   │   ├── AvatarUpload.tsx           # Avatar image upload component
│   │   ├── BannerUpload.tsx           # Banner image upload component
│   │   ├── ScoreRecalculate.tsx       # Button to recalculate score
│   │   ├── DiscoverCollectibles.tsx   # Browse available templates
│   │   └── ClaimCard.tsx              # Claim card interface (existing stub)
│   ├── issuer/
│   │   ├── IssuerDashboard.tsx        # Issuer analytics and overview
│   │   ├── TemplateList.tsx           # List issuer's templates
│   │   ├── IssueCardForm.tsx          # Direct issuance form
│   │   └── ClaimLinkGenerator.tsx     # Generate signed claim links
│   ├── admin/
│   │   ├── AdminDashboard.tsx         # Platform-wide analytics
│   │   ├── CreateTemplate.tsx         # Template creation form
│   │   ├── IssuerManagement.tsx       # Grant/revoke issuer roles
│   │   └── TemplateManagement.tsx     # Pause/unpause templates
│   └── shared/
│       ├── Card.tsx                   # Reusable card component
│       ├── Button.tsx                 # Styled button component
│       ├── LoadingSpinner.tsx         # Loading state indicator
│       └── ErrorMessage.tsx           # Error display component
├── pages/
│   ├── HomePage.tsx                   # Landing page
│   ├── UserDashboard.tsx              # User main dashboard
│   ├── IssuerPortal.tsx               # Issuer main page
│   ├── AdminPortal.tsx                # Admin main page
│   └── PublicClaimPage.tsx            # Public claim link landing
├── hooks/
│   ├── useProfile.ts                  # Profile data and operations
│   ├── useReputationCards.ts          # Card operations
│   ├── useTemplates.ts                # Template queries
│   ├── useAuth.ts                     # Authentication state
│   └── useRole.ts                     # Role checking (admin/issuer)
├── lib/
│   ├── wagmi.ts                       # wagmi configuration (existing)
│   ├── contracts.ts                   # Contract addresses (existing)
│   ├── contractsInstance.ts           # Contract getters (existing)
│   ├── supabase.ts                    # Supabase client (existing)
│   ├── pinata.ts                      # IPFS uploads (existing)
│   └── signature.ts                   # EIP712 signing utilities
└── types/
    ├── profile.ts                     # Profile type definitions
    ├── template.ts                    # Template type definitions
    └── card.ts                        # Card type definitions
```

### Image Upload Components Design

#### AvatarUpload Component
```typescript
interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadComplete: (ipfsUrl: string) => void;
  onError: (error: Error) => void;
}

// Features:
// - Drag & drop or click to select file
// - Image preview before upload
// - File validation (max 5MB, image formats only)
// - Upload progress indicator
// - Crop/resize functionality (optional)
// - Circular preview matching final display
```

#### BannerUpload Component
```typescript
interface BannerUploadProps {
  currentBannerUrl?: string;
  onUploadComplete: (ipfsUrl: string) => void;
  onError: (error: Error) => void;
}

// Features:
// - Drag & drop or click to select file
// - Image preview before upload
// - File validation (max 10MB, image formats only)
// - Upload progress indicator
// - Aspect ratio guidance (recommended 3:1)
// - Rectangle preview matching final display
```

### Key React Hooks Design

#### useProfile Hook
```typescript
interface UseProfileReturn {
  profile: Profile | null;
  profileId: bigint | null;
  score: bigint;
  cards: Card[];
  loading: boolean;
  error: Error | null;
  createProfile: (tokenURI: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  uploadBanner: (file: File) => Promise<string>;
  recalculateScore: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### useTemplates Hook
```typescript
interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: Error | null;
  createTemplate: (params: CreateTemplateParams) => Promise<void>;
  pauseTemplate: (templateId: bigint, isPaused: boolean) => Promise<void>;
  refreshTemplates: () => Promise<void>;
}
```

#### useAuth Hook
```typescript
interface UseAuthReturn {
  address: Address | undefined;
  isConnected: boolean;
  hasProfile: boolean;
  isAdmin: boolean;
  isIssuer: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

### Smart Contract Interfaces (Already Implemented)

The smart contracts are already deployed and functional. The frontend will interact with them via the following key functions:

**ProfileNFT Contract:**
- `createProfile(string tokenURI)` - Create new profile
- `recalculateMyScore()` - Recalculate reputation score
- `addressToProfileId(address)` - Get profile ID for address
- `profileIdToScore(uint256)` - Get score for profile
- `getCardsForProfile(uint256)` - Get all cards for profile
- `setReputationContract(address)` - Admin only: set reputation contract

**ReputationCard Contract:**
- `createTemplate(...)` - Admin only: create new template
- `issueDirect(address, uint256, string)` - Issuer: direct card issuance
- `claimWithSignature(...)` - User: claim with signature
- `setTemplatePaused(uint256, bool)` - Admin/Issuer: pause template
- `calculateScoreForProfile(uint256)` - Calculate total score
- `templates(uint256)` - Get template details
- `hasProfileClaimed(uint256, uint256)` - Check if claimed

## Data Models

### Supabase Database Schema

#### profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(42) UNIQUE NOT NULL,
  profile_id BIGINT UNIQUE NOT NULL,
  token_uri TEXT NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  twitter_handle VARCHAR(255),
  discord_handle VARCHAR(255),
  website_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles(wallet);
CREATE INDEX idx_profiles_profile_id ON profiles(profile_id);
```

#### templates_cache Table (Optional - for faster queries)
```sql
CREATE TABLE templates_cache (
  template_id BIGINT PRIMARY KEY,
  issuer VARCHAR(42) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  max_supply BIGINT,
  current_supply BIGINT,
  tier SMALLINT,
  start_time BIGINT,
  end_time BIGINT,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_issuer ON templates_cache(issuer);
```

#### claims_log Table (Optional - for analytics)
```sql
CREATE TABLE claims_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id BIGINT NOT NULL,
  template_id BIGINT NOT NULL,
  card_id BIGINT NOT NULL,
  claim_type VARCHAR(20) NOT NULL, -- 'direct' or 'signature'
  claimed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_claims_profile ON claims_log(profile_id);
CREATE INDEX idx_claims_template ON claims_log(template_id);
```

### TypeScript Type Definitions

```typescript
// types/profile.ts
export interface Profile {
  id: string;
  wallet: Address;
  profileId: bigint;
  tokenUri: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  twitterHandle?: string;
  discordHandle?: string;
  websiteUrl?: string;
  score: bigint;
  cards: Card[];
  createdAt: Date;
}

// types/template.ts
export interface Template {
  templateId: bigint;
  issuer: Address;
  name: string;
  description: string;
  maxSupply: bigint;
  currentSupply: bigint;
  tier: number;
  startTime: bigint;
  endTime: bigint;
  isPaused: boolean;
}

// types/card.ts
export interface Card {
  cardId: bigint;
  templateId: bigint;
  profileId: bigint;
  tokenUri: string;
  tier: number;
  issuer: Address;
  claimedAt: Date;
}

// types/claim.ts
export interface ClaimSignature {
  user: Address;
  profileOwner: Address;
  templateId: bigint;
  nonce: bigint;
  signature: Hex;
}
```

## Error Handling

### Error Categories and Handling Strategy

#### 1. Wallet Connection Errors
- **No wallet detected**: Display message to install MetaMask or compatible wallet
- **Wrong network**: Prompt user to switch to Moonbase Alpha (chain ID 1287)
- **User rejected connection**: Display friendly message, allow retry

#### 2. Transaction Errors
- **Insufficient gas**: Display estimated gas cost, suggest adding DEV tokens
- **Transaction reverted**: Parse revert reason, display user-friendly message
- **User rejected transaction**: Allow retry without error state
- **Network timeout**: Implement retry mechanism with exponential backoff

#### 3. Smart Contract Validation Errors
- **Profile already exists**: Redirect to profile view
- **No profile found**: Redirect to profile creation
- **Already claimed**: Display message, show existing card
- **Template paused**: Display message, disable claim button
- **Invalid signature**: Display error, suggest requesting new link
- **Unauthorized**: Display permission error, explain required role

#### 4. Database Errors
- **Supabase connection failed**: Retry with exponential backoff, fallback to on-chain only
- **Insert conflict**: Handle gracefully, sync with on-chain state
- **Query timeout**: Display loading state, implement timeout handling

### Error Display Component

```typescript
interface ErrorMessageProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Displays user-friendly error messages with optional retry
```

### Error Parsing Utility

```typescript
// lib/errors.ts
export function parseContractError(error: unknown): string {
  // Parse common contract errors into user-friendly messages
  if (error.message.includes('Profile exists')) {
    return 'You already have a profile. Redirecting...';
  }
  if (error.message.includes('Only issuer')) {
    return 'You do not have permission to issue cards from this template.';
  }
  // ... more error mappings
  return 'An unexpected error occurred. Please try again.';
}
```

## Testing Strategy

### Unit Testing

**Components to Test:**
- All custom hooks (useProfile, useTemplates, useAuth, useRole)
- Utility functions (signature generation, error parsing)
- Form validation logic
- Data transformation functions

**Testing Framework:** Vitest + React Testing Library

**Example Test Cases:**
```typescript
describe('useProfile', () => {
  it('should fetch profile data when wallet is connected', async () => {
    // Test implementation
  });
  
  it('should handle profile creation successfully', async () => {
    // Test implementation
  });
  
  it('should handle profile creation error gracefully', async () => {
    // Test implementation
  });
});
```

### Integration Testing

**Scenarios to Test:**
1. Complete user flow: Connect wallet → Create profile → View profile
2. Card claiming flow: Generate link → Open link → Claim card
3. Admin flow: Create template → Issue card → Verify card attached
4. Error scenarios: Wrong network, insufficient gas, invalid signature

**Testing Approach:**
- Use testnet (Moonbase Alpha) for integration tests
- Mock Supabase responses for predictable testing
- Test with multiple wallet states (connected, disconnected, wrong network)

### End-to-End Testing

**Critical User Journeys:**
1. New user onboarding (wallet connection → profile creation)
2. Existing user returning (wallet connection → profile load)
3. Issuer creating and distributing cards
4. Admin managing templates and issuers

**Testing Tools:** Playwright or Cypress for E2E tests

### Smart Contract Testing

**Note:** Smart contracts are already deployed. Testing focuses on:
- Verifying contract interactions from frontend
- Testing edge cases in transaction handling
- Validating event parsing and state updates

## Security Considerations

### Frontend Security

1. **Input Validation**
   - Validate all user inputs before sending to smart contracts
   - Sanitize token URIs to prevent XSS
   - Validate addresses using viem's `isAddress()` function

2. **Signature Security**
   - Use EIP712 typed data for all signatures
   - Include nonce to prevent replay attacks
   - Verify signature on-chain before minting
   - Never expose private keys in frontend code

3. **Role-Based Access Control**
   - Verify roles on-chain, not just in UI
   - Hide admin/issuer UI elements from unauthorized users
   - Always check permissions before contract calls

4. **Transaction Security**
   - Display transaction details before signing
   - Implement transaction confirmation UI
   - Show gas estimates to users
   - Handle transaction failures gracefully

### Data Security

1. **Supabase Security**
   - Use Row Level Security (RLS) policies
   - Limit API access with proper authentication
   - Store only non-sensitive data off-chain
   - Never store private keys or signatures

2. **IPFS/Pinata Security**
   - Validate uploaded content
   - Implement file size limits
   - Use content addressing for integrity
   - Pin important metadata permanently

### Smart Contract Security

**Note:** Contracts are already deployed. Security considerations:
- Contracts use OpenZeppelin libraries (audited)
- Access control via AccessControl pattern
- Soulbound tokens prevent unauthorized transfers
- EIP712 signatures prevent replay attacks

## Performance Optimization

### Frontend Performance

1. **Code Splitting**
   - Lazy load admin and issuer portals
   - Split routes for faster initial load
   - Use dynamic imports for heavy components

2. **State Management**
   - Use React Query for caching contract reads
   - Implement optimistic updates for better UX
   - Cache Supabase queries with appropriate TTL

3. **Bundle Optimization**
   - Tree-shake unused dependencies
   - Minimize bundle size with Vite optimization
   - Use production builds for deployment

### Blockchain Interaction Optimization

1. **Batch Reads**
   - Use multicall for reading multiple contract values
   - Cache frequently accessed data (templates, scores)
   - Implement pagination for large lists

2. **Transaction Optimization**
   - Estimate gas before transactions
   - Use appropriate gas limits
   - Implement transaction queuing for multiple operations

3. **Event Listening**
   - Use WebSocket for real-time updates
   - Filter events by relevant addresses
   - Implement event caching to reduce RPC calls

### Database Optimization

1. **Query Optimization**
   - Index frequently queried columns
   - Use prepared statements
   - Implement query result caching

2. **Data Synchronization**
   - Sync on-chain data to Supabase periodically
   - Use event listeners for real-time sync
   - Implement conflict resolution for concurrent updates

## Deployment Strategy

### Frontend Deployment

**Platform:** Vercel or Netlify

**Environment Variables:**
```
VITE_PROFILE_NFT_ADDRESS=0x...
VITE_REPUTATION_CARD_ADDRESS=0x...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_PINATA_API_KEY=...
VITE_PINATA_SECRET_KEY=...
```

**Build Process:**
1. Run `npm run build` to create production bundle
2. Deploy to Vercel/Netlify with environment variables
3. Configure custom domain (app.trustfi.com)
4. Enable HTTPS and CDN

### Database Deployment

**Platform:** Supabase Cloud

**Setup Steps:**
1. Create Supabase project
2. Run migration scripts to create tables
3. Configure Row Level Security policies
4. Set up database backups
5. Configure API rate limits

### Monitoring and Analytics

1. **Error Tracking**
   - Integrate Sentry for error monitoring
   - Track transaction failures
   - Monitor API errors

2. **Usage Analytics**
   - Track user actions (profile creation, card claims)
   - Monitor gas usage patterns
   - Analyze template popularity

3. **Performance Monitoring**
   - Track page load times
   - Monitor transaction confirmation times
   - Measure API response times

## Future Enhancements

### Phase 2: Kusama Bounty Integration
- On-chain SVG generation contract
- Dynamic profile visualization
- Living profile collectibles

### Phase 3: Hyperbridge Integration
- Cross-chain data queries
- Polkadot OpenGov voter badges
- Automated whitelist management

### Phase 4: Advanced Features
- Multi-chain support
- Credential revocation
- Reputation decay mechanisms
- Social features (profile sharing, leaderboards)

## Conclusion

This design provides a comprehensive blueprint for implementing the TrustFi core user flow and admin portal. The architecture leverages existing smart contracts while building a robust, user-friendly frontend with proper error handling, security measures, and performance optimizations. The modular component structure allows for incremental development and easy maintenance, while the testing strategy ensures reliability and quality.
