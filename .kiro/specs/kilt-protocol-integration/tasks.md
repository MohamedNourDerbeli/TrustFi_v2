# Implementation Plan - KILT MVP

## Overview

This is a streamlined MVP implementation plan focusing on core KILT functionality: DIDs, verifiable credentials, basic verification, and claim links. No enterprise features, complex migrations, or advanced infrastructure.

## Task List

- [ ] 1. Setup KILT SDK and basic infrastructure
  - Install @kiltprotocol/sdk-js and @polkadot dependencies
  - Add KILT network config (Peregrine testnet) to environment variables
  - Create basic TypeScript types for DID and Credential
  - _Requirements: 1.1_

- [ ] 2. Create minimal database tables
  - [ ] 2.1 Create user_dids table
    - Add columns: wallet_address (unique), did_uri (unique), created_at
    - Simple index on wallet_address
    - _Requirements: 1.2_

  - [ ] 2.2 Create issuer_dids table
    - Add columns: issuer_address (unique), did_uri (unique), encrypted_keys, created_at
    - Simple index on issuer_address
    - _Requirements: 2.1, 2.2_

  - [ ] 2.3 Create verifiable_credentials table
    - Add columns: id, holder_did, issuer_did, credential_json (jsonb), card_id, template_id, revoked (boolean), created_at
    - Link to existing templates_cache via template_id
    - _Requirements: 4.1, 6.1_

- [ ] 3. Implement core KILT service
  - [ ] 3.1 Create kilt-service.ts with connection setup
    - Initialize KILT API connection
    - Add simple error handling for connection failures
    - _Requirements: 1.1_

  - [ ] 3.2 Implement DID functions
    - Write createLightDid() - generates light DID from mnemonic
    - Write storeDid() - saves DID to user_dids table
    - Write getDid() - retrieves DID by wallet address
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.3 Implement credential functions
    - Write createCredential() - creates VC from claim data
    - Write signCredential() - signs VC with issuer DID
    - Write verifyCredential() - verifies signature and checks revocation
    - _Requirements: 4.1, 4.2, 7.2_

- [ ] 4. Build user DID management
  - [ ] 4.1 Create simple DID creation flow
    - Add DID check on wallet connection in useAuth hook
    - If no DID exists, auto-create light DID
    - Store DID in database
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 4.2 Add DID display to ProfileView
    - Show user's DID with copy button
    - Simple styling, no fancy UI
    - _Requirements: 1.4_

- [ ] 5. Build issuer DID setup
  - [ ] 5.1 Create issuer DID on first issuer login
    - Check if issuer has DID in issuer_dids table
    - If not, generate DID and store encrypted keys
    - Show simple success message
    - _Requirements: 2.1, 2.2_

  - [ ] 5.2 Add issuer DID display to IssuerDashboard
    - Show issuer DID in dashboard header
    - Add copy button
    - _Requirements: 2.3_

- [ ] 6. Implement credential issuance
  - [ ] 6.1 Create simple CType for reputation cards
    - Define one CType schema with fields: template_id, card_id, tier, issue_date
    - Register CType on KILT (do once, hardcode hash)
    - _Requirements: 3.1, 3.2_

  - [ ] 6.2 Modify IssueCardForm to create VCs
    - After successful card issuance, create VC
    - Sign VC with issuer DID
    - Store VC JSON in verifiable_credentials table
    - If KILT fails, continue with database-only (try-catch)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 6.3 Handle recipient DID resolution
    - Before issuing, check if recipient has DID
    - If not, show error asking them to create profile first
    - _Requirements: 4.1_

- [ ] 7. Build credential display
  - [ ] 7.1 Update ProfileView to show VCs
    - Fetch VCs from verifiable_credentials table
    - Display alongside existing cards
    - Show simple "Verified" badge if VC exists
    - _Requirements: 6.1, 6.2_

  - [ ] 7.2 Add basic verification display
    - Show issuer DID
    - Show issued date
    - Show revoked status (if revoked = true)
    - _Requirements: 6.2, 6.3_

- [ ] 8. Implement claim links with VCs
  - [ ] 8.1 Modify claim link generation
    - When generating claim link, create VC
    - Store VC with holder_did = null (pending)
    - Link VC to claim link ID
    - _Requirements: 5.1_

  - [ ] 8.2 Update claim link redemption
    - When user claims, check if they have DID
    - Update VC holder_did to user's DID
    - Mark as claimed
    - _Requirements: 5.2, 5.3_

  - [ ] 8.3 Prevent duplicate claims
    - Check if VC already has holder_did set
    - Show error if already claimed
    - _Requirements: 5.4, 5.5_

- [ ] 9. Add basic verification
  - [ ] 9.1 Implement verifyCredential function
    - Verify signature using KILT SDK
    - Check issuer DID is valid
    - Check revoked flag in database
    - Return simple true/false result
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 9.2 Add verification status to credential cards
    - Call verifyCredential when displaying
    - Show green checkmark if valid
    - Show red X if invalid or revoked
    - _Requirements: 7.2, 7.4_

- [ ]* 10. Add simple revocation (optional)
  - [ ]* 10.1 Add revoke button to issuer dashboard
    - List issued credentials
    - Add "Revoke" button next to each
    - Update revoked = true in database
    - _Requirements: 7.3_

  - [ ]* 10.2 Update verification to check revocation
    - Check revoked flag during verification
    - Display "REVOKED" status prominently
    - _Requirements: 7.3, 7.4_

- [ ]* 11. Add NFT minting (optional)
  - [ ]* 11.1 Create simple mint function
    - Add "Mint as NFT" button to credential cards
    - Call existing ReputationCard contract mint function
    - Store NFT token_id in verifiable_credentials table
    - _Requirements: 8.1, 8.2_

  - [ ]* 11.2 Show NFT status
    - If token_id exists, show "Minted as NFT #X"
    - Link to Moonbase explorer
    - _Requirements: 8.3, 8.4_

- [ ] 12. Basic error handling
  - [ ] 12.1 Add try-catch to all KILT operations
    - Wrap DID creation in try-catch
    - Wrap credential issuance in try-catch
    - Wrap verification in try-catch
    - Log errors to console
    - _Requirements: 1.5, 4.5_

  - [ ] 12.2 Show user-friendly error messages
    - "Failed to create DID" with retry button
    - "Failed to issue credential" - continue with database only
    - "Failed to verify credential" - show warning
    - _Requirements: 1.5, 4.5_
