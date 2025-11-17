# Requirements Document

## Introduction

This document defines the requirements for integrating KILT Protocol into the TrustFi platform to enable decentralized identity (DID), verifiable credentials (VCs), and cross-chain reputation management. The integration will transform TrustFi's current database-centric credential system into a decentralized, cryptographically verifiable, and portable credential infrastructure while maintaining backward compatibility with existing functionality.

## Glossary

- **KILT Protocol**: A blockchain protocol for decentralized identifiers and verifiable credentials built on Polkadot
- **DID (Decentralized Identifier)**: A globally unique identifier that enables verifiable, self-sovereign digital identity
- **VC (Verifiable Credential)**: A tamper-evident credential with cryptographic proof of authorship
- **Attester**: An entity (TrustFi issuer) that signs and issues verifiable credentials
- **CType (Credential Type)**: A schema definition for a specific type of credential in KILT
- **TrustFi System**: The existing badge and reputation platform
- **Issuer Dashboard**: The administrative interface where issuers create and manage credential templates
- **User Wallet**: A Polkadot-compatible wallet (Talisman, SubWallet, Polkadot.js) used for authentication
- **Claim Link**: A shareable URL that allows users to claim a credential
- **Supabase**: The current database system storing issuer templates and claims

## Requirements

### Requirement 1

**User Story:** As a TrustFi user, I want to have a KILT DID associated with my wallet, so that I can hold verifiable credentials across platforms

#### Acceptance Criteria

1. WHEN a user connects their Polkadot-compatible wallet to TrustFi, THE TrustFi System SHALL generate or retrieve a KILT DID for that user
2. THE TrustFi System SHALL store the association between the user's wallet address and their KILT DID in Supabase
3. WHEN a user reconnects with the same wallet, THE TrustFi System SHALL retrieve their existing KILT DID without creating a duplicate
4. THE TrustFi System SHALL display the user's KILT DID in their profile view
5. IF DID generation fails, THEN THE TrustFi System SHALL log the error and allow the user to retry the operation

### Requirement 2

**User Story:** As a TrustFi issuer, I want to register as a KILT attester with a DID, so that I can issue cryptographically verifiable credentials

#### Acceptance Criteria

1. WHEN an issuer account is created or upgraded, THE TrustFi System SHALL generate a KILT DID for the issuer
2. THE TrustFi System SHALL store the issuer's KILT DID and associated cryptographic keys securely
3. THE TrustFi System SHALL display the issuer's DID in the Issuer Dashboard
4. WHEN an issuer signs a credential, THE TrustFi System SHALL use their KILT DID private key to create the cryptographic signature
5. THE TrustFi System SHALL support multiple issuers, each with their own unique KILT DID

### Requirement 3

**User Story:** As a TrustFi issuer, I want to create credential templates as KILT CTypes, so that my credentials follow standardized schemas

#### Acceptance Criteria

1. WHEN an issuer creates a new template in the Issuer Dashboard, THE TrustFi System SHALL create a corresponding KILT CType
2. THE TrustFi System SHALL include template metadata (template_id, card_id, tier, issue_date) in the CType schema
3. THE TrustFi System SHALL store the CType hash alongside the template record in Supabase
4. THE TrustFi System SHALL validate that template data conforms to the CType schema before credential issuance
5. WHEN displaying templates, THE TrustFi System SHALL show both the database template ID and the KILT CType hash

### Requirement 4

**User Story:** As a TrustFi issuer, I want to issue verifiable credentials to users, so that they can prove their achievements cryptographically

#### Acceptance Criteria

1. WHEN an issuer issues a card through the Issuer Dashboard, THE TrustFi System SHALL create both a database record and a KILT verifiable credential
2. THE TrustFi System SHALL sign the credential using the issuer's KILT DID
3. THE TrustFi System SHALL include the template_id, card_id, tier, and issue_date in the credential claim
4. THE TrustFi System SHALL store the credential in the user's associated storage (wallet or Supabase)
5. IF credential issuance fails, THEN THE TrustFi System SHALL roll back the database transaction and notify the issuer

### Requirement 5

**User Story:** As a TrustFi user, I want to claim credentials via claim links, so that I can receive verifiable credentials without direct issuer interaction

#### Acceptance Criteria

1. WHEN an issuer generates a claim link, THE TrustFi System SHALL create a claimable KILT credential associated with that link
2. WHEN a user accesses a claim link with their wallet connected, THE TrustFi System SHALL verify the user has a KILT DID
3. WHEN a user claims a credential, THE TrustFi System SHALL transfer the signed credential to the user's DID
4. THE TrustFi System SHALL mark the claim link as used after successful claim
5. THE TrustFi System SHALL prevent the same claim link from being used multiple times

### Requirement 6

**User Story:** As a TrustFi user, I want to view my verifiable credentials in my profile, so that I can see all my achievements and badges

#### Acceptance Criteria

1. WHEN a user views their profile, THE TrustFi System SHALL retrieve all KILT credentials associated with their DID
2. THE TrustFi System SHALL display credential details including issuer DID, template name, tier, and issue date
3. THE TrustFi System SHALL provide a verification status indicator for each credential
4. THE TrustFi System SHALL allow users to export their credentials for use in external applications
5. THE TrustFi System SHALL maintain backward compatibility by also displaying legacy database-only credentials

### Requirement 7

**User Story:** As a third-party verifier, I want to verify TrustFi credentials, so that I can trust the authenticity of user achievements

#### Acceptance Criteria

1. THE TrustFi System SHALL provide a credential verification interface accessible without authentication
2. WHEN a credential is submitted for verification, THE TrustFi System SHALL validate the cryptographic signature against the issuer's DID
3. THE TrustFi System SHALL verify that the credential has not been revoked
4. THE TrustFi System SHALL display verification results including issuer identity, credential contents, and validity status
5. IF verification fails, THEN THE TrustFi System SHALL provide specific error messages indicating the failure reason

### Requirement 8

**User Story:** As a TrustFi administrator, I want to convert verifiable credentials into on-chain NFT badges, so that users can display their achievements as blockchain assets

#### Acceptance Criteria

1. WHEN a user requests NFT minting for a valid credential, THE TrustFi System SHALL generate a lightweight proof from the KILT credential
2. THE TrustFi System SHALL call the smart contract on Moonbase to mint an NFT representing the credential
3. THE TrustFi System SHALL include credential metadata (template_id, tier, issue_date) in the NFT metadata
4. THE TrustFi System SHALL associate the NFT token ID with the original KILT credential in Supabase
5. THE TrustFi System SHALL display both the verifiable credential and the NFT badge in the user's profile

### Requirement 9

**User Story:** As a TrustFi developer, I want the KILT integration to coexist with the existing database system, so that we can migrate gradually without breaking current functionality

#### Acceptance Criteria

1. THE TrustFi System SHALL maintain all existing Supabase tables and queries during KILT integration
2. WHEN issuing credentials, THE TrustFi System SHALL write to both Supabase and KILT systems
3. THE TrustFi System SHALL support reading credentials from either the database or KILT, with KILT taking precedence when both exist
4. THE TrustFi System SHALL provide a migration utility to convert existing database credentials to KILT credentials
5. THE TrustFi System SHALL allow feature flags to enable or disable KILT functionality per issuer or globally

### Requirement 10

**User Story:** As a TrustFi user, I want my credentials to work across different blockchain networks, so that my reputation is portable

#### Acceptance Criteria

1. THE TrustFi System SHALL support credential verification on both KILT blockchain and EVM-compatible chains
2. THE TrustFi System SHALL provide cross-chain credential anchoring to Moonbase, Ethereum, or Polygon
3. WHEN a credential is anchored cross-chain, THE TrustFi System SHALL store the anchor transaction hash
4. THE TrustFi System SHALL allow users to prove credential ownership on any supported chain
5. THE TrustFi System SHALL maintain a unified view of credentials regardless of which chain they are anchored to
