import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, type SupportedChainId } from '../config/contracts';
import { ProfileNFT_ABI } from '../config/ProfileNFT.abi';

export interface Profile {
  name: string;
  bio: string;
  reputationScore: number;
  createdAt: number;
  isActive: boolean;
}

export interface ProfileWithId extends Profile {
  tokenId: number;
}

// Custom error types for better error handling
export class ContractError extends Error {
  public code?: string;
  public originalError?: any;

  constructor(
    message: string,
    code?: string,
    originalError?: any
  ) {
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
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private chainId: SupportedChainId | null = null;

  async initialize(provider: ethers.BrowserProvider): Promise<boolean> {
    try {
      if (!provider) {
        throw new ValidationError('Provider is required for initialization');
      }

      this.provider = provider;
      this.signer = await provider.getSigner();
      
      // Get network information
      const network = await provider.getNetwork();
      this.chainId = Number(network.chainId) as SupportedChainId;
      
      // Validate that we support this network
      if (!CONTRACT_ADDRESSES[this.chainId]) {
        throw new NetworkError(
          `Unsupported network: ${this.chainId}. Please switch to a supported network.`
        );
      }
      
      return true;
    } catch (error) {
      
      // Reset state on initialization failure
      this.provider = null;
      this.signer = null;
      this.chainId = null;
      
      if (error instanceof ContractError) {
        throw error;
      }
      
      throw new NetworkError('Failed to initialize contract service', error);
    }
  }

  private getProfileNFTContract(): ethers.Contract {
    if (!this.signer || !this.chainId) {
      throw new ContractError('Contract service not initialized. Please connect your wallet first.');
    }

    const contractAddress = CONTRACT_ADDRESSES[this.chainId].ProfileNFT;
    if (!contractAddress) {
      throw new NetworkError(`No ProfileNFT contract address found for network ${this.chainId}`);
    }

    try {
      return new ethers.Contract(contractAddress, ProfileNFT_ABI, this.signer);
    } catch (error) {
      throw new ContractError('Failed to create contract instance', 'CONTRACT_CREATION_ERROR', error);
    }
  }

  private async handleContractCall<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      
      // Handle specific error types
      if (error.code === 'CALL_EXCEPTION') {
        throw new ContractError(`Contract call failed: ${error.reason || error.message}`);
      }
      
      if (error.code === 'TRANSACTION_REPLACED') {
        throw new TransactionError('Transaction was replaced or cancelled');
      }
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new TransactionError('Insufficient funds for transaction');
      }
      
      if (error.code === 'USER_REJECTED') {
        throw new TransactionError('Transaction was rejected by user');
      }
      
      if (error.code === 'NETWORK_ERROR') {
        throw new NetworkError('Network connection error. Please check your connection.');
      }
      
      // Handle custom contract errors
      if (error.reason) {
        switch (error.reason) {
          case 'ProfileAlreadyExists':
            throw new ValidationError('A profile already exists for this wallet address');
          case 'ProfileNotFound':
            throw new ValidationError('Profile not found');
          case 'UnauthorizedAccess':
            throw new ValidationError('You are not authorized to perform this action');
          case 'InvalidProfileData':
            throw new ValidationError('Invalid profile data provided');
          default:
            throw new ContractError(`Contract error: ${error.reason}`);
        }
      }
      
      // Generic error handling
      if (error instanceof ContractError) {
        throw error;
      }
      
      throw new ContractError(errorMessage, 'UNKNOWN_ERROR', error);
    }
  }

  async createProfile(name: string, bio: string): Promise<number> {
    // Validate inputs before making contract call
    this.validateProfileData(name, bio);

    return this.handleContractCall(async () => {
      const contract = this.getProfileNFTContract();
      
      const tx = await contract.createProfile(name.trim(), bio.trim());
      const receipt = await tx.wait();
      
      // Find the ProfileCreated event to get the token ID
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'ProfileCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        const tokenId = Number(parsed?.args.tokenId);
        return tokenId;
      }
      
      throw new TransactionError('Profile creation event not found in transaction receipt');
    }, 'Failed to create profile');
  }

  private validateProfileData(name: string, bio: string): void {
    if (!name || !name.trim()) {
      throw new ValidationError('Profile name is required');
    }
    if (name.length > 50) {
      throw new ValidationError('Profile name must be 50 characters or less');
    }
    if (bio.length > 200) {
      throw new ValidationError('Profile bio must be 200 characters or less');
    }
  }

  async getProfile(tokenId: number): Promise<Profile> {
    if (!tokenId || tokenId <= 0) {
      throw new ValidationError('Valid token ID is required');
    }

    return this.handleContractCall(async () => {
      const contract = this.getProfileNFTContract();
      const profile = await contract.getProfile(tokenId);
      
      return {
        name: profile.name,
        bio: profile.bio,
        reputationScore: Number(profile.reputationScore),
        createdAt: Number(profile.createdAt),
        isActive: profile.isActive
      };
    }, 'Failed to get profile');
  }

  async getProfileByOwner(ownerAddress: string): Promise<ProfileWithId | null> {
    if (!ownerAddress || !ethers.isAddress(ownerAddress)) {
      throw new ValidationError('Valid wallet address is required');
    }

    return this.handleContractCall(async () => {
      const contract = this.getProfileNFTContract();
      const result = await contract.getProfileByOwner(ownerAddress);
      
      const tokenId = Number(result.tokenId);
      const profile = result.profile;
      
      // Check if profile exists (tokenId will be 0 if no profile)
      if (tokenId === 0) {
        return null;
      }
      
      return {
        tokenId,
        name: profile.name,
        bio: profile.bio,
        reputationScore: Number(profile.reputationScore),
        createdAt: Number(profile.createdAt),
        isActive: profile.isActive
      };
    }, 'Failed to get profile by owner');
  }

  async updateProfile(tokenId: number, name: string, bio: string): Promise<void> {
    if (!tokenId || tokenId <= 0) {
      throw new ValidationError('Valid token ID is required');
    }
    
    this.validateProfileData(name, bio);

    return this.handleContractCall(async () => {
      const contract = this.getProfileNFTContract();
      const tx = await contract.updateProfile(tokenId, name.trim(), bio.trim());
      await tx.wait();
    }, 'Failed to update profile');
  }

  async profileExists(tokenId: number): Promise<boolean> {
    if (!tokenId || tokenId <= 0) {
      throw new ValidationError('Valid token ID is required');
    }

    return this.handleContractCall(async () => {
      const contract = this.getProfileNFTContract();
      return await contract.profileExists(tokenId);
    }, 'Failed to check if profile exists');
  }

  async getTotalProfiles(): Promise<number> {
    return this.handleContractCall(async () => {
      const contract = this.getProfileNFTContract();
      const total = await contract.totalProfiles();
      return Number(total);
    }, 'Failed to get total profiles');
  }

  // Utility methods
  getCurrentChainId(): SupportedChainId | null {
    return this.chainId;
  }

  getContractAddress(): string | null {
    if (!this.chainId) return null;
    return CONTRACT_ADDRESSES[this.chainId].ProfileNFT;
  }

  isInitialized(): boolean {
    return this.provider !== null && this.signer !== null && this.chainId !== null;
  }

  async getCurrentWalletAddress(): Promise<string> {
    if (!this.signer) {
      throw new ContractError('Wallet not connected');
    }
    
    try {
      return await this.signer.getAddress();
    } catch (error) {
      throw new NetworkError('Failed to get wallet address', error);
    }
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new ContractError('Wallet not connected');
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new NetworkError('Failed to get wallet balance', error);
    }
  }

  // Reset the service state (useful for wallet disconnection)
  reset(): void {
    this.provider = null;
    this.signer = null;
    this.chainId = null;
  }
}

// Export a singleton instance
export const contractService = new ContractService();