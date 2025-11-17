/**
 * KILT Service
 * 
 * Core service for KILT Protocol operations including connection management,
 * DID operations, and credential handling.
 */

import * as Kilt from '@kiltprotocol/sdk-js';
import type { DidDocument } from '../../types/kilt';

/**
 * KILT Service configuration
 */
interface KiltServiceConfig {
  network: 'peregrine' | 'spiritnet';
  wssAddress: string;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Default configuration for Peregrine testnet
 */
const DEFAULT_CONFIG: KiltServiceConfig = {
  network: 'peregrine',
  wssAddress: import.meta.env.VITE_KILT_WSS_ADDRESS || 'wss://peregrine.kilt.io',
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * KILT Service class
 * Singleton service for managing KILT Protocol operations
 */
class KiltService {
  private static instance: KiltService | null = null;
  private config: KiltServiceConfig;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor(config: KiltServiceConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Get singleton instance of KiltService
   */
  public static getInstance(): KiltService {
    if (!KiltService.instance) {
      KiltService.instance = new KiltService();
    }
    return KiltService.instance;
  }

  /**
   * Initialize connection to KILT blockchain
   * Implements retry logic for connection failures
   */
  public async initKiltConnection(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // Create new initialization promise
    this.initializationPromise = this._initWithRetry();
    
    try {
      await this.initializationPromise;
      this.isInitialized = true;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Internal initialization with retry logic
   */
  private async _initWithRetry(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`[KILT] Connecting to ${this.config.network} (attempt ${attempt}/${this.config.maxRetries})...`);
        
        // Connect to KILT blockchain
        await Kilt.connect(this.config.wssAddress);
        
        console.log(`[KILT] Successfully connected to ${this.config.network}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`[KILT] Connection attempt ${attempt} failed:`, error);

        // Don't retry on last attempt
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt; // Exponential backoff
          console.log(`[KILT] Retrying in ${delay}ms...`);
          await this._sleep(delay);
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to connect to KILT network after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Create a light DID (Decentralized Identifier)
   * Light DIDs are stored off-chain and don't require blockchain transactions
   * 
   * @param mnemonic - Optional mnemonic for key generation. If not provided, generates new one.
   * @returns DidDocument containing the DID URI and authentication methods
   */
  public async createLightDid(mnemonic?: string): Promise<DidDocument> {
    await this.ensureInitialized();

    try {
      // Generate or use provided mnemonic
      const mnemonicPhrase = mnemonic || Kilt.Utils.Crypto.mnemonicGenerate();
      
      // Create keypairs from mnemonic using the correct API
      const authKeyPair = Kilt.Utils.Crypto.makeKeypairFromUri(mnemonicPhrase, 'sr25519');
      
      // Create light DID document
      const lightDidDocument = Kilt.Did.createLightDidDocument({
        authentication: [authKeyPair],
      });

      // Convert to our simplified DidDocument format
      const didDocument: DidDocument = {
        uri: lightDidDocument.uri,
        authentication: lightDidDocument.authentication.map((auth: any) => ({
          id: auth.id,
          type: auth.type || 'Sr25519VerificationKey2020',
          controller: lightDidDocument.uri,
          publicKeyMultibase: auth.publicKeyMultibase,
        })),
        assertionMethod: lightDidDocument.assertionMethod?.map((assertion: any) => ({
          id: assertion.id,
          type: assertion.type || 'Sr25519VerificationKey2020',
          controller: lightDidDocument.uri,
          publicKeyMultibase: assertion.publicKeyMultibase,
        })),
        keyAgreement: lightDidDocument.keyAgreement?.map((keyAgr: any) => ({
          id: keyAgr.id,
          type: keyAgr.type || 'X25519KeyAgreementKey2020',
          controller: lightDidDocument.uri,
          publicKeyMultibase: keyAgr.publicKeyMultibase,
        })),
        service: lightDidDocument.service?.map((svc: any) => ({
          id: svc.id,
          type: Array.isArray(svc.type) ? svc.type[0] : svc.type,
          serviceEndpoint: Array.isArray(svc.serviceEndpoint) 
            ? svc.serviceEndpoint[0] 
            : svc.serviceEndpoint,
        })),
      };

      console.log(`[KILT] Created light DID: ${didDocument.uri}`);
      return didDocument;
    } catch (error) {
      console.error('[KILT] Failed to create light DID:', error);
      throw new Error(`DID creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Resolve a DID to get its document
   * 
   * @param didUri - The DID URI to resolve (e.g., "did:kilt:4...")
   * @returns DidDocument if found, null if not found
   */
  public async resolveDid(didUri: string): Promise<DidDocument | null> {
    await this.ensureInitialized();

    try {
      console.log(`[KILT] Resolving DID: ${didUri}`);
      
      // Resolve DID from KILT blockchain
      const resolvedDid = await Kilt.Did.resolve(didUri as any);

      if (!resolvedDid || !resolvedDid.document) {
        console.log(`[KILT] DID not found: ${didUri}`);
        return null;
      }

      // Convert to our DidDocument format
      const didDocument: DidDocument = {
        uri: resolvedDid.document.uri,
        authentication: resolvedDid.document.authentication.map((auth: any) => ({
          id: auth.id,
          type: auth.type || 'Sr25519VerificationKey2020',
          controller: resolvedDid.document.uri,
          publicKeyMultibase: auth.publicKeyMultibase,
        })),
        assertionMethod: resolvedDid.document.assertionMethod?.map((assertion: any) => ({
          id: assertion.id,
          type: assertion.type || 'Sr25519VerificationKey2020',
          controller: resolvedDid.document.uri,
          publicKeyMultibase: assertion.publicKeyMultibase,
        })),
        keyAgreement: resolvedDid.document.keyAgreement?.map((keyAgr: any) => ({
          id: keyAgr.id,
          type: keyAgr.type || 'X25519KeyAgreementKey2020',
          controller: resolvedDid.document.uri,
          publicKeyMultibase: keyAgr.publicKeyMultibase,
        })),
        service: resolvedDid.document.service?.map((svc: any) => ({
          id: svc.id,
          type: Array.isArray(svc.type) ? svc.type[0] : svc.type,
          serviceEndpoint: Array.isArray(svc.serviceEndpoint) 
            ? svc.serviceEndpoint[0] 
            : svc.serviceEndpoint,
        })),
      };

      console.log(`[KILT] Successfully resolved DID: ${didUri}`);
      return didDocument;
    } catch (error) {
      console.error(`[KILT] Failed to resolve DID ${didUri}:`, error);
      // Return null instead of throwing to allow graceful handling
      return null;
    }
  }

  /**
   * Ensure KILT connection is initialized
   * Automatically initializes if not already done
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initKiltConnection();
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Disconnect from KILT blockchain
   * Useful for cleanup in tests or when shutting down
   */
  public async disconnect(): Promise<void> {
    if (this.isInitialized) {
      try {
        await Kilt.disconnect();
        this.isInitialized = false;
        console.log('[KILT] Disconnected from network');
      } catch (error) {
        console.error('[KILT] Error during disconnect:', error);
      }
    }
  }

  /**
   * Check if service is initialized
   */
  public isConnected(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const kiltService = KiltService.getInstance();

// Export class for testing
export { KiltService };
