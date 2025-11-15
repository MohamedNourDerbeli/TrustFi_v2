# Design Document

## Overview

This design document outlines a systematic approach to auditing and fixing the TrustFi reputation platform. The audit will verify that all smart contract functions work correctly, database operations save and fetch data properly, the UI/UX is user-friendly, and data flows correctly between the blockchain, database, and frontend.

The audit will be conducted in phases:
1. **Smart Contract Audit** - Verify contract functionality and access control
2. **Database Schema and Operations Audit** - Verify data persistence and retrieval
3. **Data Flow Audit** - Verify synchronization between on-chain and off-chain data
4. **Frontend Hooks Audit** - Verify React hooks fetch and manage data correctly
5. **UI/UX Audit** - Verify user interface is intuitive and accessible
6. **Integration Testing** - Verify end-to-end user flows work correctly

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │   Hooks      │  │  Components  │      │
│  │              │  │              │  │              │      │
│  │ - HomePage   │  │ - useAuth    │  │ - WalletBtn  │      │
│  │ - Dashboard  │  │ - useProfile │  │ - ProfileCard│      │
│  │ - Discover   │  │ - useTemplates│ │ - ClaimCard  │      │
│  │ - Admin      │  │ - useRepCards│  │ - Forms      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Wagmi/Viem)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Contract     │  │ React Query  │  │  Supabase    │      │
│  │ Interactions │  │ Cache        │  │  Client      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain & Database                     │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ ProfileNFT   │  │ Supabase DB  │                         │
│  │ Contract     │  │              │                         │
│  │              │  │ - profiles   │                         │
│  │ ReputationCard│ │ - templates  │                         │
│  │ Contract     │  │ - claims_log │                         │
│  │              │  │ - issuers    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Profile Creation Flow**
   - User connects wallet → Frontend calls ProfileNFT.createProfile()
   - Contract emits ProfileCreated event → Frontend listens for event
   - Frontend saves profile metadata to Supabase profiles table
   - Frontend invalidates cache and refetches profile data

2. **Card Claiming Flow**
   - User discovers template → Frontend fetches templates from contract
   - User clicks claim → Frontend calls ReputationCard.claimWithSignature()
   - Contract emits CardIssued event → Frontend listens for event
   - Frontend logs claim to Supabase claims_log table
   - Frontend invalidates cache and refetches profile cards

3. **Template Creation Flow**
   - Issuer fills form → Frontend validates inputs
   - Frontend calls ReputationCard.createTemplate()
   - Contract emits TemplateCreated event → Frontend listens for event
   - Frontend caches template in Supabase templates_cache table
   - Frontend invalidates cache and refetches templates

## Components and Interfaces

### Smart Contract Interfaces

#### ProfileNFT Contract
```solidity
interface IProfileNFT {
    // State-changing functions
    function createProfile(string calldata tokenURI) external returns (uint256);
    function updateProfileMetadata(string calldata newMetadataURI) external;
    function recalculateMyScore() external;
    function setReputationContract(address reputationContract) external;
    function notifyNewCard(uint256 profileId, uint256 cardId) external;
    
    // View functions
    function addressToProfileId(address owner) external view returns (uint256);
    function profileIdToScore(uint256 profileId) external view returns (uint256);
    function getCardsForProfile(uint256 profileId) external view returns (uint256[] memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    
    // Events
    event ProfileCreated(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event ScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event CardAttached(uint256 indexed profileId, uint256 indexed cardId);
}
```

#### ReputationCard Contract
```solidity
interface IReputationCard {
    // State-changing functions
    function createTemplate(
        uint256 templateId,
        address issuer,
        uint256 maxSupply,
        uint8 tier,
        uint256 startTime,
        uint256 endTime
    ) external;
    function setTemplatePaused(uint256 templateId, bool isPaused) external;
    function issueDirect(address recipient, uint256 templateId, string calldata tokenURI) external returns (uint256);
    function claimWithSignature(
        address user,
        address profileOwner,
        uint256 templateId,
        uint256 nonce,
        string calldata tokenURI,
        bytes calldata signature
    ) external returns (uint256);
    
    // View functions
    function templates(uint256 templateId) external view returns (
        address issuer,
        uint256 maxSupply,
        uint256 currentSupply,
        uint8 tier,
        uint256 startTime,
        uint256 endTime,
        bool isPaused
    );
    function hasProfileClaimed(uint256 templateId, uint256 profileId) external view returns (bool);
    function calculateScoreForProfile(uint256 profileId) external view returns (uint256);
    
    // Events
    event TemplateCreated(uint256 indexed templateId, address indexed issuer, uint256 maxSupply, uint8 tier, uint256 startTime, uint256 endTime);
    event CardIssued(uint256 indexed profileId, uint256 indexed cardId, address indexed issuer, uint8 tier);
    event TemplatePaused(uint256 indexed templateId, bool isPaused);
}
```

### Database Schema

#### profiles table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(42) UNIQUE NOT NULL,
  profile_id BIGINT UNIQUE NOT NULL,
  token_uri TEXT NOT NULL,
  display_name VARCHAR(255),
  username VARCHAR(20) UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  twitter_handle VARCHAR(255),
  discord_handle VARCHAR(255),
  website_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### templates_cache table
```sql
CREATE TABLE templates_cache (
  template_id BIGINT PRIMARY KEY,
  issuer VARCHAR(42) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  max_supply BIGINT NOT NULL,
  current_supply BIGINT NOT NULL DEFAULT 0,
  tier SMALLINT NOT NULL CHECK (tier >= 1 AND tier <= 3),
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### claims_log table
```sql
CREATE TABLE claims_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id BIGINT NOT NULL,
  template_id BIGINT NOT NULL,
  card_id BIGINT NOT NULL,
  claim_type VARCHAR(20) NOT NULL CHECK (claim_type IN ('direct', 'signature')),
  claimed_at TIMESTAMP DEFAULT NOW()
);
```

#### issuers table
```sql
CREATE TABLE issuers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL UNIQUE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### collectibles table
```sql
CREATE TABLE collectibles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id INT8 NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  banner_url TEXT,
  token_uri TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('direct', 'signature')),
  requirements JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Frontend Hook Interfaces

#### useAuth Hook
```typescript
interface UseAuthReturn {
  address: Address | undefined;
  isConnected: boolean;
  hasProfile: boolean;
  isAdmin: boolean;
  isIssuer: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### useProfile Hook
```typescript
interface UseProfileReturn {
  profile: Profile | null;
  profileId: bigint | null;
  score: bigint;
  cards: Card[];
  loading: boolean;
  error: Error | null;
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
  checkEligibility: (templateId: bigint, profileId: bigint) => Promise<boolean>;
}
```

#### useReputationCards Hook
```typescript
interface UseReputationCardsReturn {
  issueDirect: (params: IssueDirectParams) => Promise<CardIssuanceResult>;
  claimWithSignature: (params: ClaimWithSignatureParams) => Promise<CardIssuanceResult>;
  isProcessing: boolean;
  error: Error | null;
  retryCount: number;
  clearError: () => void;
}
```

## Audit Methodology

### Phase 1: Smart Contract Audit

**Objective:** Verify all contract functions execute correctly and access control is properly enforced.

**Approach:**
1. Review ProfileNFT contract code for logic errors
2. Review ReputationCard contract code for logic errors
3. Test profile creation with various inputs
4. Test card issuance (direct and signature-based)
5. Test template creation and management
6. Test access control (admin and issuer roles)
7. Verify soulbound behavior (non-transferability)
8. Check event emissions for all state changes

**Success Criteria:**
- All contract functions execute without reverting unexpectedly
- Access control prevents unauthorized operations
- Events are emitted correctly for all state changes
- Soulbound tokens cannot be transferred
- Score calculation is accurate

### Phase 2: Database Operations Audit

**Objective:** Verify all database operations save and fetch data correctly.

**Approach:**
1. Test profile creation saves to profiles table
2. Test card claims log to claims_log table
3. Test template caching in templates_cache table
4. Test issuer management in issuers table
5. Verify foreign key relationships
6. Check data consistency across tables
7. Test Row Level Security policies
8. Verify indexes are used for queries

**Success Criteria:**
- Profile data is saved correctly after creation
- Claims are logged with correct profile_id, template_id, card_id
- Templates are cached with all required fields
- Issuers table reflects current on-chain roles
- Queries execute efficiently with proper indexes
- RLS policies prevent unauthorized access

### Phase 3: Data Flow Audit

**Objective:** Verify data synchronization between blockchain and database.

**Approach:**
1. Test profile creation flow (contract → database)
2. Test card claiming flow (contract → database)
3. Test template creation flow (contract → database)
4. Test score recalculation (contract → UI)
5. Verify event listeners capture all events
6. Check cache invalidation after mutations
7. Test optimistic updates and rollbacks
8. Verify data consistency after page refresh

**Success Criteria:**
- On-chain events trigger database updates
- UI reflects latest data after mutations
- Cache is invalidated appropriately
- No stale data is displayed
- Data remains consistent across sessions

### Phase 4: Frontend Hooks Audit

**Objective:** Verify React hooks fetch and manage data correctly.

**Approach:**
1. Test useAuth hook with different wallet states
2. Test useProfile hook data fetching
3. Test useTemplates hook filtering and caching
4. Test useReputationCards hook transaction handling
5. Test useCollectibles hook data enrichment
6. Verify error handling in all hooks
7. Check loading states are managed correctly
8. Test cache invalidation and refetching

**Success Criteria:**
- Hooks return correct data for all states
- Loading states are accurate
- Errors are caught and exposed
- Cache is managed efficiently
- Refetch functions work correctly

### Phase 5: UI/UX Audit

**Objective:** Verify user interface is intuitive, accessible, and user-friendly.

**Approach:**
1. Test navigation and routing
2. Verify form validation and error messages
3. Check loading states and feedback
4. Test mobile responsiveness
5. Verify accessibility (keyboard navigation, screen readers)
6. Check color contrast and readability
7. Test transaction feedback and notifications
8. Verify consistent design patterns

**Success Criteria:**
- Navigation is intuitive and consistent
- Forms validate input and show helpful errors
- Loading states are clear and informative
- Mobile layout is usable
- Accessibility standards are met
- Notifications provide clear feedback
- Design is consistent across pages

### Phase 6: Integration Testing

**Objective:** Verify end-to-end user flows work correctly.

**Approach:**
1. Test new user onboarding (connect wallet → create profile)
2. Test card discovery and claiming
3. Test profile editing and customization
4. Test issuer template creation and card issuance
5. Test admin issuer management
6. Test claim link generation and usage
7. Verify error recovery flows
8. Test concurrent operations

**Success Criteria:**
- Complete user flows work without errors
- Error states are handled gracefully
- Users can recover from errors
- Concurrent operations don't cause conflicts
- All features are accessible and functional

## Error Handling

### Contract Error Handling

**Strategy:** Parse contract revert reasons and map to user-friendly messages.

**Implementation:**
```typescript
function parseContractError(error: any): { message: string; code: string } {
  // Check for common revert reasons
  if (error.message.includes('Profile exists')) {
    return { message: 'You already have a profile', code: 'PROFILE_EXISTS' };
  }
  if (error.message.includes('Already claimed')) {
    return { message: 'You have already claimed this card', code: 'ALREADY_CLAIMED' };
  }
  if (error.message.includes('Max supply')) {
    return { message: 'This template has reached maximum supply', code: 'MAX_SUPPLY' };
  }
  // ... more error mappings
  return { message: 'Transaction failed. Please try again.', code: 'UNKNOWN' };
}
```

### Database Error Handling

**Strategy:** Catch database errors and provide fallback behavior.

**Implementation:**
```typescript
async function saveProfile(profileData: ProfileData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData);
    
    if (error) {
      console.error('Database error:', error);
      // Retry logic or fallback
      throw new Error('Failed to save profile. Please try again.');
    }
    
    return data;
  } catch (err) {
    // Log to error tracking service
    console.error('Unexpected error:', err);
    throw err;
  }
}
```

### Network Error Handling

**Strategy:** Implement retry logic with exponential backoff.

**Implementation:**
```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Testing Strategy

### Unit Testing
- Test individual hooks with mocked dependencies
- Test utility functions (error parsing, signature generation)
- Test form validation logic
- Test data transformation functions

### Integration Testing
- Test complete user flows (profile creation, card claiming)
- Test admin and issuer workflows
- Test error recovery scenarios
- Test concurrent operations

### Manual Testing
- Test on different browsers (Chrome, Firefox, Safari)
- Test on different devices (desktop, tablet, mobile)
- Test with different wallet providers (MetaMask, WalletConnect)
- Test accessibility with screen readers

## Performance Optimization

### Caching Strategy
- Use React Query for contract read calls (5-minute stale time)
- Cache profile data (2-minute stale time)
- Cache templates (5-minute stale time)
- Implement optimistic updates for mutations

### Code Splitting
- Lazy load admin portal components
- Lazy load issuer portal components
- Lazy load heavy libraries (QR code, image upload)

### Image Optimization
- Lazy load images below the fold
- Use responsive images with srcset
- Compress images before upload to IPFS
- Use CDN for static assets

## Security Considerations

### Smart Contract Security
- Verify access control on all privileged functions
- Ensure soulbound tokens cannot be transferred
- Validate all inputs before state changes
- Use SafeMath for arithmetic operations (built into Solidity 0.8+)

### Frontend Security
- Never expose private keys or sensitive data
- Validate all user inputs before submission
- Use EIP712 for typed data signatures
- Sanitize data before database insertion

### Database Security
- Use Row Level Security policies
- Never expose service role key in client
- Validate foreign key relationships
- Use prepared statements to prevent SQL injection

## Deployment Considerations

### Environment Variables
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_PROFILE_NFT_ADDRESS=<deployed-profile-nft-address>
VITE_REPUTATION_CARD_ADDRESS=<deployed-reputation-card-address>
VITE_PINATA_API_KEY=<pinata-api-key>
VITE_PINATA_SECRET_KEY=<pinata-secret-key>
```

### Build Configuration
- Enable production optimizations
- Configure code splitting
- Set up CDN for static assets
- Enable gzip compression

### Monitoring
- Set up error tracking (Sentry)
- Monitor transaction success rates
- Track page load times
- Monitor database query performance

## Conclusion

This design provides a comprehensive approach to auditing and fixing the TrustFi platform. By systematically verifying each component and data flow, we can ensure the system works correctly, data is properly synchronized, and the user experience is intuitive and reliable.
