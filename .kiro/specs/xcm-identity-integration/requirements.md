# Requirements Document

## Introduction

The XCM Identity Integration System extends the TrustFi Reputation Platform to leverage Polkadot's Cross-Consensus Messaging (XCM) protocol for cross-chain identity verification. The system enables reputation NFTs to be associated with verified on-chain identities from other parachains (such as identity-focused chains or Moonbeam), creating a more robust and interoperable trust network across the Polkadot ecosystem.

## Glossary

- **XCM Integration System**: The cross-chain messaging infrastructure that connects TrustFi with other Polkadot parachains
- **Identity Parachain**: A specialized parachain (e.g., KILT Protocol, Litentry) that provides on-chain identity verification services
- **Cross-Chain Identity Link**: A verifiable connection between a TrustFi Profile NFT and an on-chain identity from another parachain
- **XCM Message Handler**: The smart contract component that processes incoming and outgoing XCM messages
- **Identity Verification Request**: An XCM message sent to an Identity Parachain to verify user credentials
- **Identity Attestation**: A cryptographically signed proof from an Identity Parachain confirming user identity details
- **Moonbeam Bridge**: The EVM-compatible parachain used as a bridge for XCM communication
- **Verified Profile Badge**: An on-chain indicator showing that a Profile NFT is linked to a verified cross-chain identity
- **Cross-Chain Reputation Score**: An enhanced reputation metric that includes verification status from other parachains
- **XCM Router**: The component responsible for routing messages between TrustFi and target parachains

## Requirements

### Requirement 1

**User Story:** As a user, I want to link my TrustFi profile with my verified identity from another parachain, so that my reputation becomes more trustworthy and verifiable across the Polkadot ecosystem.

#### Acceptance Criteria

1. WHEN a user initiates an identity linking request, THE XCM Integration System SHALL send an XCM message to the specified Identity Parachain
2. THE XCM message SHALL contain the user's wallet address, Profile NFT token ID, and requested identity verification parameters
3. WHEN the Identity Parachain responds with verification data, THE XCM Message Handler SHALL process the attestation
4. THE XCM Integration System SHALL update the Profile NFT metadata to include the cross-chain identity reference
5. WHEN identity linking succeeds, THE XCM Integration System SHALL emit an IdentityLinked event with the parachain ID and verification details

### Requirement 2

**User Story:** As a credential issuer, I want to verify that a user has a legitimate cross-chain identity before issuing high-value reputation cards, so that I can ensure the authenticity of recipients.

#### Acceptance Criteria

1. WHEN an issuer queries a Profile NFT, THE XCM Integration System SHALL return the identity verification status
2. THE XCM Integration System SHALL provide the source parachain ID and verification timestamp
3. THE XCM Integration System SHALL indicate the verification level (basic, enhanced, or full KYC)
4. WHERE a Profile NFT has verified identity, THE XCM Integration System SHALL display a Verified Profile Badge
5. THE XCM Integration System SHALL allow issuers to set minimum verification requirements for reputation card issuance

### Requirement 3

**User Story:** As a platform administrator, I want to configure which parachains are trusted for identity verification, so that I can maintain the integrity of the cross-chain verification system.

#### Acceptance Criteria

1. THE XCM Integration System SHALL maintain a whitelist of approved Identity Parachains
2. WHEN an administrator adds a parachain, THE XCM Integration System SHALL store the parachain ID and configuration parameters
3. THE XCM Integration System SHALL prevent XCM messages from non-whitelisted parachains
4. THE XCM Integration System SHALL allow administrators to update XCM routing configurations
5. WHEN a parachain is removed from the whitelist, THE XCM Integration System SHALL mark existing verifications with a deprecation notice

### Requirement 4

**User Story:** As a user, I want to see my cross-chain identity verification status in the web interface, so that I can understand how my verified identity enhances my reputation profile.

#### Acceptance Criteria

1. WHEN a user views their profile, THE Web Interface SHALL display their identity verification status
2. THE Web Interface SHALL show the source parachain name and verification level
3. THE Web Interface SHALL provide a button to initiate identity linking for unverified profiles
4. THE Web Interface SHALL display the enhanced Cross-Chain Reputation Score for verified profiles
5. THE Web Interface SHALL show a visual Verified Profile Badge for profiles with active identity links

### Requirement 5

**User Story:** As a developer integrating with TrustFi, I want to query cross-chain identity verification data via smart contract calls, so that I can build applications that leverage verified reputation data.

#### Acceptance Criteria

1. THE XCM Integration System SHALL provide a public function to query identity verification status by Profile NFT ID
2. THE XCM Integration System SHALL return structured data including parachain ID, verification timestamp, and verification level
3. THE XCM Integration System SHALL provide a function to verify if a wallet address has a verified identity
4. THE XCM Integration System SHALL emit events for all identity verification state changes
5. THE XCM Integration System SHALL maintain backward compatibility with existing TrustFi smart contract interfaces

### Requirement 6

**User Story:** As a user on Moonbeam, I want to interact with TrustFi contracts and link my identity without leaving the Moonbeam ecosystem, so that I can leverage familiar EVM tooling.

#### Acceptance Criteria

1. WHEN a user connects from Moonbeam, THE XCM Integration System SHALL accept XCM messages via the Moonbeam Bridge
2. THE XCM Integration System SHALL support EVM-compatible wallet signatures for identity verification
3. THE XCM Integration System SHALL allow users to initiate identity linking from Moonbeam-based dApps
4. THE XCM Integration System SHALL route verification requests through Moonbeam's XCM infrastructure
5. WHEN verification completes, THE XCM Integration System SHALL send confirmation messages back to Moonbeam

### Requirement 7

**User Story:** As a security-conscious user, I want my cross-chain identity verification to be revocable, so that I can maintain control over my privacy and data sharing.

#### Acceptance Criteria

1. THE XCM Integration System SHALL allow users to revoke their identity link at any time
2. WHEN a user revokes identity verification, THE XCM Integration System SHALL update the Profile NFT metadata
3. THE XCM Integration System SHALL send an XCM message to the Identity Parachain notifying of revocation
4. THE XCM Integration System SHALL remove the Verified Profile Badge from revoked profiles
5. THE XCM Integration System SHALL emit an IdentityRevoked event with the user's wallet address and timestamp
