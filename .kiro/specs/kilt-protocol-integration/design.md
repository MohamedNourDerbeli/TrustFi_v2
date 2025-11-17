# KILT Protocol Integration Design

## Overview

This design document outlines the technical architecture for integrating KILT Protocol into the TrustFi reputation and badge platform. The integration will enable decentralized identity (DID), verifiable credentials (VCs), and cross-chain reputation management while maintaining backward compatibility with the existing Supabase-based system.

### Goals

- Enable users to have self-sovereign identities via KILT DIDs
- Issue cryptographically verifiable credentials for badges and achievements
- Support credential verification without centralized database dependencies
- Enable cross-chain credential portability (Moonbase, Ethereum, Polygon)
- Maintain backward compatibility with existing database-driven workflows
- Provide gradual migration path from centralized to decentralized credentials

### Non-Goals

- Complete removal of Supabase (hybrid approach maintained)
- Immediate migration of all existing credentials
- Support for non-Polkadot wallet types in initial release

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Profile │  │   Issuer     │  │  Credential  │      │
│  │   Dashboard  │  │  Dashboard   │  │  Verifier    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────────────────┐
                            │                             │
                            ▼                             ▼
              ┌──────────────────────┐      ┌──────────────────────┐
              │   KILT SDK Layer     │      │   Existing System    │
              │  ┌────────────────┐  │      │  ┌────────────────┐  │
              │  │ DID Management │  │      │  │    Supabase    │  │
              │  │ VC Issuance    │  │      │  │   (Postgres)   │  │
              │  │ VC Verification│  │      │  │                │  │
              │  └────────────────┘  │      │  └────────────────┘  │
              └──────────────────────┘      └──────────────────────┘
                            │                             │
                            ▼                             ▼
              ┌──────────────────────┐      ┌──────────────────────┐
              │  KILT Blockchain     │      │  Smart Contracts     │
              │  (Spiritnet/Peregrine)│     │  (Moonbase/EVM)      │
              │  - DID Registry      │      │  - ProfileNFT        │
              │  - Attestations      │      │  - ReputationCard    │
              └──────────────────────┘      └──────────────────────┘
```

### Component Interaction Flow

1. **User Authentication**: User connects Polkadot wallet → DID created/retrieved
2. **Credential Issuance**: Issuer creates credential → Signs with DID → Stores in wallet/DB
3. **Credential Verification**: Verifier requests proof → Validates signature → Confirms authenticity
4. **NFT Minting**: User requests NFT → Proof generated → Smart contract mints badge

## Components and Interfaces

### 1. KILT SDK Integration Layer

**Location**: `client/src/lib/kilt/`

#### KiltService (`kilt-service.ts`)

Core service for KILT operations:

```typescript
interface KiltService {
  // DID Management
  createLightDid(mnemonic?: string): Promise<DidDocument>;
  resolveDid(didUri: string): Promise<DidDocument | null>;
  
  // Credential Operations
  createCredential(claim: ClaimInput, issuerDid: DidDocument): Promise<Credential>;
  signCredential(credential: Credential, issuerDid: DidDocument): Promise<SignedCredential>;
  verifyCredential(credential: SignedCredential): Promise<VerificationResult>;
  
  // Attestation
  attestCredential(credential: SignedCredential): Promise<AttestationResult>;
  revokeAttestation(attestationId: string): Promise<void>;
}
```


#### CTypeManager (`ctype-manager.ts`)

Manages credential type schemas:

```typescript
interface CTypeManager {
  createCType(schema: CTypeSchema): Promise<CType>;
  getCType(cTypeHash: string): Promise<CType | null>;
  registerCType(cType: CType): Promise<string>;
}

interface CTypeSchema {
  title: string;
  properties: {
    template_id: { type: 'string' };
    card_id: { type: 'string' };
    tier: { type: 'number' };
    issue_date: { type: 'string' };
    issuer_address: { type: 'string' };
  };
  required: string[];
}
```

#### DidManager (`did-manager.ts`)

Handles DID lifecycle:

```typescript
interface DidManager {
  generateDid(walletAddress: string): Promise<DidDocument>;
  storeDid(walletAddress: string, did: DidDocument): Promise<void>;
  retrieveDid(walletAddress: string): Promise<DidDocument | null>;
  exportDidKeys(did: DidDocument): Promise<EncryptedKeys>;
}
```

### 2. Database Schema Extensions

**Location**: `client/supabase/migrations/`

#### New Tables

**user_dids**
```sql
CREATE TABLE user_dids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  did_uri TEXT NOT NULL UNIQUE,
  did_document JSONB NOT NULL,
  encrypted_keys TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**issuer_dids**
```sql
CREATE TABLE issuer_dids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_address TEXT NOT NULL UNIQUE,
  did_uri TEXT NOT NULL UNIQUE,
  did_document JSONB NOT NULL,
  encrypted_keys TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**credential_types**
```sql
CREATE TABLE credential_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id TEXT NOT NULL UNIQUE,
  ctype_hash TEXT NOT NULL UNIQUE,
  ctype_schema JSONB NOT NULL,
  issuer_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```


**verifiable_credentials**
```sql
CREATE TABLE verifiable_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id TEXT NOT NULL UNIQUE,
  holder_did TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  ctype_hash TEXT NOT NULL,
  credential_data JSONB NOT NULL,
  attestation_id TEXT,
  revoked BOOLEAN DEFAULT FALSE,
  card_id TEXT,
  template_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates_cache(template_id)
);
```

**nft_credential_mapping**
```sql
CREATE TABLE nft_credential_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_token_id TEXT NOT NULL UNIQUE,
  credential_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  mint_tx_hash TEXT NOT NULL,
  minted_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (credential_id) REFERENCES verifiable_credentials(credential_id)
);
```

### 3. Frontend Components

#### UserDIDManager Component

**Location**: `client/src/components/kilt/UserDIDManager.tsx`

Manages user DID creation and display:

```typescript
interface UserDIDManagerProps {
  walletAddress: string;
  onDidCreated?: (did: string) => void;
}

export function UserDIDManager({ walletAddress, onDidCreated }: UserDIDManagerProps) {
  // Check if DID exists
  // If not, prompt user to create
  // Display DID in profile
  // Allow DID export
}
```

#### IssuerDIDSetup Component

**Location**: `client/src/components/kilt/IssuerDIDSetup.tsx`

Handles issuer DID registration:

```typescript
interface IssuerDIDSetupProps {
  issuerAddress: string;
  onSetupComplete?: () => void;
}

export function IssuerDIDSetup({ issuerAddress, onSetupComplete }: IssuerDIDSetupProps) {
  // Generate issuer DID
  // Securely store keys
  // Register as attester
  // Display status
}
```


#### CredentialIssuer Component

**Location**: `client/src/components/kilt/CredentialIssuer.tsx`

Enhanced card issuance with VC support:

```typescript
interface CredentialIssuerProps {
  templateId: string;
  recipientAddress: string;
  mode: 'database-only' | 'kilt-only' | 'hybrid';
}

export function CredentialIssuer({ templateId, recipientAddress, mode }: CredentialIssuerProps) {
  // Create claim from template
  // Issue VC if KILT enabled
  // Write to database
  // Handle errors
}
```

#### CredentialVerifier Component

**Location**: `client/src/components/kilt/CredentialVerifier.tsx`

Public verification interface:

```typescript
interface CredentialVerifierProps {
  credentialId?: string;
}

export function CredentialVerifier({ credentialId }: CredentialVerifierProps) {
  // Accept credential input
  // Verify signature
  // Check revocation status
  // Display results
}
```

#### CredentialDisplay Component

**Location**: `client/src/components/kilt/CredentialDisplay.tsx`

Shows credential details with verification status:

```typescript
interface CredentialDisplayProps {
  credential: VerifiableCredential;
  showVerificationBadge?: boolean;
}

export function CredentialDisplay({ credential, showVerificationBadge }: CredentialDisplayProps) {
  // Display credential metadata
  // Show verification status
  // Provide export options
  // Link to NFT if minted
}
```

### 4. Backend Services

#### KILT Attester Service

**Location**: `client/src/services/kilt-attester.ts`

Server-side credential signing:

```typescript
interface KiltAttesterService {
  issueCredential(params: IssueCredentialParams): Promise<SignedCredential>;
  attestCredential(credentialId: string): Promise<AttestationResult>;
  revokeCredential(credentialId: string): Promise<void>;
  verifyCredential(credential: SignedCredential): Promise<VerificationResult>;
}

interface IssueCredentialParams {
  holderDid: string;
  templateId: string;
  cardId: string;
  tier: number;
  metadata: Record<string, any>;
}
```


#### NFT Bridge Service

**Location**: `client/src/services/nft-bridge.ts`

Converts VCs to on-chain NFTs:

```typescript
interface NFTBridgeService {
  generateProof(credential: SignedCredential): Promise<CredentialProof>;
  mintNFTFromCredential(params: MintParams): Promise<MintResult>;
  verifyNFTCredential(tokenId: string): Promise<VerificationResult>;
}

interface MintParams {
  credentialId: string;
  proof: CredentialProof;
  recipientAddress: string;
  chain: 'moonbase' | 'ethereum' | 'polygon';
}

interface MintResult {
  tokenId: string;
  txHash: string;
  contractAddress: string;
}
```

## Data Models

### DidDocument

```typescript
interface DidDocument {
  uri: string;
  authentication: AuthenticationMethod[];
  assertionMethod?: AssertionMethod[];
  keyAgreement?: KeyAgreementKey[];
  service?: ServiceEndpoint[];
}
```

### VerifiableCredential

```typescript
interface VerifiableCredential {
  credentialId: string;
  holderDid: string;
  issuerDid: string;
  cTypeHash: string;
  claim: {
    template_id: string;
    card_id: string;
    tier: number;
    issue_date: string;
    issuer_address: string;
    metadata?: Record<string, any>;
  };
  signature: string;
  attestationId?: string;
  revoked: boolean;
  createdAt: Date;
}
```

### ClaimInput

```typescript
interface ClaimInput {
  cTypeHash: string;
  contents: {
    template_id: string;
    card_id: string;
    tier: number;
    issue_date: string;
    issuer_address: string;
    [key: string]: any;
  };
}
```

### VerificationResult

```typescript
interface VerificationResult {
  valid: boolean;
  issuerDid: string;
  holderDid: string;
  revoked: boolean;
  errors?: string[];
  warnings?: string[];
}
```


## Error Handling

### Error Categories

1. **DID Errors**
   - DID creation failure
   - DID resolution failure
   - Invalid DID format
   - Missing DID keys

2. **Credential Errors**
   - Invalid claim data
   - Signature verification failure
   - CType mismatch
   - Revoked credential

3. **Attestation Errors**
   - Attestation submission failure
   - Insufficient funds for transaction
   - Network connectivity issues

4. **Integration Errors**
   - Database sync failure
   - Blockchain RPC errors
   - IPFS upload failures

### Error Handling Strategy

```typescript
class KiltError extends Error {
  constructor(
    message: string,
    public code: KiltErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'KiltError';
  }
}

enum KiltErrorCode {
  DID_CREATION_FAILED = 'DID_CREATION_FAILED',
  DID_NOT_FOUND = 'DID_NOT_FOUND',
  CREDENTIAL_INVALID = 'CREDENTIAL_INVALID',
  ATTESTATION_FAILED = 'ATTESTATION_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// Usage
try {
  const credential = await kiltService.createCredential(claim, issuerDid);
} catch (error) {
  if (error instanceof KiltError) {
    switch (error.code) {
      case KiltErrorCode.DID_NOT_FOUND:
        showErrorNotification('DID Not Found', 'Please create a DID first');
        break;
      case KiltErrorCode.ATTESTATION_FAILED:
        showErrorNotification('Attestation Failed', error.message);
        // Fallback to database-only mode
        await saveToDatabaseOnly(claim);
        break;
      default:
        showErrorNotification('KILT Error', error.message);
    }
  }
}
```

### Fallback Mechanisms

1. **Hybrid Mode**: If KILT operations fail, fall back to database-only storage
2. **Retry Logic**: Implement exponential backoff for network errors
3. **Graceful Degradation**: Display credentials even if verification temporarily fails
4. **User Notifications**: Clear error messages with actionable steps


## Testing Strategy

### Unit Tests

**Location**: `client/src/lib/kilt/__tests__/`

1. **DID Management Tests**
   - Test DID creation
   - Test DID resolution
   - Test DID storage and retrieval
   - Test key encryption/decryption

2. **Credential Tests**
   - Test credential creation
   - Test credential signing
   - Test credential verification
   - Test revocation

3. **CType Tests**
   - Test CType creation
   - Test schema validation
   - Test CType registration

### Integration Tests

**Location**: `client/src/__tests__/integration/kilt/`

1. **End-to-End Credential Flow**
   - User creates DID
   - Issuer creates credential
   - User receives credential
   - Third party verifies credential

2. **Database Sync Tests**
   - Test dual-write to KILT and Supabase
   - Test data consistency
   - Test migration utilities

3. **NFT Bridge Tests**
   - Test proof generation
   - Test NFT minting
   - Test credential-NFT mapping

### Manual Testing Checklist

- [ ] User can create DID on first login
- [ ] Issuer can register as attester
- [ ] Issuer can create CTypes for templates
- [ ] Issuer can issue verifiable credentials
- [ ] User can view credentials in profile
- [ ] Credentials display verification status
- [ ] Public verifier works without authentication
- [ ] Credentials can be exported
- [ ] NFT minting from credentials works
- [ ] Revocation updates credential status
- [ ] Fallback to database works when KILT fails
- [ ] Migration tool converts existing credentials

## Security Considerations

### Key Management

1. **Issuer Keys**
   - Store encrypted in database
   - Use environment-specific encryption keys
   - Implement key rotation mechanism
   - Backup keys securely

2. **User Keys**
   - Store in wallet when possible
   - Encrypt before database storage
   - Never expose private keys in frontend
   - Provide secure export mechanism


### Credential Privacy

1. **Selective Disclosure**
   - Implement zero-knowledge proofs where applicable
   - Allow users to share partial credential data
   - Minimize on-chain data exposure

2. **Data Minimization**
   - Only include necessary fields in credentials
   - Avoid PII in public credentials
   - Use hashes for sensitive data

### Access Control

1. **Issuer Permissions**
   - Verify issuer status before DID creation
   - Validate issuer owns wallet before signing
   - Rate limit credential issuance

2. **User Permissions**
   - Users control their credential sharing
   - Implement consent mechanisms
   - Allow credential deletion

### Audit Trail

```typescript
interface AuditLog {
  id: string;
  action: 'DID_CREATED' | 'CREDENTIAL_ISSUED' | 'CREDENTIAL_VERIFIED' | 'CREDENTIAL_REVOKED';
  actor: string;
  subject: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache resolved DIDs (TTL: 1 hour)
   - Cache CTypes (TTL: 24 hours)
   - Cache verification results (TTL: 5 minutes)

2. **Lazy Loading**
   - Load KILT SDK only when needed
   - Defer credential verification until user requests
   - Paginate credential lists

3. **Batch Operations**
   - Batch DID resolutions
   - Batch credential verifications
   - Batch database writes

4. **Background Processing**
   - Attest credentials asynchronously
   - Sync to blockchain in background
   - Queue NFT minting operations

### Performance Metrics

- DID creation: < 2 seconds
- Credential issuance: < 3 seconds
- Credential verification: < 1 second
- NFT minting: < 30 seconds (blockchain dependent)


## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)

1. Install KILT SDK dependencies
2. Create KILT service layer
3. Implement DID management
4. Create database schema extensions
5. Build basic UI components

### Phase 2: Core Integration (Weeks 3-4)

1. Implement CType management
2. Build credential issuance flow
3. Create verification system
4. Integrate with existing issuer dashboard
5. Add credential display to user profiles

### Phase 3: Advanced Features (Weeks 5-6)

1. Implement NFT bridge
2. Build public verifier
3. Create migration utilities
4. Add revocation support
5. Implement cross-chain anchoring

### Phase 4: Testing & Refinement (Week 7)

1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Documentation
5. User acceptance testing

### Backward Compatibility

```typescript
// Feature flag system
interface KiltConfig {
  enabled: boolean;
  mode: 'database-only' | 'kilt-only' | 'hybrid';
  fallbackToDatabase: boolean;
}

// Usage in components
const kiltConfig = useKiltConfig();

if (kiltConfig.enabled && kiltConfig.mode !== 'database-only') {
  await issueKiltCredential(params);
}

if (kiltConfig.mode !== 'kilt-only') {
  await saveToDatabaseOnly(params);
}
```

### Data Migration

```typescript
interface MigrationService {
  // Convert existing database credentials to VCs
  migrateCredential(claimId: string): Promise<VerifiableCredential>;
  
  // Batch migration
  migrateAllCredentials(batchSize: number): Promise<MigrationResult>;
  
  // Rollback if needed
  rollbackMigration(credentialId: string): Promise<void>;
}

interface MigrationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ claimId: string; error: string }>;
}
```


## Configuration

### Environment Variables

```bash
# KILT Network Configuration
VITE_KILT_NETWORK=peregrine  # or spiritnet for production
VITE_KILT_WSS_ADDRESS=wss://peregrine.kilt.io

# Feature Flags
VITE_KILT_ENABLED=true
VITE_KILT_MODE=hybrid  # database-only | kilt-only | hybrid
VITE_KILT_FALLBACK=true

# Encryption
VITE_KILT_ENCRYPTION_KEY=<secure-key>

# NFT Bridge
VITE_NFT_BRIDGE_ENABLED=true
VITE_SUPPORTED_CHAINS=moonbase,ethereum,polygon
```

### Runtime Configuration

```typescript
// client/src/config/kilt.config.ts
export const kiltConfig = {
  network: import.meta.env.VITE_KILT_NETWORK || 'peregrine',
  wssAddress: import.meta.env.VITE_KILT_WSS_ADDRESS,
  enabled: import.meta.env.VITE_KILT_ENABLED === 'true',
  mode: import.meta.env.VITE_KILT_MODE || 'hybrid',
  fallbackToDatabase: import.meta.env.VITE_KILT_FALLBACK === 'true',
  nftBridge: {
    enabled: import.meta.env.VITE_NFT_BRIDGE_ENABLED === 'true',
    supportedChains: import.meta.env.VITE_SUPPORTED_CHAINS?.split(',') || ['moonbase'],
  },
};
```

## Dependencies

### New NPM Packages

```json
{
  "dependencies": {
    "@kiltprotocol/sdk-js": "^0.35.0",
    "@polkadot/api": "^10.11.0",
    "@polkadot/util-crypto": "^12.6.0",
    "@polkadot/keyring": "^12.6.0"
  }
}
```

### Peer Dependencies

- React 18+
- Viem 2+
- Wagmi 2+
- TanStack Query 5+

## Monitoring and Observability

### Metrics to Track

1. **DID Operations**
   - DIDs created per day
   - DID resolution success rate
   - Average DID creation time

2. **Credential Operations**
   - Credentials issued per day
   - Verification requests per day
   - Verification success rate
   - Revocation rate

3. **System Health**
   - KILT network connectivity
   - Database sync lag
   - Error rates by type
   - API response times


### Logging Strategy

```typescript
// client/src/lib/kilt/logger.ts
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface KiltLogger {
  log(level: LogLevel, message: string, context?: any): void;
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
}

// Usage
logger.info('DID created successfully', { didUri, walletAddress });
logger.error('Credential verification failed', error, { credentialId });
```

## API Endpoints

### REST API (if backend service needed)

```
POST   /api/kilt/did/create
GET    /api/kilt/did/:address
POST   /api/kilt/credential/issue
POST   /api/kilt/credential/verify
POST   /api/kilt/credential/revoke
GET    /api/kilt/credential/:id
POST   /api/kilt/nft/mint
GET    /api/kilt/ctype/:hash
POST   /api/kilt/ctype/register
```

### Request/Response Examples

**Create DID**
```typescript
// POST /api/kilt/did/create
Request: {
  walletAddress: "0x1234...",
  mnemonic?: string  // optional, generated if not provided
}

Response: {
  didUri: "did:kilt:4...",
  document: { ... },
  success: true
}
```

**Issue Credential**
```typescript
// POST /api/kilt/credential/issue
Request: {
  holderDid: "did:kilt:4...",
  templateId: "1",
  cardId: "42",
  tier: 1,
  metadata: { ... }
}

Response: {
  credentialId: "cred_...",
  credential: { ... },
  attestationId: "att_...",
  success: true
}
```

**Verify Credential**
```typescript
// POST /api/kilt/credential/verify
Request: {
  credential: { ... }
}

Response: {
  valid: true,
  issuerDid: "did:kilt:4...",
  holderDid: "did:kilt:4...",
  revoked: false,
  errors: []
}
```


## User Experience Flow

### User Journey: First-Time User

1. **Connect Wallet**
   - User connects Polkadot-compatible wallet
   - System checks for existing DID

2. **Create DID**
   - If no DID exists, show onboarding modal
   - Explain benefits of DID
   - User clicks "Create DID"
   - System generates DID and stores securely
   - Success message with DID displayed

3. **Receive Credential**
   - Issuer issues credential to user's DID
   - User receives notification
   - Credential appears in profile
   - Verification badge shown

4. **View & Share**
   - User views credential details
   - Can export credential
   - Can share verification link
   - Can mint as NFT

### Issuer Journey: Credential Issuance

1. **Setup**
   - Issuer logs in
   - System checks for issuer DID
   - If none, prompts to create
   - Issuer DID created and registered as attester

2. **Create Template**
   - Issuer creates template (existing flow)
   - System creates corresponding CType
   - CType registered on KILT blockchain
   - Template ready for issuance

3. **Issue Credential**
   - Issuer navigates to issue form
   - Selects template
   - Enters recipient address
   - System resolves recipient DID
   - Chooses Quick or Custom mode
   - Submits form
   - System creates VC, signs with issuer DID
   - Credential issued and stored
   - Success notification

### Verifier Journey: Credential Verification

1. **Access Verifier**
   - Navigate to public verifier page
   - No authentication required

2. **Submit Credential**
   - Paste credential JSON or ID
   - Click "Verify"

3. **View Results**
   - See verification status
   - View issuer information
   - Check revocation status
   - See credential contents


## UI/UX Mockups

### DID Creation Modal

```
┌─────────────────────────────────────────────┐
│  Create Your Decentralized Identity         │
│                                             │
│  🔐 Your DID enables:                       │
│  ✓ Verifiable credentials                   │
│  ✓ Cross-platform reputation                │
│  ✓ Self-sovereign identity                  │
│                                             │
│  Your DID will be:                          │
│  did:kilt:4r1WkS76v...                      │
│                                             │
│  [Cancel]              [Create DID]         │
└─────────────────────────────────────────────┘
```

### Credential Card with Verification

```
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │        [Card Image]                 │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Early Adopter Badge          ✓ Verified   │
│  Issued by: TrustFi                         │
│  Tier 1 • 10 points                         │
│                                             │
│  📋 Credential ID: cred_abc123              │
│  🔗 DID: did:kilt:4r1W...                   │
│                                             │
│  [Export] [Verify] [Mint NFT]               │
└─────────────────────────────────────────────┘
```

### Issuer Dashboard - KILT Status

```
┌─────────────────────────────────────────────┐
│  Issuer Dashboard                           │
│                                             │
│  🔐 KILT Status                             │
│  ✓ Attester DID: did:kilt:4s2T...          │
│  ✓ 5 CTypes registered                      │
│  ✓ 142 credentials issued                   │
│                                             │
│  [View DID Details]                         │
└─────────────────────────────────────────────┘
```

## Cross-Chain Integration

### Moonbase Integration

```typescript
interface MoonbaseIntegration {
  // Anchor KILT attestation to Moonbase
  anchorAttestation(attestationId: string): Promise<string>;
  
  // Mint NFT with KILT proof
  mintWithProof(proof: CredentialProof, metadata: NFTMetadata): Promise<string>;
  
  // Verify NFT has valid KILT credential
  verifyNFTCredential(tokenId: string): Promise<boolean>;
}
```

### Ethereum/Polygon Bridge

```typescript
interface EVMBridge {
  // Bridge credential proof to EVM chain
  bridgeToEVM(credential: VerifiableCredential, chain: 'ethereum' | 'polygon'): Promise<BridgeResult>;
  
  // Verify credential on EVM chain
  verifyOnEVM(credentialId: string, chain: string): Promise<boolean>;
}
```


## Implementation Priorities

### Must Have (MVP)

1. User DID creation and management
2. Issuer DID registration
3. CType creation for templates
4. Verifiable credential issuance
5. Credential display in user profile
6. Basic verification
7. Database integration (hybrid mode)
8. Error handling and fallbacks

### Should Have (Phase 2)

1. Public credential verifier
2. Credential export functionality
3. NFT minting from credentials
4. Revocation support
5. Migration utilities
6. Enhanced UI components
7. Performance optimizations

### Could Have (Future)

1. Selective disclosure
2. Zero-knowledge proofs
3. Multi-chain anchoring
4. Credential marketplace
5. Advanced analytics
6. Mobile wallet integration
7. Batch operations UI

### Won't Have (Out of Scope)

1. Custom blockchain deployment
2. Non-Polkadot wallet support (initially)
3. Credential trading/transfer
4. Governance mechanisms
5. Token economics

## Success Criteria

### Technical Metrics

- [ ] 95%+ uptime for KILT operations
- [ ] < 3 second credential issuance time
- [ ] < 1 second verification time
- [ ] 100% data consistency between KILT and database
- [ ] Zero data loss during migration
- [ ] < 5% error rate for DID operations

### User Metrics

- [ ] 80%+ of new users create DIDs
- [ ] 90%+ of issuers adopt KILT credentials
- [ ] 50%+ of credentials verified externally
- [ ] < 2% user-reported issues
- [ ] Positive user feedback on verification trust

### Business Metrics

- [ ] Increased platform credibility
- [ ] Cross-platform credential usage
- [ ] Reduced support tickets for credential validity
- [ ] Partnership opportunities with KILT ecosystem


## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| KILT network downtime | High | Low | Fallback to database-only mode |
| Key management vulnerabilities | Critical | Medium | Implement encryption, secure storage, audits |
| Performance degradation | Medium | Medium | Caching, lazy loading, optimization |
| Integration complexity | Medium | High | Phased rollout, comprehensive testing |
| Data migration failures | High | Low | Backup strategy, rollback mechanism |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User adoption resistance | Medium | Medium | Clear onboarding, education, benefits |
| Issuer migration friction | High | Medium | Hybrid mode, gradual transition |
| Ecosystem compatibility | Medium | Low | Follow KILT standards, test integrations |
| Regulatory concerns | High | Low | Privacy-first design, compliance review |

## Documentation Requirements

### Developer Documentation

1. **Setup Guide**
   - Installation instructions
   - Configuration guide
   - Environment setup

2. **API Reference**
   - All service methods
   - Request/response formats
   - Error codes

3. **Integration Guide**
   - How to integrate KILT
   - Code examples
   - Best practices

4. **Migration Guide**
   - Step-by-step migration
   - Data mapping
   - Rollback procedures

### User Documentation

1. **User Guide**
   - What is a DID?
   - How to create credentials
   - How to verify credentials
   - FAQ

2. **Issuer Guide**
   - Setting up as issuer
   - Creating CTypes
   - Issuing credentials
   - Managing revocations

3. **Verifier Guide**
   - How to verify credentials
   - Understanding verification results
   - Integration options

## Conclusion

This design provides a comprehensive architecture for integrating KILT Protocol into TrustFi, enabling decentralized identity and verifiable credentials while maintaining backward compatibility. The hybrid approach ensures a smooth transition and allows for gradual adoption.

Key benefits:
- **Decentralization**: Users own their identity and credentials
- **Verifiability**: Cryptographic proof of credential authenticity
- **Portability**: Credentials work across platforms and chains
- **Privacy**: Users control their data sharing
- **Trust**: Reduced reliance on centralized databases

The phased implementation approach minimizes risk while delivering value incrementally. The fallback mechanisms ensure system reliability even during KILT network issues.
