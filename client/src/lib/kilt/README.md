# KILT Service Layer

This directory contains the core KILT Protocol integration for TrustFi's verifiable credentials system.

## Overview

The KILT service layer provides decentralized identity (DID) and verifiable credential (VC) functionality, enabling cryptographically verifiable reputation cards that work across platforms.

## Architecture

```
kilt/
├── kilt-service.ts       # Core KILT connection and DID operations
├── did-manager.ts        # DID lifecycle management and storage
├── credential-service.ts # Credential creation, signing, and verification
├── ctype-manager.ts      # Credential type schema management
└── index.ts             # Central export point
```

## Components

### 1. KILT Service (`kilt-service.ts`)

Core service for KILT blockchain operations.

**Key Features:**
- Singleton pattern with lazy initialization
- Connection management with retry logic
- Light DID creation (off-chain DIDs)
- DID resolution from blockchain

**Usage:**
```typescript
import { kiltService } from './lib/kilt';

// Initialize connection
await kiltService.initKiltConnection();

// Create a light DID
const did = await kiltService.createLightDid();

// Resolve an existing DID
const resolvedDid = await kiltService.resolveDid('did:kilt:4...');
```

### 2. DID Manager (`did-manager.ts`)

Manages DID lifecycle with database integration and caching.

**Key Features:**
- User and issuer DID generation
- Supabase storage integration
- In-memory caching (1-hour TTL)
- Key encryption for issuer DIDs

**Usage:**
```typescript
import { generateDidForUser, getDid } from './lib/kilt';

// Generate DID for a user
const userDid = await generateDidForUser(walletAddress);

// Retrieve existing DID
const existingDid = await getDid(walletAddress, false);
```

### 3. Credential Service (`credential-service.ts`)

Handles verifiable credential operations.

**Key Features:**
- Credential creation from claims
- Cryptographic signing
- Verification with revocation checks
- Supabase storage and retrieval

**Usage:**
```typescript
import { 
  createCredential, 
  signCredential, 
  verifyCredential,
  storeCredential 
} from './lib/kilt';

// Create and sign a credential
const claim = {
  cTypeHash: getCTypeHash(),
  contents: {
    template_id: '1',
    card_id: '42',
    tier: 1,
    issue_date: new Date().toISOString(),
    issuer_address: '0x...',
  },
};

const credential = await createCredential(claim, issuerDid);
const signed = await signCredential(credential, issuerDid);
await storeCredential(signed, '42', '1');

// Verify a credential
const result = await verifyCredential(signed);
console.log('Valid:', result.valid);
```

### 4. CType Manager (`ctype-manager.ts`)

Manages credential type schemas.

**Key Features:**
- Hardcoded reputation card schema
- Schema validation
- CType hash management

**Usage:**
```typescript
import { getCTypeHash, validateClaimContents } from './lib/kilt';

// Get the registered CType hash
const hash = getCTypeHash();

// Validate claim contents
const isValid = validateClaimContents({
  template_id: '1',
  card_id: '42',
  tier: 1,
  issue_date: new Date().toISOString(),
  issuer_address: '0x...',
});
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# KILT Network
VITE_KILT_NETWORK=peregrine
VITE_KILT_WSS_ADDRESS=wss://peregrine.kilt.io

# Feature Flags
VITE_KILT_ENABLED=true
VITE_KILT_MODE=hybrid

# CType Hash (after registration)
VITE_KILT_CTYPE_HASH=0x...

# Encryption Key (change in production!)
VITE_KILT_ENCRYPTION_KEY=your-secure-key
```

## CType Registration

**IMPORTANT:** Before issuing credentials, you must register the CType on the KILT blockchain.

See detailed instructions in `ctype-manager.ts`.

Quick steps:
1. Fund a KILT account on Peregrine testnet
2. Run the registration script (see `ctype-manager.ts`)
3. Copy the resulting hash to `VITE_KILT_CTYPE_HASH`
4. Restart your dev server

## Database Schema

The KILT integration requires these Supabase tables:

- `user_dids` - Stores user DIDs
- `issuer_dids` - Stores issuer DIDs with encrypted keys
- `verifiable_credentials` - Stores issued credentials

See migration file: `client/supabase/migrations/add_kilt_tables.sql`

## Security Considerations

### MVP Implementation Notes

This is an MVP implementation with simplified security:

1. **Key Encryption**: Uses basic encoding (NOT production-ready)
   - Replace with proper encryption (Web Crypto API, @noble/ciphers)
   
2. **Credential Signing**: Simplified signature generation
   - Replace with actual KILT SDK cryptographic signing
   
3. **Key Storage**: Keys stored in database
   - Consider hardware security modules for production

### Production Recommendations

- Use proper key management systems
- Implement hardware wallet integration
- Add rate limiting for DID creation
- Implement proper audit logging
- Use secure key derivation functions
- Add multi-signature support for issuers

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const did = await generateDidForUser(address);
} catch (error) {
  console.error('DID generation failed:', error);
  // Fallback to database-only mode
}
```

## Testing

Run TypeScript checks:
```bash
npm run build
```

Check for diagnostics:
```bash
# All files should have no errors
```

## Integration Points

### With Existing System

- **AuthContext**: Integrate DID creation during user authentication
- **IssuerDashboard**: Show issuer DID status
- **IssueCardForm**: Create credentials when issuing cards
- **UserDashboard**: Display credentials with verification status

### With Smart Contracts

- Credentials can be converted to NFTs via the NFT bridge
- On-chain verification proofs can be generated
- Cross-chain anchoring supported

## Troubleshooting

### Connection Issues

If KILT connection fails:
- Check WSS address is correct
- Verify network connectivity
- Check Peregrine testnet status
- Review retry logic in console logs

### DID Creation Failures

If DID creation fails:
- Ensure KILT service is initialized
- Check for proper mnemonic format
- Verify database permissions
- Review error logs

### Credential Verification Failures

If verification fails:
- Check credential structure
- Verify CType hash is registered
- Check for revocation status
- Ensure issuer DID is valid

## Next Steps

After implementing the core service layer:

1. Integrate DID creation into AuthContext (Task 4)
2. Add credential issuance to IssueCardForm (Task 6)
3. Display credentials in UserDashboard (Task 7)
4. Implement public verifier (Task 9)

## Resources

- [KILT Protocol Documentation](https://docs.kilt.io/)
- [KILT SDK Reference](https://github.com/KILTprotocol/sdk-js)
- [Peregrine Testnet](https://polkadot.js.org/apps/?rpc=wss://peregrine.kilt.io)
- [TrustFi Design Document](../../.kiro/specs/kilt-protocol-integration/design.md)
