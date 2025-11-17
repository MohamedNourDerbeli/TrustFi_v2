# Implementation Plan - KILT MVP

## Overview

This is a streamlined MVP implementation plan focusing on core KILT functionality: DIDs, verifiable credentials, basic verification, and claim links. The current codebase has a working reputation card system with Supabase, smart contracts on Moonbase, and issuer/user dashboards. This plan integrates KILT Protocol to add decentralized identity and verifiable credentials on top of the existing infrastructure.

## Current State Analysis

**Existing Infrastructure:**
- ✅ Supabase database with profiles, templates_cache, claims_log tables
- ✅ Smart contracts: ProfileNFT and ReputationCard on Moonbase
- ✅ User authentication via wallet connection (wagmi)
- ✅ Issuer dashboard with IssueCardForm and ClaimLinkGenerator
- ✅ User dashboard showing cards and profile
- ✅ IPFS integration via Pinata for metadata
- ✅ AuthContext with role checking (admin, issuer)

**Missing KILT Components:**
- ❌ KILT SDK not installed
- ❌ No DID management
- ❌ No verifiable credentials
- ❌ No KILT-specific database tables
- ❌ No KILT service layer

## Task List

- [x] 1. Setup KILT SDK and basic infrastructure


  - Install @kiltprotocol/sdk-js (^0.35.0), @polkadot/api (^10.11.0), @polkadot/util-crypto (^12.6.0), @polkadot/keyring (^12.6.0)
  - Add KILT network config to .env.example and .env: VITE_KILT_NETWORK, VITE_KILT_WSS_ADDRESS, VITE_KILT_ENABLED, VITE_KILT_MODE
  - Create client/src/lib/kilt/ directory structure
  - Create client/src/types/kilt.ts with TypeScript interfaces for DidDocument, VerifiableCredential, ClaimInput, VerificationResult
  - _Requirements: 1.1_

- [x] 2. Create minimal database tables






  - [x] 2.1 Create migration file: client/supabase/migrations/add_kilt_tables.sql

    - Create user_dids table with columns: id (uuid), wallet_address (text unique), did_uri (text unique), did_document (jsonb), created_at (timestamp)
    - Create issuer_dids table with columns: id (uuid), issuer_address (text unique), did_uri (text unique), did_document (jsonb), encrypted_keys (text), created_at (timestamp)
    - Create verifiable_credentials table with columns: id (uuid), credential_id (text unique), holder_did (text), issuer_did (text), credential_data (jsonb), card_id (text), template_id (text), revoked (boolean default false), created_at (timestamp)
    - Add indexes on wallet_address, issuer_address, holder_did, credential_id
    - Add foreign key constraint linking template_id to templates_cache(template_id)
    - _Requirements: 1.2, 2.1, 2.2, 4.1, 6.1_

- [ ] 3. Implement core KILT service layer






  - [x] 3.1 Create client/src/lib/kilt/kilt-service.ts

    - Implement initKiltConnection() to connect to Peregrine testnet
    - Implement createLightDid(mnemonic?: string) returning DidDocument
    - Implement resolveDid(didUri: string) returning DidDocument | null
    - Add connection error handling and retry logic
    - Export singleton instance with lazy initialization
    - _Requirements: 1.1_


  - [x] 3.2 Create client/src/lib/kilt/did-manager.ts

    - Implement storeDid(walletAddress: string, did: DidDocument, isIssuer: boolean) to save to Supabase
    - Implement getDid(walletAddress: string, isIssuer: boolean) to retrieve from Supabase
    - Implement generateDidForUser(walletAddress: string) combining creation and storage
    - Implement generateDidForIssuer(issuerAddress: string) with key encryption
    - Add caching layer to avoid repeated database queries
    - _Requirements: 1.2, 1.3, 2.1, 2.2_


  - [x] 3.3 Create client/src/lib/kilt/credential-service.ts

    - Implement createCredential(claim: ClaimInput, issuerDid: DidDocument) returning Credential
    - Implement signCredential(credential: Credential, issuerDid: DidDocument) returning SignedCredential
    - Implement verifyCredential(credential: SignedCredential) returning VerificationResult
    - Implement storeCredential(credential: SignedCredential, cardId: string, templateId: string) to save to Supabase
    - Implement getCredentialsByHolder(holderDid: string) to fetch from Supabase
    - _Requirements: 4.1, 4.2, 6.1, 7.2_



  - [x] 3.4 Create client/src/lib/kilt/ctype-manager.ts

    - Define hardcoded CType schema for reputation cards with fields: template_id, card_id, tier, issue_date, issuer_address
    - Implement getCTypeHash() returning the registered CType hash
    - Add documentation comment with instructions for one-time CType registration
    - _Requirements: 3.1, 3.2_





- [ ] 4. Integrate DID creation into user authentication flow


  - [x] 4.1 Modify client/src/contexts/AuthContext.tsx

    - Import did-manager functions
    - Add userDid state variable
    - In checkProfile(), after confirming profile exists, check for DID in user_dids table
    - If no DID exists, call generateDidForUser(address) and store result
    - Add userDid to AuthContextValue interface and return value
    - Handle DID creation errors gracefully with console logging
    - _Requirements: 1.1, 1.2, 1.3_


  - [x] 4.2 Update client/src/pages/UserDashboard.tsx

    - Import useAuth to access userDid
    - Add DID display section in profile header area (below wallet address)
    - Show "DID: did:kilt:..." with copy-to-clipboard button
    - Add loading state while DID is being created
    - Style with existing gradient theme
    - _Requirements: 1.4_

- [ ] 5. Integrate DID creation into issuer flow






  - [x] 5.1 Modify client/src/contexts/AuthContext.tsx (issuer section)

    - Add issuerDid state variable
    - When isIssuer is true, check for DID in issuer_dids table
    - If no issuer DID exists, call generateDidForIssuer(address)
    - Add issuerDid to AuthContextValue interface
    - Handle key encryption using environment variable
    - _Requirements: 2.1, 2.2_


  - [x] 5.2 Update client/src/components/issuer/IssuerDashboard.tsx

    - Import useAuth to access issuerDid
    - Add "KILT Attester Status" card showing issuer DID
    - Display DID with copy button
    - Show "✓ Registered as Attester" badge
    - Add loading state during DID creation
    - _Requirements: 2.3_

- [ ] 6. Integrate credential issuance into card issuance flow




  - [x] 6.1 Modify client/src/components/issuer/IssueCardForm.tsx


    - Import credential-service and ctype-manager
    - After successful issueDirect() call, create verifiable credential
    - Build ClaimInput with template_id, card_id, tier, issue_date from result
    - Call createCredential() and signCredential() with issuer DID
    - Call storeCredential() to save to verifiable_credentials table
    - Wrap KILT operations in try-catch - if fails, log error but don't block card issuance
    - Show success message mentioning both card and credential
    - _Requirements: 4.1, 4.2, 4.3, 4.4_


  - [x] 6.2 Add recipient DID validation to IssueCardForm


    - Before issuing card, call getDid(recipientAddress, false) to check for user DID
    - If no DID found, show validation error: "Recipient must connect wallet and create profile first to receive verifiable credentials"
    - Allow card issuance to proceed even without DID (backward compatibility)
    - _Requirements: 4.1_

- [ ] 7. Display verifiable credentials in user profile






  - [x] 7.1 Create client/src/components/user/CredentialBadge.tsx

    - Accept credential prop with VerifiableCredential type
    - Display small "✓ Verified" badge overlay on card
    - Show issuer DID on hover/click
    - Show issue date
    - Show revoked status if revoked = true
    - Use existing CardDisplay component as base
    - _Requirements: 6.1, 6.2, 6.3_


  - [x] 7.2 Modify client/src/pages/UserDashboard.tsx (credentials section)

    - Import getCredentialsByHolder from credential-service
    - Fetch credentials for user's DID when profile loads
    - Match credentials to cards by card_id
    - Pass credential data to CardDisplay or CredentialBadge
    - Show "Verified Credentials" count in stats section
    - Handle loading and error states
    - _Requirements: 6.1, 6.2_

- [ ] 8. Integrate credentials into claim link flow





  - [x] 8.1 Modify client/src/components/issuer/ClaimLinkGenerator.tsx


    - Import credential-service
    - After generating signature, create verifiable credential
    - Store credential with holder_did = null (pending claim)
    - Link credential to claim signature/nonce for later retrieval
    - Store claim_signature or nonce in verifiable_credentials table (add column if needed)
    - Wrap in try-catch to not block claim link generation
    - _Requirements: 5.1_

  - [x] 8.2 Modify client/src/pages/PublicClaimPage.tsx


    - Import credential-service and did-manager
    - After successful claim, retrieve pending credential by signature/nonce
    - Get user's DID from user_dids table
    - Update credential holder_did to user's DID
    - Mark credential as claimed
    - Show success message mentioning credential
    - _Requirements: 5.2, 5.3_

  - [x] 8.3 Add duplicate claim prevention


    - In PublicClaimPage, check if credential already has holder_did set
    - If holder_did is not null, show error: "This credential has already been claimed"
    - Prevent claim transaction from proceeding
    - _Requirements: 5.4, 5.5_

- [x] 9. Implement basic credential verification






  - [x] 9.1 Add verification to credential display

    - In CredentialBadge component, call verifyCredential() when mounting
    - Show green checkmark icon if verification passes
    - Show red X icon if verification fails
    - Show yellow warning icon if revoked
    - Cache verification results to avoid repeated checks
    - _Requirements: 7.1, 7.2, 7.3, 7.4_


  - [x] 9.2 Create client/src/components/kilt/VerificationStatus.tsx

    - Accept verificationResult prop
    - Display detailed verification info: valid, issuer DID, holder DID, revoked status
    - Show errors/warnings if any
    - Style with color-coded badges (green/red/yellow)
    - _Requirements: 7.2, 7.4_

- [ ]* 10. Add credential revocation (optional)
  - [ ]* 10.1 Create client/src/components/issuer/CredentialManager.tsx
    - Fetch all credentials issued by issuer from verifiable_credentials table
    - Display list with card details and holder info
    - Add "Revoke" button next to each credential
    - On revoke, update revoked = true in database
    - Show confirmation dialog before revoking
    - _Requirements: 7.3_

  - [ ]* 10.2 Add revocation check to verification
    - In verifyCredential(), check revoked flag from database
    - Return revoked status in VerificationResult
    - Update CredentialBadge to show "REVOKED" prominently
    - Disable any credential-based actions if revoked
    - _Requirements: 7.3, 7.4_

- [ ]* 11. Add NFT minting from credentials (optional)
  - [ ]* 11.1 Create client/src/lib/kilt/nft-bridge.ts
    - Implement mintNFTFromCredential(credentialId: string, recipientAddress: string)
    - Call existing ReputationCard contract mint function
    - Store NFT token_id in verifiable_credentials table (add nft_token_id column)
    - Return mint transaction hash
    - _Requirements: 8.1, 8.2_

  - [ ]* 11.2 Add mint button to CredentialBadge
    - Show "Mint as NFT" button if not already minted
    - Call mintNFTFromCredential() on click
    - Show loading state during minting
    - Display "Minted as NFT #X" with Moonbase explorer link after success
    - _Requirements: 8.3, 8.4_

- [ ] 12. Add comprehensive error handling
  - [ ] 12.1 Create client/src/lib/kilt/errors.ts
    - Define KiltError class extending Error
    - Define KiltErrorCode enum (DID_CREATION_FAILED, CREDENTIAL_INVALID, etc.)
    - Implement error factory functions
    - Add error logging with context
    - _Requirements: 1.5, 4.5_

  - [ ] 12.2 Wrap all KILT operations with error handling
    - Add try-catch blocks to all DID creation calls
    - Add try-catch blocks to all credential operations
    - Add try-catch blocks to all verification calls
    - Show user-friendly toast notifications on errors
    - Log detailed errors to console for debugging
    - Implement fallback to database-only mode on KILT failures
    - _Requirements: 1.5, 4.5_

  - [ ] 12.3 Add error recovery UI components
    - Create "Retry DID Creation" button in profile if DID creation fails
    - Show warning banner if KILT is unavailable but system still functional
    - Add "Skip Verification" option if verification service is down
    - Provide clear error messages with actionable steps
    - _Requirements: 1.5, 4.5_
