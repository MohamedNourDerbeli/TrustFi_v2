/**
 * Application-wide constants
 * Centralized configuration for cache times, limits, and validation rules
 */

// ============================================================================
// React Query Cache Times (in milliseconds)
// ============================================================================

export const CACHE_TIMES = {
  // Profile data caching
  PROFILE_STALE: 2 * 60 * 1000, // 2 minutes - how long before data is considered stale
  PROFILE_GC: 5 * 60 * 1000, // 5 minutes - how long before unused data is garbage collected

  // Templates caching
  TEMPLATES_STALE: 5 * 60 * 1000, // 5 minutes
  TEMPLATES_GC: 10 * 60 * 1000, // 10 minutes

  // Collectibles caching
  COLLECTIBLES_STALE: 2 * 60 * 1000, // 2 minutes
  COLLECTIBLES_GC: 5 * 60 * 1000, // 5 minutes

  // Auth cache TTL
  AUTH_CACHE_TTL: 60 * 1000, // 1 minute
} as const;

// ============================================================================
// Query and Fetch Limits
// ============================================================================

export const LIMITS = {
  // Template scanning
  MAX_TEMPLATES: 100, // Safety limit to prevent infinite loops when scanning templates
  MAX_CONSECUTIVE_EMPTY: 5, // Stop scanning after this many consecutive empty templates

  // Activity and history
  MAX_RECENT_ACTIVITY: 10, // Recent activity items to fetch per user
  MAX_RECENT_CLAIMS: 5, // Recent claims to show on homepage
  MAX_PLATFORM_ACTIVITY: 5, // Platform-wide recent activity

  // Pagination
  DEFAULT_PAGE_SIZE: 20, // Default items per page
  MAX_PAGE_SIZE: 100, // Maximum items per page
} as const;

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION = {
  // Profile fields
  DISPLAY_NAME_MIN: 1,
  DISPLAY_NAME_MAX: 50,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  BIO_MAX: 500,

  // URLs
  URL_MAX: 200,

  // Template fields
  TEMPLATE_NAME_MIN: 3,
  TEMPLATE_NAME_MAX: 100,
  TEMPLATE_DESCRIPTION_MAX: 500,

  // File uploads
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// ============================================================================
// Tier Configuration
// ============================================================================

export const TIERS = {
  TIER_1: {
    value: 1,
    points: 10,
    name: 'Bronze',
    color: 'green',
  },
  TIER_2: {
    value: 2,
    points: 50,
    name: 'Silver',
    color: 'blue',
  },
  TIER_3: {
    value: 3,
    points: 200,
    name: 'Gold',
    color: 'purple',
  },
} as const;

// Helper function to get tier info
export const getTierInfo = (tier: number) => {
  switch (tier) {
    case 1:
      return TIERS.TIER_1;
    case 2:
      return TIERS.TIER_2;
    case 3:
      return TIERS.TIER_3;
    default:
      return TIERS.TIER_1;
  }
};

// ============================================================================
// Special Template IDs
// ============================================================================

export const SPECIAL_TEMPLATES = {
  KUSAMA_LIVING_PROFILE: 999n, // Dynamic NFT template ID
} as const;

// ============================================================================
// Time Constants
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================

export const RETRY = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// Export all constants
// ============================================================================

export default {
  CACHE_TIMES,
  LIMITS,
  VALIDATION,
  TIERS,
  SPECIAL_TEMPLATES,
  TIME,
  RETRY,
} as const;
