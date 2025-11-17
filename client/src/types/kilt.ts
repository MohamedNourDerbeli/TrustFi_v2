/**
 * KILT Protocol Type Definitions
 * 
 * This file contains TypeScript interfaces for KILT Protocol integration,
 * including DIDs, Verifiable Credentials, Claims, and Verification Results.
 */

/**
 * Authentication method for a DID
 */
export interface AuthenticationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
}

/**
 * Assertion method for a DID
 */
export interface AssertionMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
}

/**
 * Key agreement key for a DID
 */
export interface KeyAgreementKey {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
}

/**
 * Service endpoint for a DID
 */
export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

/**
 * DID Document structure
 * Represents a decentralized identifier document
 */
export interface DidDocument {
  uri: string;
  authentication: AuthenticationMethod[];
  assertionMethod?: AssertionMethod[];
  keyAgreement?: KeyAgreementKey[];
  service?: ServiceEndpoint[];
}

/**
 * Claim contents for a verifiable credential
 */
export interface ClaimContents {
  template_id: string;
  card_id: string;
  tier: number;
  issue_date: string;
  issuer_address: string;
  [key: string]: any;
}

/**
 * Input for creating a claim
 */
export interface ClaimInput {
  cTypeHash: string;
  contents: ClaimContents;
}

/**
 * Verifiable Credential structure
 */
export interface VerifiableCredential {
  credentialId: string;
  holderDid: string;
  issuerDid: string;
  cTypeHash: string;
  claim: ClaimContents;
  signature: string;
  attestationId?: string;
  revoked: boolean;
  createdAt: Date;
}

/**
 * Result of credential verification
 */
export interface VerificationResult {
  valid: boolean;
  issuerDid: string;
  holderDid: string;
  revoked: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * KILT network configuration
 */
export interface KiltConfig {
  network: 'peregrine' | 'spiritnet';
  wssAddress: string;
  enabled: boolean;
  mode: 'database-only' | 'kilt-only' | 'hybrid';
  fallbackToDatabase: boolean;
}

/**
 * Credential type (CType) schema
 */
export interface CTypeSchema {
  title: string;
  properties: {
    template_id: { type: string };
    card_id: { type: string };
    tier: { type: string };
    issue_date: { type: string };
    issuer_address: { type: string };
    [key: string]: { type: string };
  };
  required: string[];
}

/**
 * CType structure
 */
export interface CType {
  schema: CTypeSchema;
  owner: string;
  hash: string;
}

/**
 * Encrypted keys for secure storage
 */
export interface EncryptedKeys {
  encrypted: string;
  nonce: string;
  algorithm: string;
}

/**
 * Attestation result
 */
export interface AttestationResult {
  attestationId: string;
  blockHash: string;
  success: boolean;
}

/**
 * Credential proof for NFT minting
 */
export interface CredentialProof {
  credentialId: string;
  signature: string;
  issuerDid: string;
  holderDid: string;
  timestamp: number;
}

/**
 * NFT metadata
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Mint result
 */
export interface MintResult {
  tokenId: string;
  txHash: string;
  contractAddress: string;
}

/**
 * KILT error codes
 */
export type KiltErrorCode =
  | 'DID_CREATION_FAILED'
  | 'DID_NOT_FOUND'
  | 'CREDENTIAL_INVALID'
  | 'ATTESTATION_FAILED'
  | 'VERIFICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'CTYPE_REGISTRATION_FAILED'
  | 'KEY_ENCRYPTION_FAILED';

/**
 * Custom KILT error interface
 */
export interface KiltError {
  name: 'KiltError';
  message: string;
  code: KiltErrorCode;
  details?: any;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  action: 'DID_CREATED' | 'CREDENTIAL_ISSUED' | 'CREDENTIAL_VERIFIED' | 'CREDENTIAL_REVOKED';
  actor: string;
  subject: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Migration result
 */
export interface MigrationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ claimId: string; error: string }>;
}
