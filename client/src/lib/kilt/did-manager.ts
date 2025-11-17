/**
 * DID Manager
 * 
 * Manages DID lifecycle including creation, storage, retrieval, and caching.
 * Handles both user and issuer DIDs with appropriate security measures.
 */

import { kiltService } from './kilt-service';
import { supabase } from '../supabase';
import type { DidDocument, EncryptedKeys } from '../../types/kilt';

/**
 * In-memory cache for DIDs to avoid repeated database queries
 */
interface DidCache {
  [key: string]: {
    did: DidDocument;
    timestamp: number;
  };
}

const didCache: DidCache = {};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Store a DID in Supabase
 * 
 * @param walletAddress - The wallet address associated with the DID
 * @param did - The DID document to store
 * @param isIssuer - Whether this is an issuer DID (stored in issuer_dids table)
 * @param encryptedKeys - Optional encrypted keys for issuer DIDs
 */
export async function storeDid(
  walletAddress: string,
  did: DidDocument,
  isIssuer: boolean,
  encryptedKeys?: string
): Promise<void> {
  try {
    const tableName = isIssuer ? 'issuer_dids' : 'user_dids';
    const addressColumn = isIssuer ? 'issuer_address' : 'wallet_address';

    const data = {
      [addressColumn]: walletAddress.toLowerCase(),
      did_uri: did.uri,
      did_document: did,
      ...(isIssuer && encryptedKeys ? { encrypted_keys: encryptedKeys } : {}),
    };

    const { error } = await supabase
      .from(tableName)
      .upsert(data, {
        onConflict: addressColumn,
      });

    if (error) {
      throw new Error(`Failed to store DID: ${error.message}`);
    }

    // Update cache
    const cacheKey = `${walletAddress.toLowerCase()}_${isIssuer}`;
    didCache[cacheKey] = {
      did,
      timestamp: Date.now(),
    };

    console.log(`[DID Manager] Stored ${isIssuer ? 'issuer' : 'user'} DID for ${walletAddress}`);
  } catch (error) {
    console.error('[DID Manager] Failed to store DID:', error);
    throw error;
  }
}

/**
 * Retrieve a DID from Supabase
 * Uses caching to avoid repeated database queries
 * 
 * @param walletAddress - The wallet address to look up
 * @param isIssuer - Whether to look in issuer_dids table
 * @returns DidDocument if found, null otherwise
 */
export async function getDid(
  walletAddress: string,
  isIssuer: boolean
): Promise<DidDocument | null> {
  try {
    const cacheKey = `${walletAddress.toLowerCase()}_${isIssuer}`;
    
    // Check cache first
    const cached = didCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[DID Manager] Cache hit for ${walletAddress}`);
      return cached.did;
    }

    // Query database
    const tableName = isIssuer ? 'issuer_dids' : 'user_dids';
    const addressColumn = isIssuer ? 'issuer_address' : 'wallet_address';

    const { data, error } = await supabase
      .from(tableName)
      .select('did_uri, did_document')
      .eq(addressColumn, walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - DID doesn't exist
        console.log(`[DID Manager] No DID found for ${walletAddress}`);
        return null;
      }
      throw new Error(`Failed to retrieve DID: ${error.message}`);
    }

    if (!data || !data.did_document) {
      return null;
    }

    const didDocument = data.did_document as DidDocument;

    // Update cache
    didCache[cacheKey] = {
      did: didDocument,
      timestamp: Date.now(),
    };

    console.log(`[DID Manager] Retrieved DID for ${walletAddress}`);
    return didDocument;
  } catch (error) {
    console.error('[DID Manager] Failed to retrieve DID:', error);
    throw error;
  }
}

/**
 * Generate and store a DID for a user
 * Combines DID creation and storage in a single operation
 * 
 * @param walletAddress - The user's wallet address
 * @returns The created DidDocument
 */
export async function generateDidForUser(walletAddress: string): Promise<DidDocument> {
  try {
    console.log(`[DID Manager] Generating DID for user ${walletAddress}`);

    // Check if DID already exists
    const existingDid = await getDid(walletAddress, false);
    if (existingDid) {
      console.log(`[DID Manager] DID already exists for user ${walletAddress}`);
      return existingDid;
    }

    // Create new light DID
    const did = await kiltService.createLightDid();

    // Store in database
    await storeDid(walletAddress, did, false);

    console.log(`[DID Manager] Successfully generated DID for user ${walletAddress}`);
    return did;
  } catch (error) {
    console.error('[DID Manager] Failed to generate user DID:', error);
    throw new Error(`Failed to generate user DID: ${(error as Error).message}`);
  }
}

/**
 * Generate and store a DID for an issuer
 * Includes key encryption for secure storage
 * 
 * @param issuerAddress - The issuer's wallet address
 * @returns The created DidDocument
 */
export async function generateDidForIssuer(issuerAddress: string): Promise<DidDocument> {
  try {
    console.log(`[DID Manager] Generating DID for issuer ${issuerAddress}`);

    // Check if DID already exists
    const existingDid = await getDid(issuerAddress, true);
    if (existingDid) {
      console.log(`[DID Manager] DID already exists for issuer ${issuerAddress}`);
      return existingDid;
    }

    // Create new light DID
    const did = await kiltService.createLightDid();

    // Encrypt keys for secure storage
    // In production, use a proper encryption key from environment
    const encryptionKey = import.meta.env.VITE_KILT_ENCRYPTION_KEY || 'default-key-change-in-production';
    const encryptedKeys = await encryptKeys(did, encryptionKey);

    // Store in database with encrypted keys
    await storeDid(issuerAddress, did, true, encryptedKeys);

    console.log(`[DID Manager] Successfully generated DID for issuer ${issuerAddress}`);
    return did;
  } catch (error) {
    console.error('[DID Manager] Failed to generate issuer DID:', error);
    throw new Error(`Failed to generate issuer DID: ${(error as Error).message}`);
  }
}

/**
 * Encrypt DID keys for secure storage
 * Uses a simple encryption approach - in production, use proper key management
 * 
 * @param did - The DID document containing keys
 * @param encryptionKey - The encryption key to use
 * @returns Encrypted keys as a string
 */
async function encryptKeys(did: DidDocument, encryptionKey: string): Promise<string> {
  try {
    // For MVP, we'll store a simple encrypted representation
    // In production, use proper encryption libraries like @noble/ciphers or Web Crypto API
    const keysData = JSON.stringify({
      uri: did.uri,
      authentication: did.authentication,
      assertionMethod: did.assertionMethod,
      keyAgreement: did.keyAgreement,
    });

    // Simple base64 encoding for MVP (NOT SECURE - replace in production)
    const encrypted = btoa(keysData + '::' + encryptionKey);
    
    return encrypted;
  } catch (error) {
    console.error('[DID Manager] Failed to encrypt keys:', error);
    throw new Error(`Key encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypt DID keys from storage
 * 
 * @param encryptedKeys - The encrypted keys string
 * @param encryptionKey - The encryption key to use
 * @returns Decrypted keys data
 */
export async function decryptKeys(
  encryptedKeys: string,
  encryptionKey: string
): Promise<Partial<DidDocument>> {
  try {
    // Simple base64 decoding for MVP (NOT SECURE - replace in production)
    const decrypted = atob(encryptedKeys);
    const [keysData, storedKey] = decrypted.split('::');
    
    if (storedKey !== encryptionKey) {
      throw new Error('Invalid encryption key');
    }

    return JSON.parse(keysData);
  } catch (error) {
    console.error('[DID Manager] Failed to decrypt keys:', error);
    throw new Error(`Key decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Clear the DID cache
 * Useful for testing or when forcing a refresh
 */
export function clearDidCache(): void {
  Object.keys(didCache).forEach(key => delete didCache[key]);
  console.log('[DID Manager] Cache cleared');
}

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: Object.keys(didCache).length,
    keys: Object.keys(didCache),
  };
}
