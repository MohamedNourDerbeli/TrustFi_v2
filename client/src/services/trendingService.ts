/**
 * Trending Service - Calculates trending scores for collectibles
 * Factors in claim velocity, scarcity, and urgency to identify hot collectibles
 */

import type { CollectibleTemplate } from '@/types/collectible';

export interface TrendingScore {
  templateId: number;
  score: number;
  claimVelocity: number;      // Claims per hour
  scarcityScore: number;       // 0-1 based on remaining supply
  urgencyScore: number;        // 0-1 based on time remaining
  isTrending: boolean;
  isExpiringSoon: boolean;
  isLowSupply: boolean;
}

interface ClaimEvent {
  templateId: number;
  timestamp: number;
  claimer: string;
}

/**
 * Cache for trending data
 */
interface TrendingCache {
  scores: Map<number, TrendingScore>;
  claimEvents: Map<number, ClaimEvent[]>;
  lastUpdated: number;
}

class TrendingService {
  private cache: TrendingCache = {
    scores: new Map(),
    claimEvents: new Map(),
    lastUpdated: 0,
  };

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TRENDING_THRESHOLD = 0.6; // Score threshold for "trending"
  private readonly EXPIRING_SOON_HOURS = 24; // Hours until expiration to be "expiring soon"
  private readonly LOW_SUPPLY_THRESHOLD = 0.2; // 20% remaining supply or less

  /**
   * Calculate trending scores for a list of collectibles
   */
  calculateTrendingScores(collectibles: CollectibleTemplate[]): Map<number, TrendingScore> {
    const now = Date.now();
    const scores = new Map<number, TrendingScore>();

    for (const collectible of collectibles) {
      const claimVelocity = this.calculateClaimVelocity(collectible);
      const scarcityScore = this.calculateScarcityScore(collectible);
      const urgencyScore = this.calculateUrgencyScore(collectible);

      // Weighted scoring: velocity (50%), scarcity (30%), urgency (20%)
      const totalScore = (
        claimVelocity * 0.5 +
        scarcityScore * 0.3 +
        urgencyScore * 0.2
      );

      const isTrending = totalScore >= this.TRENDING_THRESHOLD;
      const isExpiringSoon = urgencyScore > 0.7;
      const isLowSupply = scarcityScore > 0.8;

      scores.set(collectible.templateId, {
        templateId: collectible.templateId,
        score: totalScore,
        claimVelocity,
        scarcityScore,
        urgencyScore,
        isTrending,
        isExpiringSoon,
        isLowSupply,
      });
    }

    return scores;
  }

  /**
   * Calculate claim velocity (claims per hour)
   * Normalized to 0-1 scale
   */
  private calculateClaimVelocity(collectible: CollectibleTemplate): number {
    const now = Math.floor(Date.now() / 1000);
    const createdAt = collectible.startTime || now;
    const hoursElapsed = Math.max((now - createdAt) / 3600, 1);

    // Calculate claims per hour
    const claimsPerHour = collectible.currentSupply / hoursElapsed;

    // Normalize to 0-1 scale (assuming 10 claims/hour is very high)
    const normalized = Math.min(claimsPerHour / 10, 1);

    return normalized;
  }

  /**
   * Calculate scarcity score based on remaining supply
   * Higher score = more scarce (less supply remaining)
   */
  private calculateScarcityScore(collectible: CollectibleTemplate): number {
    // Unlimited supply = no scarcity
    if (collectible.maxSupply === 0) {
      return 0;
    }

    const remainingSupply = collectible.maxSupply - collectible.currentSupply;
    const supplyPercentage = remainingSupply / collectible.maxSupply;

    // Invert so low supply = high score
    const scarcityScore = 1 - supplyPercentage;

    return Math.max(0, Math.min(1, scarcityScore));
  }

  /**
   * Calculate urgency score based on time remaining
   * Higher score = more urgent (less time remaining)
   */
  private calculateUrgencyScore(collectible: CollectibleTemplate): number {
    // No end time = no urgency
    if (collectible.endTime === 0) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = collectible.endTime - now;

    // Already expired
    if (timeRemaining <= 0) {
      return 1;
    }

    // Calculate hours remaining
    const hoursRemaining = timeRemaining / 3600;

    // Normalize to 0-1 scale (24 hours or less = high urgency)
    const urgencyScore = Math.max(0, 1 - (hoursRemaining / this.EXPIRING_SOON_HOURS));

    return Math.max(0, Math.min(1, urgencyScore));
  }

  /**
   * Get trending collectibles sorted by score
   */
  getTrendingCollectibles(
    collectibles: CollectibleTemplate[],
    limit: number = 10
  ): Array<CollectibleTemplate & { trendingScore: TrendingScore }> {
    const scores = this.calculateTrendingScores(collectibles);

    // Combine collectibles with their scores
    const collectiblesWithScores = collectibles
      .map(collectible => ({
        ...collectible,
        trendingScore: scores.get(collectible.templateId)!,
      }))
      .filter(c => c.trendingScore.isTrending);

    // Sort by score descending
    collectiblesWithScores.sort((a, b) => b.trendingScore.score - a.trendingScore.score);

    return collectiblesWithScores.slice(0, limit);
  }

  /**
   * Get expiring soon collectibles
   */
  getExpiringSoonCollectibles(
    collectibles: CollectibleTemplate[],
    limit: number = 10
  ): Array<CollectibleTemplate & { trendingScore: TrendingScore }> {
    const scores = this.calculateTrendingScores(collectibles);

    const collectiblesWithScores = collectibles
      .map(collectible => ({
        ...collectible,
        trendingScore: scores.get(collectible.templateId)!,
      }))
      .filter(c => c.trendingScore.isExpiringSoon && c.endTime > 0);

    // Sort by end time ascending (soonest first)
    collectiblesWithScores.sort((a, b) => a.endTime - b.endTime);

    return collectiblesWithScores.slice(0, limit);
  }

  /**
   * Get low supply collectibles
   */
  getLowSupplyCollectibles(
    collectibles: CollectibleTemplate[],
    limit: number = 10
  ): Array<CollectibleTemplate & { trendingScore: TrendingScore }> {
    const scores = this.calculateTrendingScores(collectibles);

    const collectiblesWithScores = collectibles
      .map(collectible => ({
        ...collectible,
        trendingScore: scores.get(collectible.templateId)!,
      }))
      .filter(c => c.trendingScore.isLowSupply && c.maxSupply > 0);

    // Sort by remaining supply ascending (lowest first)
    collectiblesWithScores.sort((a, b) => {
      const aRemaining = a.maxSupply - a.currentSupply;
      const bRemaining = b.maxSupply - b.currentSupply;
      return aRemaining - bRemaining;
    });

    return collectiblesWithScores.slice(0, limit);
  }

  /**
   * Record a claim event for velocity tracking
   */
  recordClaimEvent(templateId: number, claimer: string): void {
    const events = this.cache.claimEvents.get(templateId) || [];
    events.push({
      templateId,
      timestamp: Date.now(),
      claimer,
    });

    // Keep only last 100 events per collectible
    if (events.length > 100) {
      events.shift();
    }

    this.cache.claimEvents.set(templateId, events);
  }

  /**
   * Update trending cache
   */
  updateCache(collectibles: CollectibleTemplate[]): void {
    const scores = this.calculateTrendingScores(collectibles);
    this.cache.scores = scores;
    this.cache.lastUpdated = Date.now();
  }

  /**
   * Get cached trending scores
   */
  getCachedScores(): Map<number, TrendingScore> | null {
    const now = Date.now();
    if (now - this.cache.lastUpdated > this.CACHE_TTL) {
      return null;
    }
    return this.cache.scores;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {
      scores: new Map(),
      claimEvents: new Map(),
      lastUpdated: 0,
    };
  }

  /**
   * Get trending score for a specific collectible
   */
  getScoreForCollectible(
    collectible: CollectibleTemplate
  ): TrendingScore {
    const scores = this.calculateTrendingScores([collectible]);
    return scores.get(collectible.templateId)!;
  }
}

// Export singleton instance
export const trendingService = new TrendingService();
