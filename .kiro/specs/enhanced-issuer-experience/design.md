# Design Document: Enhanced Issuer Experience

## Overview

This document outlines the technical design for implementing a dual-mode minting system in the TrustFi Reputation Platform. The enhancement introduces two distinct minting approaches: **Direct Minting** (issuer-controlled) and **Collectible Minting** (user-initiated). This design maintains backward compatibility with the existing reputation card system while adding flexible distribution mechanisms that enable new use cases such as event badges, achievement unlocks, and community rewards.

The implementation spans both smart contract modifications and frontend enhancements, ensuring a seamless experience for issuers creating cards and users claiming collectibles.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Issuer       │  │ Collectibles │  │ User         │     │
│  │ Dashboard    │  │ Gallery      │  │ Dashboard    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Smart Contract Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ReputationCard Contract (Enhanced)           │  │
│  │  ┌────────────────┐    ┌──────────────────────┐     │  │
│  │  │ Direct Minting │    │ Collectible Minting  │     │  │
│  │  │ (Existing)     │    │ (New)                │     │  │
│  │  └────────────────┘    └──────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ProfileNFT Contract                     │  │
│  │              (No changes required)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Direct Minting Flow (Existing + Enhanced):**
```
Issuer → Issuer Dashboard → issueCard() → ReputationCard Contract → Mint to Recipient
```

**Collectible Minting Flow (New):**
```
Issuer → Create Collectible → createCollectible() → Store Metadata
User → Browse Collectibles → Check Eligibility → claimCollectible() → Mint to Self
```

## Components and Interfaces

### 1. Smart Contract Enhancements

#### 1.1 ReputationCard Contract Extensions

**New Data Structures:**

```solidity
// Collectible card template
struct CollectibleTemplate {
    uint256 templateId;
    string category;
    string description;
    uint256 value;
    address issuer;
    uint256 maxSupply;        // 0 = unlimited
    uint256 currentSupply;
    uint256 startTime;        // 0 = immediate
    uint256 endTime;          // 0 = no expiration
    EligibilityType eligibilityType;
    bytes eligibilityData;    // Flexible data for eligibility criteria
    bool isPaused;
    bool isActive;
    string metadataURI;       // IPFS or other URI for rich metadata
    uint8 rarityTier;         // 0-4 (common, uncommon, rare, epic, legendary)
}

enum EligibilityType {
    OPEN,              // Anyone can claim
    WHITELIST,         // Only whitelisted addresses
    TOKEN_HOLDER,      // Must hold specific token
    PROFILE_REQUIRED   // Must have TrustFi profile
}

enum MintingMode {
    DIRECT,            // Issuer mints to recipient
    COLLECTIBLE        // User mints to self
}

// Track which users have claimed which collectibles
mapping(uint256 => mapping(address => bool)) private _collectibleClaims;

// Store collectible templates
mapping(uint256 => CollectibleTemplate) private _collectibleTemplates;
uint256 private _nextTemplateId = 1;

// Track minting mode for each card
mapping(uint256 => MintingMode) private _cardMintingMode;

// Whitelist management for collectibles
mapping(uint256 => mapping(address => bool)) private _collectibleWhitelist;
```

**New Functions:**

```solidity
// Create a new collectible template
function createCollectible(
    string memory category,
    string memory description,
    uint256 value,
    uint256 maxSupply,
    uint256 startTime,
    uint256 endTime,
    EligibilityType eligibilityType,
    bytes memory eligibilityData,
    string memory metadataURI,
    uint8 rarityTier
) external returns (uint256 templateId);

// Claim a collectible (user-initiated minting)
function claimCollectible(uint256 templateId) external returns (uint256 cardId);

// Check if user is eligible to claim
function isEligibleToClaim(uint256 templateId, address user) public view returns (bool);

// Check if user has already claimed
function hasClaimedCollectible(uint256 templateId, address user) public view returns (bool);

// Get collectible template details
function getCollectibleTemplate(uint256 templateId) external view returns (CollectibleTemplate memory);

// Get all active collectibles
function getActiveCollectibles() external view returns (uint256[] memory);

// Pause/unpause collectible claiming
function pauseCollectible(uint256 templateId) external;
function resumeCollectible(uint256 templateId) external;

// Update collectible metadata (only before first claim)
function updateCollectibleMetadata(
    uint256 templateId,
    string memory category,
    string memory description,
    string memory metadataURI
) external;

// Add addresses to whitelist
function addToWhitelist(uint256 templateId, address[] memory addresses) external;

// Remove addresses from whitelist
function removeFromWhitelist(uint256 templateId, address[] memory addresses) external;

// Get claim statistics
function getClaimStats(uint256 templateId) external view returns (
    uint256 totalClaims,
    uint256 remainingSupply,
    bool isActive
);

// Revoke specific collectible token
function revokeCollectibleToken(uint256 cardId) external;
```

**Events:**

```solidity
event CollectibleCreated(
    uint256 indexed templateId,
    address indexed issuer,
    string category,
    uint256 maxSupply,
    EligibilityType eligibilityType
);

event CollectibleClaimed(
    uint256 indexed templateId,
    uint256 indexed cardId,
    address indexed claimer,
    uint256 timestamp
);

event CollectiblePaused(uint256 indexed templateId, address indexed issuer);
event CollectibleResumed(uint256 indexed templateId, address indexed issuer);
event CollectibleMetadataUpdated(uint256 indexed templateId);
event WhitelistUpdated(uint256 indexed templateId, uint256 addressCount);
```

#### 1.2 Eligibility Verification Logic

The eligibility verification will support multiple criteria types:

**OPEN Access:**
- No restrictions, any user can claim
- Only requires active TrustFi profile (optional)

**WHITELIST Access:**
- `eligibilityData` contains merkle root or direct address list
- Verify user address is in whitelist

**TOKEN_HOLDER Access:**
- `eligibilityData` contains token contract address and minimum balance
- Verify user holds required tokens using ERC20/ERC721 interface

**PROFILE_REQUIRED Access:**
- Verify user has active TrustFi profile
- Optional: minimum reputation score requirement in `eligibilityData`

### 2. Frontend Components

#### 2.1 Issuer Dashboard Enhancements

**New Components:**

**`CollectibleCreationForm.tsx`**
- Form for creating new collectible templates
- Minting mode selector (Direct vs Collectible)
- Supply limit configuration
- Time-based availability settings
- Eligibility criteria builder
- Rarity tier selector
- Metadata upload (image, description)
- Preview mode before publishing

**`CollectibleManagementPanel.tsx`**
- List of created collectibles
- Pause/resume controls
- Claim statistics display
- Whitelist management interface
- Edit metadata (if no claims yet)
- Analytics dashboard for each collectible

**`MintingModeSelector.tsx`**
- Radio button or toggle for Direct vs Collectible
- Explanatory text for each mode
- Visual indicators showing differences

**Interface:**
```typescript
interface CollectibleTemplate {
  templateId: number;
  category: string;
  description: string;
  value: number;
  issuer: string;
  maxSupply: number;
  currentSupply: number;
  startTime: number;
  endTime: number;
  eligibilityType: 'OPEN' | 'WHITELIST' | 'TOKEN_HOLDER' | 'PROFILE_REQUIRED';
  eligibilityData: string;
  isPaused: boolean;
  isActive: boolean;
  metadataURI: string;
  rarityTier: number;
}

interface CollectibleFormData {
  category: string;
  description: string;
  value: number;
  maxSupply: number;
  startTime?: Date;
  endTime?: Date;
  eligibilityType: string;
  eligibilityConfig: {
    whitelist?: string[];
    tokenAddress?: string;
    minBalance?: number;
    minReputationScore?: number;
  };
  image?: File;
  rarityTier: number;
}
```

#### 2.2 User-Facing Collectibles Components

**`CollectiblesGalleryPage.tsx`**
- Grid display of available collectibles
- Filter by category, rarity, eligibility
- Sort by popularity, expiration, supply
- Visual indicators for:
  - Eligibility status (eligible/not eligible)
  - Already claimed
  - Supply remaining
  - Time remaining
  - Trending/popular badges

**`CollectibleCard.tsx`**
- Card preview component
- Displays key information:
  - Image/icon
  - Title and description
  - Rarity tier (with visual styling)
  - Supply status (X/Y claimed)
  - Eligibility indicator
  - Claim button (if eligible)
  - Time remaining (if applicable)
- Hover effects and animations
- Click to view details

**`CollectibleDetailModal.tsx`**
- Full collectible information
- Eligibility requirements display
- Claim button with gas estimate
- Issuer information
- Blockchain verification details
- Share functionality
- Claim history/statistics

**`ClaimConfirmationModal.tsx`**
- Transaction summary
- Gas cost estimate (ETH + USD)
- Confirm/cancel buttons
- Transaction progress indicator
- Success celebration animation

**Interface:**
```typescript
interface CollectibleCardProps {
  template: CollectibleTemplate;
  isEligible: boolean;
  hasClaimed: boolean;
  onClaim: (templateId: number) => Promise<void>;
}

interface ClaimStatus {
  templateId: number;
  isEligible: boolean;
  hasClaimed: boolean;
  remainingSupply: number;
  isActive: boolean;
  canClaimNow: boolean;
  reason?: string; // Why user can't claim
}
```

#### 2.3 Shared Components

**`MintingModeBadge.tsx`**
- Visual badge showing "Awarded" or "Claimed"
- Used in card displays throughout the app
- Consistent styling

**`RarityIndicator.tsx`**
- Visual representation of rarity tier
- Color-coded borders/backgrounds
- Rarity label (Common, Rare, etc.)

**`SupplyIndicator.tsx`**
- Progress bar showing claimed/total
- Percentage display
- "Limited Edition" badge for low supply

**`EligibilityChecker.tsx`**
- Reusable component for checking eligibility
- Displays requirements
- Shows user's status for each requirement
- Visual checkmarks/X marks

### 3. Services and Hooks

#### 3.1 Contract Service Extensions

**`contractService.ts` additions:**

```typescript
// Create collectible template
async function createCollectible(
  collectibleData: CollectibleFormData,
  signer: ethers.Signer
): Promise<{ templateId: number; txHash: string }>;

// Claim collectible
async function claimCollectible(
  templateId: number,
  signer: ethers.Signer
): Promise<{ cardId: number; txHash: string }>;

// Check eligibility
async function checkEligibility(
  templateId: number,
  userAddress: string
): Promise<ClaimStatus>;

// Get all collectibles
async function getActiveCollectibles(): Promise<CollectibleTemplate[]>;

// Get collectible details
async function getCollectibleTemplate(
  templateId: number
): Promise<CollectibleTemplate>;

// Pause/resume collectible
async function pauseCollectible(
  templateId: number,
  signer: ethers.Signer
): Promise<string>;

async function resumeCollectible(
  templateId: number,
  signer: ethers.Signer
): Promise<string>;

// Get claim statistics
async function getClaimStats(
  templateId: number
): Promise<{
  totalClaims: number;
  remainingSupply: number;
  isActive: boolean;
}>;

// Estimate gas for claiming
async function estimateClaimGas(
  templateId: number,
  userAddress: string
): Promise<{ gasLimit: bigint; gasCost: string; gasCostUSD: string }>;
```

#### 3.2 Custom Hooks

**`useCollectibles.ts`**
```typescript
interface UseCollectiblesReturn {
  collectibles: CollectibleTemplate[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  filterByCategory: (category: string) => void;
  filterByEligibility: (eligible: boolean) => void;
  sortBy: (field: 'popularity' | 'expiration' | 'supply') => void;
}

function useCollectibles(): UseCollectiblesReturn;
```

**`useClaimStatus.ts`**
```typescript
interface UseClaimStatusReturn {
  claimStatus: Map<number, ClaimStatus>;
  checkEligibility: (templateId: number) => Promise<ClaimStatus>;
  refreshStatus: (templateId: number) => Promise<void>;
  loading: boolean;
}

function useClaimStatus(
  templateIds: number[],
  userAddress?: string
): UseClaimStatusReturn;
```

**`useCollectibleClaim.ts`**
```typescript
interface UseCollectibleClaimReturn {
  claim: (templateId: number) => Promise<void>;
  claiming: boolean;
  error: Error | null;
  txHash: string | null;
  gasEstimate: { eth: string; usd: string } | null;
  estimateGas: (templateId: number) => Promise<void>;
}

function useCollectibleClaim(): UseCollectibleClaimReturn;
```

**`useIssuerCollectibles.ts`**
```typescript
interface UseIssuerCollectiblesReturn {
  collectibles: CollectibleTemplate[];
  createCollectible: (data: CollectibleFormData) => Promise<number>;
  pauseCollectible: (templateId: number) => Promise<void>;
  resumeCollectible: (templateId: number) => Promise<void>;
  updateMetadata: (templateId: number, data: Partial<CollectibleFormData>) => Promise<void>;
  getAnalytics: (templateId: number) => Promise<CollectibleAnalytics>;
  loading: boolean;
  error: Error | null;
}

function useIssuerCollectibles(): UseIssuerCollectiblesReturn;
```

## Data Models

### Database/Storage Schema

Since the platform uses blockchain as the source of truth, we'll use local storage and indexing for performance:

**IndexedDB Schema for Caching:**

```typescript
// Collectibles cache
interface CollectibleCache {
  templateId: number;
  data: CollectibleTemplate;
  lastUpdated: number;
  claimCount: number;
}

// User claim status cache
interface ClaimStatusCache {
  userAddress: string;
  templateId: number;
  isEligible: boolean;
  hasClaimed: boolean;
  lastChecked: number;
}

// Trending collectibles
interface TrendingCache {
  templateId: number;
  claimVelocity: number; // Claims per hour
  lastUpdated: number;
}
```

### Type Definitions

**`types/collectible.ts`**
```typescript
export enum EligibilityType {
  OPEN = 'OPEN',
  WHITELIST = 'WHITELIST',
  TOKEN_HOLDER = 'TOKEN_HOLDER',
  PROFILE_REQUIRED = 'PROFILE_REQUIRED'
}

export enum RarityTier {
  COMMON = 0,
  UNCOMMON = 1,
  RARE = 2,
  EPIC = 3,
  LEGENDARY = 4
}

export interface CollectibleMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface CollectibleAnalytics {
  templateId: number;
  totalClaims: number;
  uniqueClaimers: string[];
  claimTimeline: Array<{
    timestamp: number;
    claimer: string;
    txHash: string;
  }>;
  supplyPercentage: number;
  averageClaimTime: number;
}
```

## Error Handling

### Smart Contract Errors

```solidity
error CollectibleNotFound();
error CollectibleNotActive();
error CollectiblePaused();
error ClaimPeriodNotStarted();
error ClaimPeriodEnded();
error MaxSupplyReached();
error AlreadyClaimed();
error NotEligible();
error UnauthorizedIssuer();
error CannotEditAfterClaims();
error InvalidEligibilityData();
error InvalidTimeRange();
```

### Frontend Error Handling

**Error Categories:**

1. **Eligibility Errors**
   - Not eligible (show requirements)
   - Already claimed (show owned card)
   - Profile required (prompt to create)

2. **Timing Errors**
   - Not started yet (show start time)
   - Expired (show alternative collectibles)

3. **Supply Errors**
   - Sold out (show similar collectibles)

4. **Transaction Errors**
   - Insufficient gas (show required amount)
   - User rejected (allow retry)
   - Network error (suggest retry)

**Error Display Strategy:**
- Toast notifications for transaction errors
- Inline messages for eligibility issues
- Modal dialogs for critical errors
- Helpful suggestions for resolution

## Testing Strategy

### Smart Contract Testing

**Unit Tests:**
- Test collectible creation with various configurations
- Test eligibility verification for each type
- Test claim functionality with different scenarios
- Test supply limits and time restrictions
- Test pause/resume functionality
- Test whitelist management
- Test metadata updates
- Test revocation functionality

**Integration Tests:**
- Test interaction between ReputationCard and ProfileNFT
- Test reputation score updates after collectible claims
- Test issuer authorization flow
- Test end-to-end claim flow

**Edge Cases:**
- Claiming at exact start/end time
- Claiming when supply is exactly 1 remaining
- Multiple users claiming simultaneously
- Pausing during active claims
- Revoking issuer with active collectibles

### Frontend Testing

**Component Tests:**
- CollectibleCard rendering with different states
- CollectibleCreationForm validation
- ClaimConfirmationModal flow
- Eligibility indicator display
- Filter and sort functionality

**Integration Tests:**
- Complete claim flow from gallery to success
- Collectible creation flow from form to blockchain
- Eligibility checking across different types
- Real-time updates during claiming

**E2E Tests:**
- Issuer creates collectible → User claims → Card appears in collection
- User browses collectibles → Filters by eligibility → Claims eligible card
- Issuer pauses collectible → User cannot claim → Issuer resumes → User claims

### Performance Testing

- Load testing with 1000+ collectibles
- Concurrent claim attempts
- Gas optimization verification
- Frontend rendering performance with large lists

## Security Considerations

### Smart Contract Security

1. **Reentrancy Protection**
   - Use OpenZeppelin's ReentrancyGuard for claim function
   - Checks-Effects-Interactions pattern

2. **Access Control**
   - Only authorized issuers can create collectibles
   - Only issuer can pause/resume their collectibles
   - Only issuer or owner can revoke tokens

3. **Input Validation**
   - Validate all string lengths
   - Validate numeric ranges (supply, value, time)
   - Validate eligibility data format

4. **Supply Management**
   - Atomic increment of currentSupply
   - Check supply before minting
   - Prevent overflow

5. **Time Validation**
   - Ensure startTime < endTime
   - Use block.timestamp consistently
   - Handle edge cases at boundaries

### Frontend Security

1. **Wallet Security**
   - Never request private keys
   - Validate all user inputs
   - Display transaction details before signing

2. **Data Validation**
   - Validate eligibility data before submission
   - Sanitize user inputs
   - Verify contract responses

3. **Rate Limiting**
   - Prevent spam claiming attempts
   - Throttle eligibility checks
   - Cache results appropriately

## Migration and Deployment Strategy

### Phase 1: Smart Contract Deployment

1. Deploy updated ReputationCard contract to testnet
2. Run comprehensive test suite
3. Conduct security audit
4. Deploy to mainnet
5. Authorize contract in ProfileNFT

### Phase 2: Frontend Deployment

1. Deploy issuer dashboard enhancements
2. Enable collectible creation for authorized issuers
3. Deploy collectibles gallery (beta)
4. Gather feedback and iterate
5. Full public release

### Phase 3: Migration

1. Existing direct minting continues to work unchanged
2. Issuers can opt-in to collectible minting
3. No migration needed for existing cards
4. Gradual adoption of new features

### Backward Compatibility

- Existing `issueCard()` function remains unchanged
- All existing cards continue to function
- New minting mode field defaults to DIRECT for existing cards
- Frontend gracefully handles both card types

## Performance Optimization

### Smart Contract Optimization

1. **Gas Optimization**
   - Use packed storage for CollectibleTemplate
   - Minimize storage writes
   - Batch whitelist operations
   - Use events for historical data

2. **Query Optimization**
   - Index key fields for filtering
   - Implement pagination for large lists
   - Cache frequently accessed data

### Frontend Optimization

1. **Rendering Optimization**
   - Virtual scrolling for large collectible lists
   - Lazy loading of images
   - Memoization of expensive calculations
   - Debounced filtering and search

2. **Data Fetching**
   - Batch eligibility checks
   - Cache collectible data
   - Implement optimistic UI updates
   - Use Web3 multicall for batch reads

3. **Bundle Optimization**
   - Code splitting by route
   - Lazy load collectibles page
   - Optimize images (WebP format)
   - Tree-shake unused code

## Monitoring and Analytics

### On-Chain Events

Track and index:
- CollectibleCreated events
- CollectibleClaimed events
- Pause/resume events
- Whitelist updates

### Frontend Analytics

Track:
- Collectible view counts
- Claim conversion rates
- Time to claim after viewing
- Popular categories and rarities
- User engagement metrics

### Issuer Analytics Dashboard

Display:
- Total claims per collectible
- Claim timeline graphs
- Geographic distribution (if available)
- Conversion rates
- Popular vs unpopular collectibles

## Future Enhancements

### Potential Extensions

1. **Dynamic Eligibility**
   - On-chain oracle integration
   - Real-time eligibility updates
   - Conditional logic (AND/OR combinations)

2. **Advanced Features**
   - Collectible series/collections
   - Achievement chains (claim A to unlock B)
   - Collaborative collectibles (multiple issuers)
   - Transferable collectibles (optional)

3. **Gamification**
   - Leaderboards for collectors
   - Completion badges
   - Rare drop mechanics
   - Time-limited events

4. **Social Features**
   - Collectible trading (if transferable)
   - Gifting collectibles
   - Social sharing enhancements
   - Community challenges

## Conclusion

This design provides a comprehensive foundation for implementing the enhanced issuer experience with dual minting modes. The architecture maintains backward compatibility while introducing powerful new capabilities for credential distribution. The modular design allows for incremental implementation and future extensions without disrupting existing functionality.
