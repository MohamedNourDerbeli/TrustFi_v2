import { ethers } from 'ethers';

/**
 * Utility functions for working with category hashes
 * Categories are stored as hashes on-chain to save gas
 */

// Standard category names and their hashes
export const CATEGORIES = {
  education: 'education',
  professional: 'professional',
  achievement: 'achievement',
  community: 'community',
} as const;

export type CategoryName = keyof typeof CATEGORIES;

/**
 * Convert a category name to its hash
 */
export function getCategoryHash(category: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(category.toLowerCase()));
}

/**
 * Pre-computed hashes for standard categories (for comparison)
 */
export const CATEGORY_HASHES: Record<CategoryName, string> = {
  education: getCategoryHash('education'),
  professional: getCategoryHash('professional'),
  achievement: getCategoryHash('achievement'),
  community: getCategoryHash('community'),
};

/**
 * Try to match a hash to a known category name
 */
export function getCategoryNameFromHash(hash: string): string | null {
  for (const [name, categoryHash] of Object.entries(CATEGORY_HASHES)) {
    if (categoryHash === hash) {
      return name;
    }
  }
  return null;
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: string): string {
  const normalized = category.toLowerCase();
  switch (normalized) {
    case 'education':
      return 'Education';
    case 'professional':
      return 'Professional';
    case 'achievement':
      return 'Achievement';
    case 'community':
      return 'Community';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
