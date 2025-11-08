import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, type SupportedChainId } from '../config/contracts';
import { ReputationCard_ABI } from '../config/ReputationCard.abi';
import { ContractError, NetworkError, ValidationError, TransactionError } from './contractService';
import type { ReputationCard } from '../types/reputationCard';

// Re-export the type for convenience
export type { ReputationCard };

export interface ReputationBreakdown {
  categories: string[];
  scores: number[];
}

export class ReputationCardService {
  private signer: ethers.Signer | null = null;
  private chainId: SupportedChainId | null = null;

  async initialize(provider: ethers.BrowserProvider): Promise<boolean> {
    try {
      this.signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainIdNum = Number(network.chainId);
      this.chainId = chainIdNum.toString() as SupportedChainId;

      if (!CONTRACT_ADDRESSES[this.chainId]) {
        throw new NetworkError(`Unsupported network: ${this.chainId}`);
      }

      return true;
    } catch (error: any) {
      console.error('Failed to initialize reputation card service:', error);
      throw new NetworkError('Failed to initialize reputation card service', error);
    }
  }

  isInitialized(): boolean {
    return this.signer !== null && this.chainId !== null;
  }

  private getContract(): ethers.Contract {
    if (!this.signer || !this.chainId) {
      throw new ContractError('Reputation card service not initialized');
    }

    const address = CONTRACT_ADDRESSES[this.chainId].ReputationCard;
    return new ethers.Contract(address, ReputationCard_ABI, this.signer);
  }

  /**
   * Issue a new reputation card to a profile
   * Note: category and description are now stored in metadata, not on-chain
   */
  async issueCard(
    profileId: number,
    category: string,
    value: number,
    metadataURI: string
  ): Promise<number> {
    try {
      const contract = this.getContract();

      // Validate inputs
      if (value <= 0 || value > 1000) {
        throw new ValidationError('Value must be between 1 and 1000');
      }
      if (!metadataURI || metadataURI.length === 0) {
        throw new ValidationError('Metadata URI is required');
      }

      // Create category hash for on-chain filtering
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes(category.toLowerCase()));

      const tx = await contract.issueCard(profileId, categoryHash, value, metadataURI);
      const receipt = await tx.wait();

      // Extract card ID from event using ethers v6 approach
      const cardIssuedEvent = receipt?.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data
            });
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'CardIssued');

      if (!cardIssuedEvent || !cardIssuedEvent.args) {
        throw new ContractError('Failed to get card ID from transaction');
      }

      return Number(cardIssuedEvent.args.cardId);
    } catch (error: any) {
      console.error('Failed to issue card:', error);

      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to issue cards', error);
      }
      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to issue card', error);
    }
  }

  /**
   * Get a reputation card by ID
   * Note: Returns minimal on-chain data. Use metadataURI to fetch full details.
   */
  async getCard(cardId: number): Promise<ReputationCard & { categoryHash: string; metadataURI: string }> {
    try {
      const contract = this.getContract();
      const [card, categoryHash, metadataURI] = await contract.getCard(cardId);

      return {
        profileId: Number(card.profileId),
        category: '', // Category is in metadata
        description: '', // Description is in metadata
        value: Number(card.value),
        issuedAt: Number(card.issuedAt),
        issuer: card.issuer,
        isValid: card.isValid,
        categoryHash,
        metadataURI,
      };
    } catch (error: any) {
      console.error('Failed to get card:', error);

      if (error.message?.includes('CardNotFound')) {
        throw new ValidationError('Card not found', error);
      }

      throw new ContractError('Failed to get card', error);
    }
  }

  /**
   * Get all cards for a profile
   */
  async getCardsByProfile(profileId: number): Promise<number[]> {
    try {
      const contract = this.getContract();
      const cardIds = await contract.getCardsByProfile(profileId);
      return cardIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error('Failed to get cards by profile:', error);

      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }

      throw new ContractError('Failed to get cards by profile', error);
    }
  }

  /**
   * Get all card IDs for a profile
   * Note: Use getCard() to fetch individual card details with metadata
   */
  async getProfileCards(profileId: number): Promise<number[]> {
    try {
      return await this.getCardsByProfile(profileId);
    } catch (error: any) {
      console.error('Failed to get profile cards:', error);
      throw error;
    }
  }

  /**
   * Verify if a card is valid
   */
  async verifyCard(cardId: number): Promise<boolean> {
    try {
      const contract = this.getContract();
      return await contract.verifyCard(cardId);
    } catch (error: any) {
      console.error('Failed to verify card:', error);
      return false;
    }
  }

  /**
   * Revoke a reputation card
   */
  async revokeCard(cardId: number): Promise<void> {
    try {
      const contract = this.getContract();
      const tx = await contract.revokeCard(cardId);
      await tx.wait();
    } catch (error: any) {
      console.error('Failed to revoke card:', error);

      if (error.message?.includes('UnauthorizedAccess')) {
        throw new ValidationError('You are not authorized to revoke this card', error);
      }
      if (error.message?.includes('CardNotFound')) {
        throw new ValidationError('Card not found', error);
      }
      if (error.message?.includes('CardAlreadyRevoked')) {
        throw new ValidationError('Card is already revoked', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to revoke card', error);
    }
  }

  /**
   * Calculate reputation score for a profile
   */
  async calculateReputationScore(profileId: number): Promise<number> {
    try {
      const contract = this.getContract();
      const score = await contract.calculateReputationScore(profileId);
      return Number(score);
    } catch (error: any) {
      console.error('Failed to calculate reputation score:', error);

      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }

      throw new ContractError('Failed to calculate reputation score', error);
    }
  }

  /**
   * Get reputation breakdown by category
   * Note: Returns category hashes. Map to category names using your metadata.
   */
  async getReputationBreakdown(profileId: number): Promise<{ categoryHashes: string[]; scores: number[] }> {
    try {
      const contract = this.getContract();
      const [categoryHashes, scores] = await contract.getReputationBreakdown(profileId);

      return {
        categoryHashes: categoryHashes,
        scores: scores.map((score: bigint) => Number(score)),
      };
    } catch (error: any) {
      console.error('Failed to get reputation breakdown:', error);

      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }

      throw new ContractError('Failed to get reputation breakdown', error);
    }
  }

  /**
   * Get card IDs by category
   */
  async getCardsByCategory(profileId: number, category: string): Promise<number[]> {
    try {
      const contract = this.getContract();
      const categoryHash = ethers.keccak256(ethers.toUtf8Bytes(category.toLowerCase()));
      const cardIds = await contract.getCardsByCategory(profileId, categoryHash);

      return cardIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error('Failed to get cards by category:', error);

      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }

      throw new ContractError('Failed to get cards by category', error);
    }
  }

  /**
   * Get card IDs by issuer
   */
  async getCardsByIssuer(profileId: number, issuer: string): Promise<number[]> {
    try {
      const contract = this.getContract();
      const cardIds = await contract.getCardsByIssuer(profileId, issuer);

      return cardIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error('Failed to get cards by issuer:', error);

      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }

      throw new ContractError('Failed to get cards by issuer', error);
    }
  }

  /**
   * Get valid card count for a profile
   */
  async getValidCardCount(profileId: number): Promise<number> {
    try {
      const contract = this.getContract();
      const count = await contract.getValidCardCount(profileId);
      return Number(count);
    } catch (error: any) {
      console.error('Failed to get valid card count:', error);

      if (error.message?.includes('ProfileNotFound')) {
        throw new ValidationError('Profile not found', error);
      }

      throw new ContractError('Failed to get valid card count', error);
    }
  }

  /**
   * Authorize an issuer
   */
  async authorizeIssuer(issuerAddress: string): Promise<void> {
    try {
      const contract = this.getContract();
      const tx = await contract.authorizeIssuer(issuerAddress);
      await tx.wait();
    } catch (error: any) {
      console.error('Failed to authorize issuer:', error);

      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to authorize issuer', error);
    }
  }

  /**
   * Revoke issuer authorization
   */
  async revokeIssuer(issuerAddress: string): Promise<void> {
    try {
      const contract = this.getContract();
      const tx = await contract.revokeIssuer(issuerAddress);
      await tx.wait();
    } catch (error: any) {
      console.error('Failed to revoke issuer:', error);

      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to revoke issuer', error);
    }
  }

  /**
   * Check if an address is an authorized issuer
   */
  async isAuthorizedIssuer(issuerAddress: string): Promise<boolean> {
    try {
      const contract = this.getContract();
      return await contract.isAuthorizedIssuer(issuerAddress);
    } catch (error: any) {
      console.error('Failed to check issuer authorization:', error);
      return false;
    }
  }

  /**
   * Get total number of cards issued
   */
  async totalCards(): Promise<number> {
    try {
      const contract = this.getContract();
      const total = await contract.totalCards();
      return Number(total);
    } catch (error: any) {
      console.error('Failed to get total cards:', error);
      throw new ContractError('Failed to get total cards', error);
    }
  }

  /**
   * Get all cards issued by a specific issuer address (across all profiles)
   */
  async getAllCardsIssuedBy(issuerAddress: string): Promise<number[]> {
    try {
      const contract = this.getContract();
      const cardIds = await contract.getAllCardsIssuedBy(issuerAddress);
      return cardIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error('Failed to get cards issued by address:', error);
      throw new ContractError('Failed to get cards issued by address', error);
    }
  }

  /**
   * Get current chain ID
   */
  getCurrentChainId(): SupportedChainId | null {
    return this.chainId;
  }

  /**
   * Reset service
   */
  reset(): void {
    this.signer = null;
    this.chainId = null;
  }
}

// Export singleton instance
export const reputationCardService = new ReputationCardService();
