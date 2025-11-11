/**
 * Batch fetching utilities for optimizing multiple contract calls
 * Reduces the number of individual requests by batching them together
 */

import { reputationCardService } from '@/services/reputationCardService';
import { collectibleContractService } from '@/services/collectibleContractService';
import { cardCache } from './cacheUtils';

export interface BatchFetchOptions {
  batchSize?: number; // Number of items to fetch in parallel
  useCache?: boolean; // Whether to use cache
  cacheTime?: number; // Custom cache time in milliseconds
}

/**
 * Batch fetch multiple reputation cards
 * Fetches cards in parallel batches to optimize performance
 */
export async function batchFetchCards(
  cardIds: number[],
  options: BatchFetchOptions = {}
): Promise<Map<number, any>> {
  const {
    batchSize = 10,
    useCache = true,
    cacheTime,
  } = options;

  const results = new Map<number, any>();
  const toFetch: number[] = [];

  // Check cache first if enabled
  if (useCache) {
    for (const cardId of cardIds) {
      const cacheKey = `card:${cardId}`;
      const cached = cardCache.get(cacheKey);
      
      if (cached) {
        results.set(cardId, cached);
      } else {
        toFetch.push(cardId);
      }
    }
  } else {
    toFetch.push(...cardIds);
  }

  // If all cards were cached, return early
  if (toFetch.length === 0) {
    return results;
  }

  // Fetch remaining cards in batches
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (cardId) => {
        try {
          const card = await reputationCardService.getCard(cardId);
          return { cardId, card };
        } catch (error) {
          console.warn(`Failed to fetch card ${cardId}:`, error);
          return { cardId, card: null };
        }
      })
    );

    // Process batch results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.card) {
        const { cardId, card } = result.value;
        results.set(cardId, card);
        
        // Cache the result if enabled
        if (useCache) {
          const cacheKey = `card:${cardId}`;
          cardCache.set(cacheKey, card, cacheTime);
        }
      }
    });
  }

  return results;
}

/**
 * Batch fetch minting modes for multiple cards
 * Optimizes fetching of minting mode data
 */
export async function batchFetchMintingModes(
  cardIds: number[],
  options: BatchFetchOptions = {}
): Promise<Map<number, number>> {
  const {
    batchSize = 20,
    useCache = true,
    cacheTime,
  } = options;

  const results = new Map<number, number>();
  const toFetch: number[] = [];

  // Check cache first if enabled
  if (useCache) {
    for (const cardId of cardIds) {
      const cacheKey = `minting-mode:${cardId}`;
      const cached = cardCache.get(cacheKey);
      
      if (cached !== null) {
        results.set(cardId, cached);
      } else {
        toFetch.push(cardId);
      }
    }
  } else {
    toFetch.push(...cardIds);
  }

  // If all modes were cached, return early
  if (toFetch.length === 0) {
    return results;
  }

  // Fetch remaining modes in batches
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (cardId) => {
        try {
          const mode = await collectibleContractService.getCardMintingMode(cardId);
          return { cardId, mode };
        } catch (error) {
          console.warn(`Failed to fetch minting mode for card ${cardId}:`, error);
          return { cardId, mode: 0 }; // Default to DIRECT mode
        }
      })
    );

    // Process batch results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { cardId, mode } = result.value;
        results.set(cardId, mode);
        
        // Cache the result if enabled
        if (useCache) {
          const cacheKey = `minting-mode:${cardId}`;
          cardCache.set(cacheKey, mode, cacheTime);
        }
      }
    });
  }

  return results;
}

/**
 * Batch fetch eligibility status for multiple collectibles
 * Optimizes checking eligibility for many collectibles at once
 */
export async function batchFetchEligibility(
  templateIds: number[],
  userAddress: string,
  options: BatchFetchOptions = {}
): Promise<Map<number, any>> {
  const {
    batchSize = 15,
    useCache = true,
    cacheTime,
  } = options;

  const results = new Map<number, any>();
  const toFetch: number[] = [];

  // Check cache first if enabled
  if (useCache) {
    for (const templateId of templateIds) {
      const cacheKey = `eligibility:${templateId}:${userAddress}`;
      const cached = cardCache.get(cacheKey);
      
      if (cached) {
        results.set(templateId, cached);
      } else {
        toFetch.push(templateId);
      }
    }
  } else {
    toFetch.push(...templateIds);
  }

  // If all eligibility checks were cached, return early
  if (toFetch.length === 0) {
    return results;
  }

  // Fetch remaining eligibility checks in batches
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (templateId) => {
        try {
          const status = await collectibleContractService.checkEligibility(
            templateId,
            userAddress
          );
          return { templateId, status };
        } catch (error) {
          console.warn(`Failed to check eligibility for template ${templateId}:`, error);
          return { templateId, status: null };
        }
      })
    );

    // Process batch results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.status) {
        const { templateId, status } = result.value;
        results.set(templateId, status);
        
        // Cache the result if enabled
        if (useCache) {
          const cacheKey = `eligibility:${templateId}:${userAddress}`;
          cardCache.set(cacheKey, status, cacheTime);
        }
      }
    });
  }

  return results;
}

/**
 * Batch fetch collectible templates
 * Optimizes fetching of multiple collectible templates
 */
export async function batchFetchCollectibleTemplates(
  templateIds: number[],
  options: BatchFetchOptions = {}
): Promise<Map<number, any>> {
  const {
    batchSize = 10,
    useCache = true,
    cacheTime,
  } = options;

  const results = new Map<number, any>();
  const toFetch: number[] = [];

  // Check cache first if enabled
  if (useCache) {
    for (const templateId of templateIds) {
      const cacheKey = `collectible-template:${templateId}`;
      const cached = cardCache.get(cacheKey);
      
      if (cached) {
        results.set(templateId, cached);
      } else {
        toFetch.push(templateId);
      }
    }
  } else {
    toFetch.push(...templateIds);
  }

  // If all templates were cached, return early
  if (toFetch.length === 0) {
    return results;
  }

  // Fetch remaining templates in batches
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (templateId) => {
        try {
          const template = await collectibleContractService.getCollectibleTemplate(templateId);
          return { templateId, template };
        } catch (error) {
          console.warn(`Failed to fetch template ${templateId}:`, error);
          return { templateId, template: null };
        }
      })
    );

    // Process batch results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.template) {
        const { templateId, template } = result.value;
        results.set(templateId, template);
        
        // Cache the result if enabled
        if (useCache) {
          const cacheKey = `collectible-template:${templateId}`;
          cardCache.set(cacheKey, template, cacheTime);
        }
      }
    });
  }

  return results;
}
