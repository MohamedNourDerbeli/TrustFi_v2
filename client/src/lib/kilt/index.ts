/**
 * KILT Library Exports
 * 
 * Central export point for all KILT-related services and utilities.
 */

// Core services
export { kiltService, KiltService } from './kilt-service';
export {
  storeDid,
  getDid,
  generateDidForUser,
  generateDidForIssuer,
  decryptKeys,
  clearDidCache,
  getCacheStats,
} from './did-manager';
export {
  createCredential,
  signCredential,
  verifyCredential,
  storeCredential,
  getCredentialsByHolder,
  getCredentialById,
  revokeCredential,
} from './credential-service';
export {
  getCTypeHash,
  getCTypeSchema,
  validateClaimContents,
  createCType,
  getCTypeInfo,
  REPUTATION_CARD_SCHEMA,
} from './ctype-manager';
