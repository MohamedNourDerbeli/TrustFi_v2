/**
 * Service for tracking and managing collectible claim history
 * Stores claim history in IndexedDB for offline access and fast queries
 */

import { openDB, type IDBPDatabase } from 'idb';
import { ethers } from 'ethers';
import { collectibleContractService } from './collectibleContractService';

const DB_NAME = 'trustfi-claim-history';
const DB_VERSION = 1;
const STORE_NAME = 'claims';

export interface ClaimHistoryEntry {
  id: string; // Unique ID: `${chainId}-${templateId}-${cardId}`
  chainId: string;
  templateId: number;
  cardId: number;
  claimer: string; // User's wallet address
  timestamp: number; // Unix timestamp
  txHash: string;
  blockNumber?: number;
  collectibleData?: {
    category: string;
    description: string;
    rarityTier: number;
    metadataURI: string;
  };
}

export interface ClaimHistoryFilters {
  category?: string;
  rarityTier?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ClaimHistoryStats {
  totalClaims: number;
  byCategory: Record<string, number>;
  byRarity: Record<number, number>;
  firstClaim?: ClaimHistoryEntry;
  latestClaim?: ClaimHistoryEntry;
}

class ClaimHistoryService {
  private db: IDBPDatabase | null = null;
  private eventListeners: Map<string, ethers.EventLog[]> = new Map();

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('claimer', 'claimer', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('templateId', 'templateId', { unique: false });
            store.createIndex('category', 'collectibleData.category', { unique: false });
            store.createIndex('rarityTier', 'collectibleData.rarityTier', { unique: false });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize claim history database:', error);
      throw error;
    }
  }

  /**
   * Start listening for CollectibleClaimed events
   */
  async startListening(provider: ethers.BrowserProvider, userAddress: string): Promise<void> {
    try {
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      const contractAddress = collectibleContractService.getContractAddress();
      const chainId = collectibleContractService.getCurrentChainId();

      if (!chainId) {
        throw new Error('Chain ID not available');
      }

      // Get contract instance
      const contract = new ethers.Contract(
        contractAddress,
        [
          'event CollectibleClaimed(uint256 indexed templateId, uint256 indexed cardId, address indexed claimer, uint256 timestamp)',
        ],
        provider
      );

      // Listen for new CollectibleClaimed events
      const filter = contract.filters.CollectibleClaimed(null, null, userAddress);
      
      contract.on(filter, async (templateId, cardId, claimer, timestamp, event) => {
        try {
          await this.addClaimFromEvent(
            chainId,
            Number(templateId),
            Number(cardId),
            claimer,
            Number(timestamp),
            event.log.transactionHash,
            event.log.blockNumber
          );
        } catch (error) {
          console.error('Failed to process CollectibleClaimed event:', error);
        }
      });

      console.log('Started listening for CollectibleClaimed events');
    } catch (error) {
      console.error('Failed to start listening for events:', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  stopListening(): void {
    this.eventListeners.clear();
  }

  /**
   * Sync claim history from blockchain events
   */
  async syncClaimHistory(
    provider: ethers.BrowserProvider,
    userAddress: string,
    fromBlock: number = 0
  ): Promise<number> {
    try {
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      const contractAddress = collectibleContractService.getContractAddress();
      const chainId = collectibleContractService.getCurrentChainId();

      if (!chainId) {
        throw new Error('Chain ID not available');
      }

      // Get contract instance
      const contract = new ethers.Contract(
        contractAddress,
        [
          'event CollectibleClaimed(uint256 indexed templateId, uint256 indexed cardId, address indexed claimer, uint256 timestamp)',
        ],
        provider
      );

      // Query past events
      const filter = contract.filters.CollectibleClaimed(null, null, userAddress);
      const events = await contract.queryFilter(filter, fromBlock);

      let syncedCount = 0;

      for (const event of events) {
        try {
          // Type guard to check if event is EventLog
          if (!('args' in event)) continue;
          
          const args = event.args;
          if (!args) continue;

          await this.addClaimFromEvent(
            chainId,
            Number(args.templateId),
            Number(args.cardId),
            args.claimer,
            Number(args.timestamp),
            event.transactionHash,
            event.blockNumber
          );

          syncedCount++;
        } catch (error) {
          console.error('Failed to process event:', error);
        }
      }

      console.log(`Synced ${syncedCount} claim history entries`);
      return syncedCount;
    } catch (error) {
      console.error('Failed to sync claim history:', error);
      throw error;
    }
  }

  /**
   * Add a claim entry from an event
   */
  private async addClaimFromEvent(
    chainId: string,
    templateId: number,
    cardId: number,
    claimer: string,
    timestamp: number,
    txHash: string,
    blockNumber?: number
  ): Promise<void> {
    try {
      // Fetch collectible template data
      let collectibleData: ClaimHistoryEntry['collectibleData'];
      try {
        const template = await collectibleContractService.getCollectibleTemplate(templateId);
        collectibleData = {
          category: template.category,
          description: template.description,
          rarityTier: template.rarityTier,
          metadataURI: template.metadataURI,
        };
      } catch (error) {
        console.warn('Failed to fetch collectible template:', error);
      }

      const entry: ClaimHistoryEntry = {
        id: `${chainId}-${templateId}-${cardId}`,
        chainId,
        templateId,
        cardId,
        claimer: claimer.toLowerCase(),
        timestamp,
        txHash,
        blockNumber,
        collectibleData,
      };

      await this.addClaim(entry);
    } catch (error) {
      console.error('Failed to add claim from event:', error);
      throw error;
    }
  }

  /**
   * Add a claim entry to the database
   */
  async addClaim(entry: ClaimHistoryEntry): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.put(STORE_NAME, entry);
    } catch (error) {
      console.error('Failed to add claim to database:', error);
      throw error;
    }
  }

  /**
   * Get all claims for a user
   */
  async getUserClaims(
    userAddress: string,
    filters?: ClaimHistoryFilters,
    limit?: number,
    offset: number = 0
  ): Promise<ClaimHistoryEntry[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('claimer');

      let claims = await index.getAll(userAddress.toLowerCase());

      // Apply filters
      if (filters) {
        claims = claims.filter((claim) => {
          if (filters.category && claim.collectibleData?.category !== filters.category) {
            return false;
          }
          if (filters.rarityTier !== undefined && claim.collectibleData?.rarityTier !== filters.rarityTier) {
            return false;
          }
          if (filters.startDate && claim.timestamp < Math.floor(filters.startDate.getTime() / 1000)) {
            return false;
          }
          if (filters.endDate && claim.timestamp > Math.floor(filters.endDate.getTime() / 1000)) {
            return false;
          }
          return true;
        });
      }

      // Sort by timestamp (most recent first)
      claims.sort((a, b) => b.timestamp - a.timestamp);

      // Apply pagination
      if (limit !== undefined) {
        claims = claims.slice(offset, offset + limit);
      }

      return claims;
    } catch (error) {
      console.error('Failed to get user claims:', error);
      throw error;
    }
  }

  /**
   * Get a single claim by ID
   */
  async getClaim(claimId: string): Promise<ClaimHistoryEntry | undefined> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      return await this.db!.get(STORE_NAME, claimId);
    } catch (error) {
      console.error('Failed to get claim:', error);
      throw error;
    }
  }

  /**
   * Get claim statistics for a user
   */
  async getUserClaimStats(userAddress: string): Promise<ClaimHistoryStats> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const claims = await this.getUserClaims(userAddress);

      const stats: ClaimHistoryStats = {
        totalClaims: claims.length,
        byCategory: {},
        byRarity: {},
      };

      for (const claim of claims) {
        // Count by category
        if (claim.collectibleData?.category) {
          const category = claim.collectibleData.category;
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        }

        // Count by rarity
        if (claim.collectibleData?.rarityTier !== undefined) {
          const rarity = claim.collectibleData.rarityTier;
          stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
        }
      }

      // Get first and latest claims
      if (claims.length > 0) {
        stats.latestClaim = claims[0]; // Already sorted by timestamp desc
        stats.firstClaim = claims[claims.length - 1];
      }

      return stats;
    } catch (error) {
      console.error('Failed to get user claim stats:', error);
      throw error;
    }
  }

  /**
   * Get claims by template ID
   */
  async getClaimsByTemplate(templateId: number): Promise<ClaimHistoryEntry[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('templateId');

      const claims = await index.getAll(templateId);
      
      // Sort by timestamp (most recent first)
      claims.sort((a, b) => b.timestamp - a.timestamp);

      return claims;
    } catch (error) {
      console.error('Failed to get claims by template:', error);
      throw error;
    }
  }

  /**
   * Delete a claim entry
   */
  async deleteClaim(claimId: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.delete(STORE_NAME, claimId);
    } catch (error) {
      console.error('Failed to delete claim:', error);
      throw error;
    }
  }

  /**
   * Clear all claim history
   */
  async clearAllClaims(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.clear(STORE_NAME);
    } catch (error) {
      console.error('Failed to clear claims:', error);
      throw error;
    }
  }

  /**
   * Get total count of claims for a user
   */
  async getUserClaimCount(userAddress: string): Promise<number> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('claimer');

      const count = await index.count(userAddress.toLowerCase());
      return count;
    } catch (error) {
      console.error('Failed to get user claim count:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const claimHistoryService = new ClaimHistoryService();
