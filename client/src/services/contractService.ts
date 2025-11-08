import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, type SupportedChainId } from '../config/contracts';
import { ProfileNFT_ABI } from '../config/ProfileNFT.abi';
import { metadataService, type ProfileMetadata } from './metadataService';

export interface ProfileOnChain {
  reputationScore: number;
  createdAt: number;
  lastUpdated: number;
  isActive: boolean;
}

export interface ProfileWithMetadata extends ProfileOnChain {
  tokenId: number;
  metadata: ProfileMetadata;
  metadataURI: string;
}

// Custom error types
export class ContractError extends Error {
  public code?: string;
  public originalError?: any;

  constructor(message: string, code?: string, originalError?: any) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.originalError = originalError;
  }
}

export class NetworkError extends ContractError {
  constructor(message: string, originalError?: any) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ContractError {
  constructor(message: string, originalError?: any) {
    super(message, 'VALIDATION_ERROR', originalError);
    this.name = 'ValidationError';
  }
}

export class TransactionError extends ContractError {
  constructor(message: string, originalError?: any) {
    super(message, 'TRANSACTION_ERROR', originalError);
    this.name = 'TransactionError';
  }
}

export class ContractService {
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
      console.error('Failed to initialize contract service:', error);
      throw new NetworkError('Failed to initialize contract service', error);
    }
  }

  isInitialized(): boolean {
    return this.signer !== null && this.chainId !== null;
  }

  private getContract(): ethers.Contract {
    if (!this.signer || !this.chainId) {
      throw new ContractError('Contract service not initialized');
    }

    const address = CONTRACT_ADDRESSES[this.chainId].ProfileNFT;
    return new ethers.Contract(address, ProfileNFT_ABI, this.signer);
  }

  /**
   * Create a new profile with metadata URI
   */
  async createProfile(metadataURI: string): Promise<number> {
    try {
      const contract = this.getContract();

      // Validate metadata URI
      if (!metadataURI || metadataURI.trim().length === 0) {
        throw new ValidationError('Metadata URI is required');
      }

      // Call contract
      const tx = await contract.createProfile(metadataURI);
      const receipt = await tx.wait();

      // Extract token ID from event using ethers v6 approach
      const profileCreatedEvent = receipt?.logs
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
        .find((event: any) => event?.name === 'ProfileCreated');

      if (!profileCreatedEvent || !profileCreatedEvent.args) {
        throw new ContractError('Failed to get token ID from transaction');
      }

      return Number(profileCreatedEvent.args.tokenId);
    } catch (error: any) {
      console.error('Failed to create profile:', error);

      if (error.message?.includes('ProfileAlreadyExists')) {
        throw new ValidationError('You already have a profile', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to create profile', error);
    }
  }

  /**
   * Update profile metadata
   */
  async updateProfileMetadata(tokenId: number, newMetadataURI: string): Promise<void> {
    try {
      const contract = this.getContract();

      const tx = await contract.updateProfileMetadata(tokenId, newMetadataURI);
      await tx.wait();
    } catch (error: any) {
      console.error('Failed to update profile metadata:', error);

      if (error.message?.includes('UnauthorizedAccess')) {
        throw new ValidationError('You are not authorized to update this profile', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to update profile metadata', error);
    }
  }

  /**
   * Get profile by token ID with metadata
   */
  async getProfile(tokenId: number): Promise<ProfileWithMetadata> {
    try {
      const contract = this.getContract();

      const [profileData, metadataURI] = await contract.getProfile(tokenId);

      // Fetch metadata from URI
      const metadata = await metadataService.fetchMetadata(metadataURI);

      return {
        tokenId,
        reputationScore: Number(profileData.reputationScore),
        createdAt: Number(profileData.createdAt),
        lastUpdated: Number(profileData.lastUpdated),
        isActive: profileData.isActive,
        metadata,
        metadataURI,
      };
    } catch (error: any) {
      // Check for ProfileNotFound error by error code or message
      const errorData = error?.data?.data || error?.data || '';
      const isProfileNotFound = 
        error.message?.includes('ProfileNotFound') ||
        errorData === '0x72da560b' || // ProfileNotFound error selector
        error.code === 'CALL_EXCEPTION';

      if (isProfileNotFound) {
        throw new ValidationError('Profile not found', error);
      }

      console.error('Failed to get profile:', error);
      throw new ContractError('Failed to get profile', error);
    }
  }

  /**
   * Get profile by owner address with metadata
   */
  async getProfileByOwner(address: string): Promise<ProfileWithMetadata> {
    // Validate address first to prevent contract errors
    if (!address || !ethers.isAddress(address)) {
      throw new ValidationError('Invalid Ethereum address');
    }

    try {
      const contract = this.getContract();

      const [tokenId, profileData, metadataURI] = await contract.getProfileByOwner(address);

      // Fetch metadata from URI (with fallback for invalid URIs)
      let metadata;
      try {
        metadata = await metadataService.fetchMetadata(metadataURI);
      } catch (metadataError) {
        console.warn('Failed to fetch metadata, using defaults:', metadataError);
        // Use default metadata if fetch fails
        metadata = {
          name: `User ${address.slice(0, 6)}`,
          description: 'TrustFi Profile',
          image: '',
        };
      }

      return {
        tokenId: Number(tokenId),
        reputationScore: Number(profileData.reputationScore),
        createdAt: Number(profileData.createdAt),
        lastUpdated: Number(profileData.lastUpdated),
        isActive: profileData.isActive,
        metadata,
        metadataURI,
      };
    } catch (error: any) {
      // Check for ProfileNotFound error by error code or message
      const errorData = error?.data?.data || error?.data || '';
      const isProfileNotFound = 
        error.message?.includes('ProfileNotFound') ||
        errorData === '0x72da560b' || // ProfileNotFound error selector
        error.code === 'CALL_EXCEPTION';

      if (isProfileNotFound) {
        throw new ValidationError('Profile not found for this address', error);
      }

      // Log unexpected errors
      console.error('Failed to get profile by owner:', error);
      throw new ContractError('Failed to get profile by owner', error);
    }
  }

  /**
   * Deactivate profile
   */
  async deactivateProfile(tokenId: number): Promise<void> {
    try {
      const contract = this.getContract();

      const tx = await contract.deactivateProfile(tokenId);
      await tx.wait();
    } catch (error: any) {
      console.error('Failed to deactivate profile:', error);

      if (error.message?.includes('UnauthorizedAccess')) {
        throw new ValidationError('You are not authorized to deactivate this profile', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to deactivate profile', error);
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
export const contractService = new ContractService();
