/**
 * TypeScript types for collectible reputation cards
 * These types match the Solidity contract structures in ReputationCard.sol
 */

/**
 * Eligibility types for collectible claiming
 * Matches the EligibilityType enum in the smart contract
 */
export const EligibilityType = {
  OPEN: 0,              // Anyone can claim
  WHITELIST: 1,         // Only whitelisted addresses
  TOKEN_HOLDER: 2,      // Must hold specific token
  PROFILE_REQUIRED: 3   // Must have TrustFi profile
} as const;

export type EligibilityType = typeof EligibilityType[keyof typeof EligibilityType];

/**
 * Rarity tiers for collectibles
 * Matches the rarity constants in the smart contract
 */
export const RarityTier = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4
} as const;

export type RarityTier = typeof RarityTier[keyof typeof RarityTier];

/**
 * Minting mode for reputation cards
 * Matches the MintingMode enum in the smart contract
 */
export const MintingMode = {
  DIRECT: 0,            // Issuer mints to recipient
  COLLECTIBLE: 1        // User mints to self
} as const;

export type MintingMode = typeof MintingMode[keyof typeof MintingMode];

/**
 * Collectible template structure
 * Matches the CollectibleTemplate struct in the smart contract
 */
export interface CollectibleTemplate {
  templateId: number;
  title: string;            // Display name for the collectible
  category: string;
  description: string;
  value: number;
  issuer: string;
  maxSupply: number;        // 0 = unlimited
  currentSupply: number;
  startTime: number;        // Unix timestamp, 0 = immediate
  endTime: number;          // Unix timestamp, 0 = no expiration
  eligibilityType: EligibilityType;
  eligibilityData: string;  // Hex string for flexible eligibility criteria
  isPaused: boolean;
  isActive: boolean;
  metadataURI: string;      // IPFS or other URI for rich metadata
  rarityTier: RarityTier;
}

/**
 * Form data for creating a collectible
 * Used in the issuer dashboard creation form
 */
export interface CollectibleFormData {
  title: string;
  category: string;
  description: string;
  value: number;
  maxSupply: number;
  startTime?: Date | null;
  endTime?: Date | null;
  eligibilityType: EligibilityType;
  eligibilityConfig: {
    whitelist?: string[];           // For WHITELIST type
    tokenAddress?: string;          // For TOKEN_HOLDER type
    minBalance?: number;            // For TOKEN_HOLDER type
    minReputationScore?: number;    // For PROFILE_REQUIRED type
  };
  image?: File;
  metadataURI?: string;
  rarityTier: RarityTier;
}

/**
 * Claim status for a user and collectible
 * Used to determine if a user can claim a collectible
 */
export interface ClaimStatus {
  templateId: number;
  isEligible: boolean;
  hasClaimed: boolean;
  remainingSupply: number;
  isActive: boolean;
  isPaused: boolean;
  canClaimNow: boolean;
  reason?: string;              // Explanation if user cannot claim
  startTime?: number;           // When claiming becomes available
  endTime?: number;             // When claiming expires
}

/**
 * Metadata structure for collectibles stored on IPFS
 * Follows NFT metadata standards (ERC721 metadata)
 */
export interface CollectibleMetadata {
  name: string;
  description: string;
  image: string;                // IPFS URL or HTTP URL
  external_url?: string;        // Link to external resource
  background_color?: string;    // Hex color without #
  animation_url?: string;       // URL to multimedia attachment
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;      // Optional display type (e.g., "date", "number")
  }>;
  // Custom TrustFi fields
  issuer?: {
    name: string;
    address: string;
    logo?: string;
  };
  rarity?: {
    tier: RarityTier;
    name: string;
  };
  collectible?: {
    templateId: number;
    supply: {
      current: number;
      max: number;
    };
  };
}

/**
 * Analytics data for a collectible
 * Used in the issuer dashboard to track performance
 */
export interface CollectibleAnalytics {
  templateId: number;
  totalClaims: number;
  uniqueClaimers: string[];     // Array of wallet addresses
  claimTimeline: Array<{
    timestamp: number;
    claimer: string;
    txHash: string;
    blockNumber?: number;
  }>;
  supplyPercentage: number;     // Percentage of supply claimed (0-100)
  averageClaimTime?: number;    // Average time from creation to claim (seconds)
  claimVelocity?: number;       // Claims per hour
  popularityScore?: number;     // Calculated score for trending
}

/**
 * Claim statistics for a collectible
 * Lightweight version for quick queries
 */
export interface ClaimStats {
  totalClaims: number;
  remainingSupply: number;
  isActive: boolean;
}

/**
 * Filter options for browsing collectibles
 */
export interface CollectibleFilters {
  category?: string;
  rarityTier?: RarityTier;
  eligibilityType?: EligibilityType;
  isEligible?: boolean;
  hasClaimed?: boolean;
  isActive?: boolean;
  issuer?: string;
}

/**
 * Sort options for collectibles gallery
 */
export const CollectibleSortBy = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  POPULARITY: 'popularity',      // Most claims
  EXPIRATION: 'expiration',      // Ending soonest
  SUPPLY: 'supply',              // Lowest remaining supply
  RARITY: 'rarity'               // Highest rarity first
} as const;

export type CollectibleSortBy = typeof CollectibleSortBy[keyof typeof CollectibleSortBy];

/**
 * Collectible with enriched data for display
 * Combines on-chain data with metadata and user-specific info
 */
export interface EnrichedCollectible extends CollectibleTemplate {
  metadata?: CollectibleMetadata;
  claimStatus?: ClaimStatus;
  stats?: ClaimStats;
  isTrending?: boolean;
  isExpiringSoon?: boolean;
  isLowSupply?: boolean;
}

/**
 * Transaction result for collectible operations
 */
export interface CollectibleTransactionResult {
  success: boolean;
  txHash?: string;
  templateId?: number;
  cardId?: number;
  error?: string;
  gasUsed?: string;
}

/**
 * Gas estimate for claiming a collectible
 */
export interface GasEstimate {
  gasLimit: bigint;
  gasCostEth: string;           // Formatted ETH amount
  gasCostUsd?: string;          // Formatted USD amount (if available)
  gasPrice: bigint;
}

/**
 * Whitelist operation data
 */
export interface WhitelistOperation {
  templateId: number;
  addresses: string[];
  operation: 'add' | 'remove';
}

/**
 * Collectible creation result
 */
export interface CreateCollectibleResult {
  templateId: number;
  txHash: string;
  template: CollectibleTemplate;
}

/**
 * Collectible claim result
 */
export interface ClaimCollectibleResult {
  cardId: number;
  txHash: string;
  timestamp: number;
}
