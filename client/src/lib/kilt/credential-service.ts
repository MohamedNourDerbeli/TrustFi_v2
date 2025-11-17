/**
 * Credential Service
 * 
 * Handles verifiable credential operations including creation, signing,
 * verification, and storage.
 */

import * as Kilt from '@kiltprotocol/sdk-js';
import { supabase } from '../supabase';
import type {
  ClaimInput,
  DidDocument,
  VerifiableCredential,
  VerificationResult,
} from '../../types/kilt';

/**
 * Credential type for KILT SDK operations
 * This is a simplified interface for working with KILT credentials
 */
interface Credential {
  claim: {
    cTypeHash: string;
    contents: Record<string, any>;
    owner: string;
  };
}

/**
 * Signed credential with cryptographic proof
 */
interface SignedCredential extends Credential {
  claimerSignature: {
    signature: string;
    keyUri: string;
  };
}

/**
 * Create a verifiable credential from a claim
 * 
 * @param claim - The claim input containing cTypeHash and contents
 * @param issuerDid - The issuer's DID document
 * @returns Credential object ready for signing
 */
export async function createCredential(
  claim: ClaimInput,
  issuerDid: DidDocument
): Promise<Credential> {
  try {
    console.log('[Credential Service] Creating credential...');

    // Validate claim input
    if (!claim.cTypeHash || !claim.contents) {
      throw new Error('Invalid claim input: missing cTypeHash or contents');
    }

    // Validate required fields
    const requiredFields = ['template_id', 'card_id', 'tier', 'issue_date', 'issuer_address'];
    for (const field of requiredFields) {
      if (!(field in claim.contents)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Create credential structure
    const credential: Credential = {
      claim: {
        cTypeHash: claim.cTypeHash,
        contents: claim.contents,
        owner: issuerDid.uri,
      },
    };

    console.log('[Credential Service] Credential created successfully');
    return credential;
  } catch (error) {
    console.error('[Credential Service] Failed to create credential:', error);
    throw new Error(`Credential creation failed: ${(error as Error).message}`);
  }
}

/**
 * Sign a credential with the issuer's DID
 * 
 * @param credential - The credential to sign
 * @param issuerDid - The issuer's DID document with signing keys
 * @returns Signed credential with cryptographic signature
 */
export async function signCredential(
  credential: Credential,
  issuerDid: DidDocument
): Promise<SignedCredential> {
  try {
    console.log('[Credential Service] Signing credential...');

    // For MVP, we'll create a simplified signature
    // In production, use proper KILT SDK signing methods with actual keypairs
    
    // Get the authentication key URI
    const authKey = issuerDid.authentication[0];
    if (!authKey) {
      throw new Error('No authentication key found in issuer DID');
    }

    // Create a deterministic signature based on credential contents
    // NOTE: This is a simplified approach for MVP
    // In production, use actual cryptographic signing with the issuer's private key
    const credentialString = JSON.stringify(credential.claim);
    const signatureData = `${credentialString}::${issuerDid.uri}::${Date.now()}`;
    
    // Simple hash-based signature (NOT CRYPTOGRAPHICALLY SECURE - replace in production)
    const signature = btoa(signatureData);

    const signedCredential: SignedCredential = {
      ...credential,
      claimerSignature: {
        signature,
        keyUri: authKey.id,
      },
    };

    console.log('[Credential Service] Credential signed successfully');
    return signedCredential;
  } catch (error) {
    console.error('[Credential Service] Failed to sign credential:', error);
    throw new Error(`Credential signing failed: ${(error as Error).message}`);
  }
}

/**
 * Verify a signed credential
 * Checks signature validity and revocation status
 * 
 * @param credential - The signed credential to verify
 * @returns Verification result with validity status and details
 */
export async function verifyCredential(
  credential: SignedCredential
): Promise<VerificationResult> {
  try {
    console.log('[Credential Service] Verifying credential...');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate credential structure
    if (!credential.claim || !credential.claimerSignature) {
      errors.push('Invalid credential structure');
      return {
        valid: false,
        issuerDid: credential.claim?.owner || '',
        holderDid: '',
        revoked: false,
        errors,
      };
    }

    // Extract issuer and holder DIDs
    const issuerDid = credential.claim.owner;
    const holderDid = credential.claim.contents.holder_did || '';

    // Check if credential exists in database and is revoked
    const { data: dbCredential, error: dbError } = await supabase
      .from('verifiable_credentials')
      .select('revoked, credential_id')
      .eq('issuer_did', issuerDid)
      .eq('holder_did', holderDid)
      .single();

    let revoked = false;
    if (!dbError && dbCredential) {
      revoked = dbCredential.revoked;
      if (revoked) {
        warnings.push('Credential has been revoked');
      }
    }

    // Verify signature (simplified for MVP)
    // In production, use proper cryptographic verification
    const isSignatureValid = credential.claimerSignature.signature.length > 0;
    
    if (!isSignatureValid) {
      errors.push('Invalid signature');
    }

    // Verify CType hash exists
    if (!credential.claim.cTypeHash) {
      errors.push('Missing CType hash');
    }

    const valid = errors.length === 0 && !revoked;

    const result: VerificationResult = {
      valid,
      issuerDid,
      holderDid,
      revoked,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    console.log(`[Credential Service] Verification complete: ${valid ? 'VALID' : 'INVALID'}`);
    return result;
  } catch (error) {
    console.error('[Credential Service] Verification failed:', error);
    return {
      valid: false,
      issuerDid: '',
      holderDid: '',
      revoked: false,
      errors: [`Verification error: ${(error as Error).message}`],
    };
  }
}

/**
 * Store a signed credential in Supabase
 * 
 * @param credential - The signed credential to store
 * @param cardId - The associated card ID
 * @param templateId - The associated template ID
 * @returns The credential ID
 */
export async function storeCredential(
  credential: SignedCredential,
  cardId: string,
  templateId: string
): Promise<string> {
  try {
    console.log('[Credential Service] Storing credential...');

    // Generate unique credential ID
    const credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract holder DID from claim contents
    const holderDid = credential.claim.contents.holder_did || '';

    // Prepare credential data for storage
    // Note: ctype_hash is stored inside credential_data JSONB, not as a separate column
    const credentialData = {
      credential_id: credentialId,
      holder_did: holderDid,
      issuer_did: credential.claim.owner,
      credential_data: {
        claim: credential.claim,
        signature: credential.claimerSignature,
        ctype_hash: credential.claim.cTypeHash, // Store ctype_hash in the JSONB
      },
      card_id: cardId,
      template_id: templateId,
      revoked: false,
    };

    const { error } = await supabase
      .from('verifiable_credentials')
      .insert(credentialData);

    if (error) {
      throw new Error(`Failed to store credential: ${error.message}`);
    }

    console.log(`[Credential Service] Credential stored with ID: ${credentialId}`);
    return credentialId;
  } catch (error) {
    console.error('[Credential Service] Failed to store credential:', error);
    throw new Error(`Credential storage failed: ${(error as Error).message}`);
  }
}

/**
 * Get all credentials for a holder DID
 * 
 * @param holderDid - The holder's DID URI
 * @returns Array of verifiable credentials
 */
export async function getCredentialsByHolder(
  holderDid: string
): Promise<VerifiableCredential[]> {
  try {
    console.log(`[Credential Service] Fetching credentials for holder: ${holderDid}`);

    const { data, error } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .eq('holder_did', holderDid)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('[Credential Service] No credentials found');
      return [];
    }

    // Transform database records to VerifiableCredential format
    const credentials: VerifiableCredential[] = data.map(record => ({
      credentialId: record.credential_id,
      holderDid: record.holder_did,
      issuerDid: record.issuer_did,
      cTypeHash: record.credential_data.ctype_hash || record.credential_data.claim.cTypeHash,
      claim: record.credential_data.claim.contents,
      signature: record.credential_data.signature.signature,
      attestationId: record.attestation_id,
      revoked: record.revoked,
      createdAt: new Date(record.created_at),
    }));

    console.log(`[Credential Service] Found ${credentials.length} credentials`);
    return credentials;
  } catch (error) {
    console.error('[Credential Service] Failed to fetch credentials:', error);
    throw new Error(`Failed to fetch credentials: ${(error as Error).message}`);
  }
}

/**
 * Get a specific credential by ID
 * 
 * @param credentialId - The credential ID to fetch
 * @returns The verifiable credential or null if not found
 */
export async function getCredentialById(
  credentialId: string
): Promise<VerifiableCredential | null> {
  try {
    console.log(`[Credential Service] Fetching credential: ${credentialId}`);

    const { data, error } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .eq('credential_id', credentialId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Credential Service] Credential not found');
        return null;
      }
      throw new Error(`Failed to fetch credential: ${error.message}`);
    }

    const credential: VerifiableCredential = {
      credentialId: data.credential_id,
      holderDid: data.holder_did,
      issuerDid: data.issuer_did,
      cTypeHash: data.credential_data.ctype_hash || data.credential_data.claim.cTypeHash,
      claim: data.credential_data.claim.contents,
      signature: data.credential_data.signature.signature,
      attestationId: data.attestation_id,
      revoked: data.revoked,
      createdAt: new Date(data.created_at),
    };

    return credential;
  } catch (error) {
    console.error('[Credential Service] Failed to fetch credential:', error);
    throw error;
  }
}

/**
 * Store a pending credential for a claim link
 * The credential is created but holder_did is null until claimed
 * 
 * @param credential - The signed credential to store
 * @param templateId - The associated template ID
 * @param claimNonce - The nonce from the claim link
 * @returns The credential ID
 */
export async function storePendingCredential(
  credential: SignedCredential,
  templateId: string,
  claimNonce: string
): Promise<string> {
  try {
    console.log('[Credential Service] Storing pending credential...');

    // Generate unique credential ID
    const credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare credential data for storage with null holder_did (pending claim)
    const credentialData = {
      credential_id: credentialId,
      holder_did: '', // Empty until claimed
      issuer_did: credential.claim.owner,
      credential_data: {
        claim: credential.claim,
        signature: credential.claimerSignature,
        ctype_hash: credential.claim.cTypeHash,
      },
      card_id: null, // Will be set when claimed
      template_id: templateId,
      claim_nonce: claimNonce,
      revoked: false,
    };

    const { error } = await supabase
      .from('verifiable_credentials')
      .insert(credentialData);

    if (error) {
      throw new Error(`Failed to store pending credential: ${error.message}`);
    }

    console.log(`[Credential Service] Pending credential stored with ID: ${credentialId}`);
    return credentialId;
  } catch (error) {
    console.error('[Credential Service] Failed to store pending credential:', error);
    throw new Error(`Pending credential storage failed: ${(error as Error).message}`);
  }
}

/**
 * Get a pending credential by claim nonce
 * 
 * @param claimNonce - The nonce from the claim link
 * @returns The verifiable credential or null if not found
 */
export async function getPendingCredentialByNonce(
  claimNonce: string
): Promise<VerifiableCredential | null> {
  try {
    console.log(`[Credential Service] Fetching pending credential for nonce: ${claimNonce}`);

    const { data, error } = await supabase
      .from('verifiable_credentials')
      .select('*')
      .eq('claim_nonce', claimNonce)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Credential Service] No pending credential found for nonce');
        return null;
      }
      throw new Error(`Failed to fetch pending credential: ${error.message}`);
    }

    const credential: VerifiableCredential = {
      credentialId: data.credential_id,
      holderDid: data.holder_did,
      issuerDid: data.issuer_did,
      cTypeHash: data.credential_data.ctype_hash || data.credential_data.claim.cTypeHash,
      claim: data.credential_data.claim.contents,
      signature: data.credential_data.signature.signature,
      attestationId: data.attestation_id,
      revoked: data.revoked,
      createdAt: new Date(data.created_at),
    };

    return credential;
  } catch (error) {
    console.error('[Credential Service] Failed to fetch pending credential:', error);
    throw error;
  }
}

/**
 * Update a pending credential with holder DID and card ID after claim
 * 
 * @param credentialId - The credential ID to update
 * @param holderDid - The holder's DID
 * @param cardId - The claimed card ID
 */
export async function updatePendingCredential(
  credentialId: string,
  holderDid: string,
  cardId: string
): Promise<void> {
  try {
    console.log(`[Credential Service] Updating pending credential: ${credentialId}`);

    const { error } = await supabase
      .from('verifiable_credentials')
      .update({
        holder_did: holderDid,
        card_id: cardId,
      })
      .eq('credential_id', credentialId);

    if (error) {
      throw new Error(`Failed to update pending credential: ${error.message}`);
    }

    console.log('[Credential Service] Pending credential updated successfully');
  } catch (error) {
    console.error('[Credential Service] Failed to update pending credential:', error);
    throw error;
  }
}

/**
 * Revoke a credential
 * 
 * @param credentialId - The credential ID to revoke
 */
export async function revokeCredential(credentialId: string): Promise<void> {
  try {
    console.log(`[Credential Service] Revoking credential: ${credentialId}`);

    const { error } = await supabase
      .from('verifiable_credentials')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('credential_id', credentialId);

    if (error) {
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }

    console.log('[Credential Service] Credential revoked successfully');
  } catch (error) {
    console.error('[Credential Service] Failed to revoke credential:', error);
    throw error;
  }
}
