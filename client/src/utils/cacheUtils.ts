/**
 * Cache utility for storing and retrieving data with TTL (Time To Live)
 * Provides in-memory caching with automatic expiration
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheConfig {
  ttl: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries (optional)
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Set a value in the cache with optional custom TTL
   */
  set(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL ?? this.config.ttl;
    
    // Check max size and evict oldest entry if needed
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from the cache if it exists and hasn't expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get or set a value using a factory function
   * If the key exists and is not expired, return the cached value
   * Otherwise, call the factory function, cache the result, and return it
   */
  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, customTTL);
    return data;
  }
}

/**
 * Create a cache manager with default configuration
 */
export function createCache<T = any>(config: CacheConfig): CacheManager<T> {
  return new CacheManager<T>(config);
}

/**
 * Profile cache with 5-minute TTL
 */
export const profileCache = createCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Store up to 100 profiles
});

/**
 * Card data cache with 2-minute TTL
 */
export const cardCache = createCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 500, // Store up to 500 cards
});

/**
 * Collectible cache with 1-minute TTL
 */
export const collectibleCache = createCache({
  ttl: 1 * 60 * 1000, // 1 minute
  maxSize: 200, // Store up to 200 collectibles
});

/**
 * Eligibility status cache with 30-second TTL
 */
export const eligibilityCache = createCache({
  ttl: 30 * 1000, // 30 seconds
  maxSize: 500, // Store up to 500 eligibility checks
});

// Set up periodic cleanup (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    profileCache.cleanup();
    cardCache.cleanup();
    collectibleCache.cleanup();
    eligibilityCache.cleanup();
  }, 5 * 60 * 1000);
}
