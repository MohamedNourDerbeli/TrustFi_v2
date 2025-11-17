/**
 * CType Manager
 * 
 * Manages KILT Credential Types (CTypes) for reputation cards.
 * CTypes define the schema and structure of verifiable credentials.
 * 
 * IMPORTANT: CType Registration
 * =============================
 * CTypes must be registered on the KILT blockchain ONCE before use.
 * This is a one-time operation that requires:
 * 1. A funded KILT account (for transaction fees)
 * 2. The CType schema defined below
 * 3. Submission to the KILT blockchain
 * 
 * Registration Process:
 * ---------------------
 * 1. Use the KILT SDK to create a CType from the schema
 * 2. Sign the CType with an authorized DID
 * 3. Submit the transaction to the blockchain
 * 4. Record the resulting CType hash
 * 5. Update the CTYPE_HASH constant below with the registered hash
 * 
 * Example Registration Code (run once):
 * ```typescript
 * import * as Kilt from '@kiltprotocol/sdk-js';
 * 
 * const ctype = Kilt.CType.fromSchema(REPUTATION_CARD_SCHEMA);
 * const tx = await ctype.store(authorizedDid);
 * await tx.submit();
 * console.log('CType Hash:', ctype.hash);
 * ```
 * 
 * For development/testing, you can use the Peregrine testnet.
 * For production, register on Spiritnet mainnet.
 */

import type { CTypeSchema, CType } from '../../types/kilt';

/**
 * Reputation Card CType Schema
 * 
 * Defines the structure for reputation card credentials.
 * This schema includes all essential fields for a reputation card:
 * - template_id: Unique identifier for the card template
 * - card_id: Unique identifier for the specific card instance
 * - tier: Card tier/level (numeric)
 * - issue_date: ISO 8601 date string when the card was issued
 * - issuer_address: Blockchain address of the issuer
 */
export const REPUTATION_CARD_SCHEMA: CTypeSchema = {
  title: 'TrustFi Reputation Card',
  properties: {
    template_id: {
      type: 'string',
    },
    card_id: {
      type: 'string',
    },
    tier: {
      type: 'number',
    },
    issue_date: {
      type: 'string',
    },
    issuer_address: {
      type: 'string',
    },
  },
  required: ['template_id', 'card_id', 'tier', 'issue_date', 'issuer_address'],
};

/**
 * Registered CType Hash
 * 
 * This hash is obtained after registering the CType on the KILT blockchain.
 * 
 * PLACEHOLDER: Replace this with the actual hash after registration.
 * 
 * Registration steps:
 * 1. Connect to KILT network (Peregrine for testing, Spiritnet for production)
 * 2. Create CType from REPUTATION_CARD_SCHEMA
 * 3. Submit registration transaction
 * 4. Copy the resulting hash here
 * 
 * Example hash format: '0x1234567890abcdef...'
 */
const CTYPE_HASH = import.meta.env.VITE_KILT_CTYPE_HASH || 
  '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Get the registered CType hash for reputation cards
 * 
 * @returns The CType hash string
 * @throws Error if CType hash is not configured
 */
export function getCTypeHash(): string {
  if (CTYPE_HASH === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.warn(
      '[CType Manager] Using placeholder CType hash. ' +
      'Please register the CType on KILT blockchain and update VITE_KILT_CTYPE_HASH.'
    );
  }
  
  return CTYPE_HASH;
}

/**
 * Get the reputation card CType schema
 * 
 * @returns The CType schema object
 */
export function getCTypeSchema(): CTypeSchema {
  return REPUTATION_CARD_SCHEMA;
}

/**
 * Validate claim contents against the CType schema
 * 
 * @param contents - The claim contents to validate
 * @returns True if valid, false otherwise
 */
export function validateClaimContents(contents: Record<string, any>): boolean {
  try {
    // Check all required fields are present
    const requiredFields = REPUTATION_CARD_SCHEMA.required;
    for (const field of requiredFields) {
      if (!(field in contents)) {
        console.error(`[CType Manager] Missing required field: ${field}`);
        return false;
      }
    }

    // Validate field types
    if (typeof contents.template_id !== 'string') {
      console.error('[CType Manager] template_id must be a string');
      return false;
    }

    if (typeof contents.card_id !== 'string') {
      console.error('[CType Manager] card_id must be a string');
      return false;
    }

    if (typeof contents.tier !== 'number') {
      console.error('[CType Manager] tier must be a number');
      return false;
    }

    if (typeof contents.issue_date !== 'string') {
      console.error('[CType Manager] issue_date must be a string');
      return false;
    }

    if (typeof contents.issuer_address !== 'string') {
      console.error('[CType Manager] issuer_address must be a string');
      return false;
    }

    // Validate issue_date is a valid ISO 8601 date
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!dateRegex.test(contents.issue_date)) {
      console.error('[CType Manager] issue_date must be a valid ISO 8601 date string');
      return false;
    }

    console.log('[CType Manager] Claim contents validated successfully');
    return true;
  } catch (error) {
    console.error('[CType Manager] Validation error:', error);
    return false;
  }
}

/**
 * Create a CType object from the schema
 * This is used for registration purposes
 * 
 * @returns CType object
 */
export function createCType(): CType {
  return {
    schema: REPUTATION_CARD_SCHEMA,
    owner: '', // Will be set during registration
    hash: CTYPE_HASH,
  };
}

/**
 * Get CType information for display purposes
 * 
 * @returns Object with CType details
 */
export function getCTypeInfo(): {
  title: string;
  hash: string;
  requiredFields: string[];
  isRegistered: boolean;
} {
  const isRegistered = CTYPE_HASH !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  return {
    title: REPUTATION_CARD_SCHEMA.title,
    hash: CTYPE_HASH,
    requiredFields: REPUTATION_CARD_SCHEMA.required,
    isRegistered,
  };
}

/**
 * Registration Instructions
 * 
 * To register this CType on the KILT blockchain:
 * 
 * 1. Install KILT CLI or use the SDK directly
 * 2. Ensure you have a funded KILT account
 * 3. Run the registration script:
 * 
 * ```typescript
 * import * as Kilt from '@kiltprotocol/sdk-js';
 * import { REPUTATION_CARD_SCHEMA } from './ctype-manager';
 * 
 * async function registerCType() {
 *   // Connect to KILT
 *   await Kilt.connect('wss://peregrine.kilt.io');
 *   
 *   // Create CType
 *   const ctype = Kilt.CType.fromSchema(REPUTATION_CARD_SCHEMA);
 *   
 *   // Get your authorized DID (with funding)
 *   const authorDid = // ... your DID with keys
 *   
 *   // Store on blockchain
 *   const tx = await ctype.store(authorDid);
 *   await tx.submit();
 *   
 *   console.log('CType registered!');
 *   console.log('Hash:', ctype.hash);
 *   console.log('Add this to your .env file:');
 *   console.log(`VITE_KILT_CTYPE_HASH=${ctype.hash}`);
 *   
 *   await Kilt.disconnect();
 * }
 * 
 * registerCType().catch(console.error);
 * ```
 * 
 * 4. Copy the resulting hash to your .env file:
 *    VITE_KILT_CTYPE_HASH=0x...
 * 
 * 5. Restart your development server
 * 
 * Note: CType registration is a one-time operation per network.
 * Once registered, the hash remains constant and can be reused.
 */
