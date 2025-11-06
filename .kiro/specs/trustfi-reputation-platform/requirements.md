# Requirements Document

## Introduction

The TrustFi System is a complete decentralized reputation platform that enables users to build, verify, and showcase their trustworthiness through blockchain-based credentials. The system combines smart contracts for on-chain reputation management with a user-friendly web interface for seamless interaction with Polkadot wallets.

## Glossary

- **TrustFi System**: The complete decentralized reputation platform including smart contracts and web interface
- **Profile NFT**: A non-fungible token representing a user's identity and reputation profile on-chain
- **Reputation Card**: A verifiable credential issued to users based on their actions and achievements
- **Web Interface**: The frontend application providing user interaction with the TrustFi System
- **Wallet Connection**: Integration allowing users to connect their Polkadot wallets to the Web Interface
- **Reputation Score**: A numerical value representing a user's trustworthiness and credibility
- **Credential Issuer**: An authorized entity that can issue Reputation Cards to users
- **Verification System**: The mechanism for validating the authenticity of Reputation Cards

## Requirements

### Requirement 1

**User Story:** As a new user, I want to create a unique reputation profile, so that I can start building my on-chain credibility.

#### Acceptance Criteria

1. WHEN a user connects their Polkadot wallet, THE TrustFi System SHALL create a unique Profile NFT for that wallet address
2. THE Profile NFT SHALL contain the user's wallet address and initial reputation score of zero
3. WHEN a Profile NFT is created, THE TrustFi System SHALL emit a ProfileCreated event with the user's wallet address and token ID
4. THE TrustFi System SHALL prevent duplicate Profile NFTs for the same wallet address
5. THE Profile NFT SHALL be transferable only by the current owner

### Requirement 2

**User Story:** As a credential issuer, I want to issue verifiable reputation cards to users, so that I can recognize their achievements and contributions.

#### Acceptance Criteria

1. WHEN an authorized issuer submits a reputation card request, THE TrustFi System SHALL mint a new Reputation Card NFT
2. THE Reputation Card SHALL contain the recipient's wallet address, issuer information, achievement description, and timestamp
3. THE TrustFi System SHALL update the recipient's reputation score based on the card's value
4. WHEN a Reputation Card is issued, THE TrustFi System SHALL emit a ReputationCardIssued event
5. THE Reputation Card SHALL be non-transferable once issued to maintain authenticity

### Requirement 3

**User Story:** As a user, I want to view and manage my reputation profile through a web interface, so that I can easily track my credibility progress.

#### Acceptance Criteria

1. WHEN a user accesses the Web Interface, THE TrustFi System SHALL display a wallet connection option
2. WHEN a user connects their wallet, THE Web Interface SHALL retrieve and display their Profile NFT information
3. THE Web Interface SHALL display the user's current reputation score and all associated Reputation Cards
4. THE Web Interface SHALL allow users to view detailed information about each Reputation Card
5. THE Web Interface SHALL update in real-time when new Reputation Cards are received

### Requirement 4

**User Story:** As a verifier, I want to validate the authenticity of reputation cards, so that I can trust the credibility information presented.

#### Acceptance Criteria

1. WHEN a verifier queries a Reputation Card, THE Verification System SHALL return the card's on-chain data
2. THE Verification System SHALL provide the issuer's identity and authorization status
3. THE Verification System SHALL display the card's creation timestamp and immutable achievement data
4. THE Verification System SHALL indicate whether the card is still valid and has not been revoked
5. THE Verification System SHALL be accessible through both the Web Interface and direct smart contract calls

### Requirement 5

**User Story:** As a system administrator, I want to manage credential issuers and system parameters, so that I can maintain the platform's integrity.

#### Acceptance Criteria

1. THE TrustFi System SHALL maintain a list of authorized credential issuers
2. WHEN an administrator adds a new issuer, THE TrustFi System SHALL update the authorized issuers list
3. THE TrustFi System SHALL allow administrators to revoke issuer authorization
4. THE TrustFi System SHALL prevent unauthorized entities from issuing Reputation Cards
5. THE TrustFi System SHALL allow administrators to update reputation scoring parameters