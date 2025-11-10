import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, type SupportedChainId } from '../config/contracts';
import { ReputationCard_ABI } from '../config/ReputationCard.abi';
import {
  type CollectibleFormData,
  type CollectibleTemplate,
  type ClaimStatus,
  type ClaimStats,
  type CreateCollectibleResult,
  type ClaimCollectibleResult,
  type GasEstimate,
  EligibilityType,
} from '../types/collectible';
import { ContractError, NetworkError, ValidationError, TransactionError } from './contractService';

/**
 * Service for interacting with collectible functions in the ReputationCard contract
 */
export class CollectibleContractService {
  private signer: ethers.Signer | null = null;
  private provider: ethers.Provider | null = null;
  private chainId: SupportedChainId | null = null;

  async initialize(provider: ethers.BrowserProvider): Promise<boolean> {
    try {
      this.signer = await provider.getSigner();
      this.provider = provider;
      const network = await provider.getNetwork();
      const chainIdNum = Number(network.chainId);
      this.chainId = chainIdNum.toString() as SupportedChainId;

      if (!CONTRACT_ADDRESSES[this.chainId]) {
        throw new NetworkError(`Unsupported network: ${this.chainId}`);
      }

      return true;
    } catch (error: any) {
      console.error('Failed to initialize collectible contract service:', error);
      throw new NetworkError('Failed to initialize collectible contract service', error);
    }
  }

  isInitialized(): boolean {
    return this.signer !== null && this.chainId !== null;
  }

  private getContract(withSigner: boolean = true): ethers.Contract {
    if (!this.chainId) {
      throw new ContractError('Contract service not initialized');
    }

    if (withSigner && !this.signer) {
      throw new ContractError('Signer not available');
    }

    const address = CONTRACT_ADDRESSES[this.chainId].ReputationCard;
    const signerOrProvider = withSigner ? this.signer! : this.provider!;
    return new ethers.Contract(address, ReputationCard_ABI, signerOrProvider);
  }

  /**
   * Encode eligibility data based on eligibility type
   */
  private encodeEligibilityData(
    eligibilityType: EligibilityType,
    eligibilityConfig: CollectibleFormData['eligibilityConfig']
  ): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    switch (eligibilityType) {
      case EligibilityType.OPEN:
        return '0x';

      case EligibilityType.WHITELIST:
        return '0x';

      case EligibilityType.TOKEN_HOLDER:
        if (!eligibilityConfig.tokenAddress) {
          throw new ValidationError('Token address is required for TOKEN_HOLDER eligibility');
        }
        const minBalance = eligibilityConfig.minBalance || 1;
        return abiCoder.encode(
          ['address', 'uint256'],
          [eligibilityConfig.tokenAddress, minBalance]
        );

      case EligibilityType.PROFILE_REQUIRED:
        const minReputation = eligibilityConfig.minReputationScore || 0;
        return abiCoder.encode(['uint256'], [minReputation]);

      default:
        return '0x';
    }
  }

  /**
   * Create a new collectible template
   * Task 10.1: Add collectible creation functions
   */
  async createCollectible(
    collectibleData: CollectibleFormData,
    signer?: ethers.Signer
  ): Promise<CreateCollectibleResult> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (!collectibleData.category || collectibleData.category.trim().length === 0) {
        throw new ValidationError('Category is required');
      }
      if (!collectibleData.description || collectibleData.description.trim().length === 0) {
        throw new ValidationError('Description is required');
      }
      if (collectibleData.value < 0) {
        throw new ValidationError('Value must be non-negative');
      }
      if (collectibleData.maxSupply < 0) {
        throw new ValidationError('Max supply must be non-negative');
      }

      const startTime = collectibleData.startTime
        ? Math.floor(collectibleData.startTime.getTime() / 1000)
        : 0;
      const endTime = collectibleData.endTime
        ? Math.floor(collectibleData.endTime.getTime() / 1000)
        : 0;

      if (startTime > 0 && endTime > 0 && startTime >= endTime) {
        throw new ValidationError('Start time must be before end time');
      }

      const eligibilityData = this.encodeEligibilityData(
        collectibleData.eligibilityType,
        collectibleData.eligibilityConfig
      );

      const metadataURI = collectibleData.metadataURI || '';

      const tx = await contractWithSigner.createCollectible(
        collectibleData.title,
        collectibleData.category,
        collectibleData.description,
        collectibleData.value,
        collectibleData.maxSupply,
        startTime,
        endTime,
        collectibleData.eligibilityType,
        eligibilityData,
        metadataURI,
        collectibleData.rarityTier
      );

      const receipt = await tx.wait();

      const collectibleCreatedEvent = receipt?.logs
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
        .find((event: any) => event?.name === 'CollectibleCreated');

      if (!collectibleCreatedEvent || !collectibleCreatedEvent.args) {
        throw new ContractError('Failed to get template ID from transaction');
      }

      const templateId = Number(collectibleCreatedEvent.args.templateId);
      const template = await this.getCollectibleTemplate(templateId);

      return {
        templateId,
        txHash: receipt.hash,
        template,
      };
    } catch (error: any) {
      console.error('Failed to create collectible:', error);

      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to create collectibles', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to create collectible', error);
    }
  }

  /**
   * Claim a collectible (user-initiated minting)
   * Task 10.2: Add collectible claiming functions
   */
  async claimCollectible(
    templateId: number,
    signer?: ethers.Signer
  ): Promise<ClaimCollectibleResult> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      // Note: Gas estimation is available via estimateClaimGas method
      // Users can call it separately before claiming if needed

      const tx = await contractWithSigner.claimCollectible(templateId);
      const receipt = await tx.wait();

      const collectibleClaimedEvent = receipt?.logs
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
        .find((event: any) => event?.name === 'CollectibleClaimed');

      if (!collectibleClaimedEvent || !collectibleClaimedEvent.args) {
        throw new ContractError('Failed to get card ID from transaction');
      }

      const cardId = Number(collectibleClaimedEvent.args.cardId);
      const timestamp = Number(collectibleClaimedEvent.args.timestamp);

      return {
        cardId,
        txHash: receipt.hash,
        timestamp,
      };
    } catch (error: any) {
      console.error('Failed to claim collectible:', error);

      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }
      if (error.message?.includes('CollectibleNotActive')) {
        throw new ValidationError('Collectible is not active', error);
      }
      if (error.message?.includes('CollectiblePaused')) {
        throw new ValidationError('Collectible is currently paused', error);
      }
      if (error.message?.includes('ClaimPeriodNotStarted')) {
        throw new ValidationError('Claiming has not started yet', error);
      }
      if (error.message?.includes('ClaimPeriodEnded')) {
        throw new ValidationError('Claiming period has ended', error);
      }
      if (error.message?.includes('MaxSupplyReached')) {
        throw new ValidationError('Maximum supply has been reached', error);
      }
      if (error.message?.includes('AlreadyClaimed')) {
        throw new ValidationError('You have already claimed this collectible', error);
      }
      if (error.message?.includes('NotEligible')) {
        throw new ValidationError('You are not eligible to claim this collectible', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to claim collectible', error);
    }
  }

  /**
   * Check if a user is eligible to claim a collectible
   * Task 10.3: Add eligibility checking functions
   */
  async checkEligibility(
    templateId: number,
    userAddress: string
  ): Promise<ClaimStatus> {
    try {
      const contract = this.getContract(false);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }
      if (!ethers.isAddress(userAddress)) {
        throw new ValidationError('Invalid user address');
      }

      const template = await this.getCollectibleTemplate(templateId);
      const hasClaimed = await contract.hasClaimedCollectible(templateId, userAddress);

      let isEligible = false;
      try {
        isEligible = await contract.isEligibleToClaim(templateId, userAddress);
      } catch (error: any) {
        console.warn('Eligibility check failed:', error);
        isEligible = false;
      }

      const remainingSupply = template.maxSupply === 0
        ? -1
        : template.maxSupply - template.currentSupply;

      const currentTime = Math.floor(Date.now() / 1000);
      const isInTimeWindow =
        (template.startTime === 0 || currentTime >= template.startTime) &&
        (template.endTime === 0 || currentTime <= template.endTime);

      const canClaimNow =
        template.isActive &&
        !template.isPaused &&
        isEligible &&
        !hasClaimed &&
        isInTimeWindow &&
        (template.maxSupply === 0 || remainingSupply > 0);

      let reason: string | undefined;
      if (!template.isActive) {
        reason = 'Collectible is not active';
      } else if (template.isPaused) {
        reason = 'Collectible is currently paused';
      } else if (hasClaimed) {
        reason = 'You have already claimed this collectible';
      } else if (template.startTime > 0 && currentTime < template.startTime) {
        reason = 'Claiming has not started yet';
      } else if (template.endTime > 0 && currentTime > template.endTime) {
        reason = 'Claiming period has ended';
      } else if (template.maxSupply > 0 && remainingSupply <= 0) {
        reason = 'Maximum supply has been reached';
      } else if (!isEligible) {
        reason = 'You do not meet the eligibility requirements';
      }

      return {
        templateId,
        isEligible,
        hasClaimed,
        remainingSupply: remainingSupply < 0 ? Infinity : remainingSupply,
        isActive: template.isActive,
        isPaused: template.isPaused,
        canClaimNow,
        reason,
        startTime: template.startTime > 0 ? template.startTime : undefined,
        endTime: template.endTime > 0 ? template.endTime : undefined,
      };
    } catch (error: any) {
      console.error('Failed to check eligibility:', error);

      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }

      throw new ContractError('Failed to check eligibility', error);
    }
  }

  /**
   * Get all active collectibles
   * Task 10.4: Add collectible query functions
   */
  async getActiveCollectibles(): Promise<CollectibleTemplate[]> {
    try {
      const contract = this.getContract(false);
      const templateIds = await contract.getActiveCollectibles();

      const templates: CollectibleTemplate[] = [];
      for (const templateId of templateIds) {
        try {
          const template = await this.getCollectibleTemplate(Number(templateId));
          templates.push(template);
        } catch (error) {
          console.warn(`Failed to fetch template ${templateId}:`, error);
        }
      }

      return templates;
    } catch (error: any) {
      console.error('Failed to get active collectibles:', error);
      throw new ContractError('Failed to get active collectibles', error);
    }
  }

  /**
   * Get a single collectible template by ID
   * Task 10.4: Add collectible query functions
   */
  async getCollectibleTemplate(templateId: number): Promise<CollectibleTemplate> {
    try {
      const contract = this.getContract(false);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      const templateData = await contract.getCollectibleTemplate(templateId);

      return {
        templateId: Number(templateData.templateId),
        title: templateData.title,
        category: templateData.category,
        description: templateData.description,
        value: Number(templateData.value),
        issuer: templateData.issuer,
        maxSupply: Number(templateData.maxSupply),
        currentSupply: Number(templateData.currentSupply),
        startTime: Number(templateData.startTime),
        endTime: Number(templateData.endTime),
        eligibilityType: Number(templateData.eligibilityType) as EligibilityType,
        eligibilityData: templateData.eligibilityData,
        isPaused: templateData.isPaused,
        isActive: templateData.isActive,
        metadataURI: templateData.metadataURI,
        rarityTier: Number(templateData.rarityTier) as any, // Cast to RarityTier type
      };
    } catch (error: any) {
      console.error('Failed to get collectible template:', error);

      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }

      throw new ContractError('Failed to get collectible template', error);
    }
  }

  /**
   * Get claim statistics for a collectible
   * Task 10.4: Add collectible query functions
   */
  async getClaimStats(templateId: number): Promise<ClaimStats> {
    try {
      const contract = this.getContract(false);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      const stats = await contract.getClaimStats(templateId);

      return {
        totalClaims: Number(stats.totalClaims),
        remainingSupply: Number(stats.remainingSupply),
        isActive: stats.isActive,
      };
    } catch (error: any) {
      console.error('Failed to get claim stats:', error);

      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }

      throw new ContractError('Failed to get claim stats', error);
    }
  }

  /**
   * Get all collectibles created by a specific issuer
   * Task 10.4: Add collectible query functions
   */
  async getCollectiblesByIssuer(issuerAddress: string): Promise<CollectibleTemplate[]> {
    try {
      const contract = this.getContract(false);

      if (!ethers.isAddress(issuerAddress)) {
        throw new ValidationError('Invalid issuer address');
      }

      const templateIds = await contract.getCollectiblesByIssuer(issuerAddress);

      const templates: CollectibleTemplate[] = [];
      for (const templateId of templateIds) {
        try {
          const template = await this.getCollectibleTemplate(Number(templateId));
          templates.push(template);
        } catch (error) {
          console.warn(`Failed to fetch template ${templateId}:`, error);
        }
      }

      return templates;
    } catch (error: any) {
      console.error('Failed to get collectibles by issuer:', error);
      throw new ContractError('Failed to get collectibles by issuer', error);
    }
  }

  /**
   * Pause a collectible to prevent claiming
   * Task 10.5: Add collectible management functions
   */
  async pauseCollectible(
    templateId: number,
    signer?: ethers.Signer
  ): Promise<string> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      const tx = await contractWithSigner.pauseCollectible(templateId);
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to pause collectible:', error);

      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to pause this collectible', error);
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to pause collectible', error);
    }
  }

  /**
   * Resume a paused collectible to allow claiming
   * Task 10.5: Add collectible management functions
   */
  async resumeCollectible(
    templateId: number,
    signer?: ethers.Signer
  ): Promise<string> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      const tx = await contractWithSigner.resumeCollectible(templateId);
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to resume collectible:', error);

      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to resume this collectible', error);
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to resume collectible', error);
    }
  }

  /**
   * Update collectible metadata (only before first claim)
   * Task 10.5: Add collectible management functions
   */
  async updateCollectibleMetadata(
    templateId: number,
    metadata: {
      category?: string;
      description?: string;
      metadataURI?: string;
    },
    signer?: ethers.Signer
  ): Promise<string> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      const currentTemplate = await this.getCollectibleTemplate(templateId);

      const category = metadata.category || currentTemplate.category;
      const description = metadata.description || currentTemplate.description;
      const metadataURI = metadata.metadataURI || currentTemplate.metadataURI;

      const tx = await contractWithSigner.updateCollectibleMetadata(
        templateId,
        category,
        description,
        metadataURI
      );

      const receipt = await tx.wait();

      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to update collectible metadata:', error);

      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to update this collectible', error);
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }
      if (error.message?.includes('CannotEditAfterClaims')) {
        throw new ValidationError('Cannot edit metadata after claims have been made', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to update collectible metadata', error);
    }
  }

  /**
   * Add addresses to collectible whitelist
   * Task 10.5: Add collectible management functions
   */
  async addToWhitelist(
    templateId: number,
    addresses: string[],
    signer?: ethers.Signer
  ): Promise<string> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      if (!addresses || addresses.length === 0) {
        throw new ValidationError('At least one address is required');
      }

      for (const address of addresses) {
        if (!ethers.isAddress(address)) {
          throw new ValidationError(`Invalid address: ${address}`);
        }
      }

      const tx = await contractWithSigner.addToWhitelist(templateId, addresses);
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to add to whitelist:', error);

      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to manage this whitelist', error);
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to add to whitelist', error);
    }
  }

  /**
   * Remove addresses from collectible whitelist
   * Task 10.5: Add collectible management functions
   */
  async removeFromWhitelist(
    templateId: number,
    addresses: string[],
    signer?: ethers.Signer
  ): Promise<string> {
    try {
      const contractSigner = signer || this.signer;
      if (!contractSigner) {
        throw new ContractError('Signer not available');
      }

      const contract = this.getContract(true);
      const contractWithSigner = contract.connect(contractSigner);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }

      if (!addresses || addresses.length === 0) {
        throw new ValidationError('At least one address is required');
      }

      for (const address of addresses) {
        if (!ethers.isAddress(address)) {
          throw new ValidationError(`Invalid address: ${address}`);
        }
      }

      const tx = await contractWithSigner.removeFromWhitelist(templateId, addresses);
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to remove from whitelist:', error);

      if (error instanceof ValidationError) {
        throw error;
      }
      if (error.message?.includes('UnauthorizedIssuer')) {
        throw new ValidationError('You are not authorized to manage this whitelist', error);
      }
      if (error.message?.includes('CollectibleNotFound')) {
        throw new ValidationError('Collectible not found', error);
      }
      if (error.message?.includes('user rejected')) {
        throw new TransactionError('Transaction was rejected by user', error);
      }

      throw new TransactionError('Failed to remove from whitelist', error);
    }
  }

  /**
   * Estimate gas cost for claiming a collectible
   * Task 10.6: Add gas estimation function
   */
  async estimateClaimGas(
    templateId: number,
    userAddress: string
  ): Promise<GasEstimate> {
    try {
      const contract = this.getContract(false);

      if (templateId <= 0) {
        throw new ValidationError('Invalid template ID');
      }
      if (!ethers.isAddress(userAddress)) {
        throw new ValidationError('Invalid user address');
      }

      let gasLimit: bigint;
      try {
        gasLimit = await contract.claimCollectible.estimateGas(templateId, {
          from: userAddress,
        });
      } catch (error: any) {
        console.warn('Gas estimation failed, using default:', error);
        gasLimit = BigInt(300000);
      }

      if (!this.provider) {
        throw new ContractError('Provider not available');
      }

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      const gasCostWei = gasLimit * gasPrice;
      const gasCostEth = ethers.formatEther(gasCostWei);

      let gasCostUsd: string | undefined;
      try {
        gasCostUsd = await this.fetchEthUsdPrice(gasCostEth);
      } catch (error) {
        console.warn('Failed to fetch ETH/USD price:', error);
      }

      return {
        gasLimit,
        gasCostEth,
        gasCostUsd,
        gasPrice,
      };
    } catch (error: any) {
      console.error('Failed to estimate claim gas:', error);

      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ContractError('Failed to estimate claim gas', error);
    }
  }

  /**
   * Fetch ETH/USD price from a public API
   */
  private async fetchEthUsdPrice(ethAmount: string): Promise<string> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ETH price');
      }

      const data = await response.json();
      const ethUsdPrice = data.ethereum?.usd;

      if (!ethUsdPrice) {
        throw new Error('ETH price not available');
      }

      const ethValue = parseFloat(ethAmount);
      const usdValue = ethValue * ethUsdPrice;

      return usdValue.toFixed(2);
    } catch (error) {
      console.warn('Failed to fetch ETH/USD price:', error);
      throw error;
    }
  }

  /**
   * Get the minting mode for a specific card
   * Returns DIRECT (0) or COLLECTIBLE (1)
   */
  async getCardMintingMode(cardId: number): Promise<number> {
    try {
      const contract = this.getContract(false);

      if (cardId <= 0) {
        throw new ValidationError('Invalid card ID');
      }

      const mintingMode = await contract.getCardMintingMode(cardId);
      return Number(mintingMode);
    } catch (error: any) {
      console.error('Failed to get card minting mode:', error);
      // Default to DIRECT mode if function doesn't exist or fails
      return 0;
    }
  }

  getCurrentChainId(): SupportedChainId | null {
    return this.chainId;
  }

  getContractAddress(): string {
    if (!this.chainId) {
      throw new ContractError('Contract service not initialized');
    }
    const address = CONTRACT_ADDRESSES[this.chainId]?.ReputationCard;
    if (!address) {
      throw new ContractError(`No contract address found for chain ${this.chainId}`);
    }
    return address;
  }

  reset(): void {
    this.signer = null;
    this.provider = null;
    this.chainId = null;
  }
}

// Export singleton instance
export const collectibleContractService = new CollectibleContractService();
