# Requirements Document

## Introduction

This document outlines the requirements for enhancing the issuer experience on the TrustFi Reputation Platform. Currently, issuers can only mint reputation cards directly to recipients. This enhancement introduces a flexible minting system where issuers can choose between two approaches: direct minting (issuer mints the NFT and assigns it to a recipient) or collectible minting (issuer creates a collectible NFT that users can mint themselves). This flexibility enables new use cases such as event badges, achievement unlocks, and community rewards while maintaining the platform's reputation integrity.

## Glossary

- **TrustFi Platform**: The decentralized reputation system built on Ethereum
- **Issuer**: An authorized entity that can create and distribute reputation cards
- **Reputation Card**: A verifiable credential issued as an NFT on the blockchain
- **Direct Minting**: The process where an issuer mints an NFT and assigns it directly to a specific recipient's wallet address
- **Collectible Minting**: The process where an issuer creates a claimable NFT that eligible users can mint to their own wallets
- **Minting Mode**: The configuration setting that determines whether a reputation card uses direct or collectible minting
- **Claim Eligibility**: The criteria that determine which users are allowed to mint a collectible reputation card
- **Mint Transaction**: The blockchain transaction that creates a new NFT token
- **Gas Fee**: The transaction cost paid to execute blockchain operations
- **Smart Contract**: The on-chain code that manages reputation card creation and ownership
- **Issuer Dashboard**: The interface where issuers manage their reputation cards and minting configurations

## Requirements

### Requirement 1

**User Story:** As an issuer, I want to choose between direct minting and collectible minting when creating a reputation card, so that I can select the appropriate distribution method for my use case

#### Acceptance Criteria

1. WHEN an issuer creates a new reputation card type, THE Issuer Dashboard SHALL display a minting mode selection with two options
2. WHEN the issuer selects direct minting mode, THE Issuer Dashboard SHALL configure the card for issuer-controlled distribution
3. WHEN the issuer selects collectible minting mode, THE Issuer Dashboard SHALL configure the card for user-initiated claiming
4. WHEN saving the card configuration, THE Smart Contract SHALL store the minting mode as immutable metadata
5. WHEN viewing existing card types, THE Issuer Dashboard SHALL display the configured minting mode for each card

### Requirement 2

**User Story:** As an issuer using direct minting, I want to mint reputation cards to specific wallet addresses, so that I can award credentials to verified recipients

#### Acceptance Criteria

1. WHEN an issuer selects a direct minting card type, THE Issuer Dashboard SHALL provide an interface to enter recipient wallet addresses
2. WHEN the issuer initiates direct minting, THE Smart Contract SHALL mint the NFT to the specified recipient address
3. WHEN the minting transaction completes, THE Smart Contract SHALL transfer ownership to the recipient immediately
4. WHEN direct minting succeeds, THE Issuer Dashboard SHALL display a confirmation with the transaction hash
5. WHEN the recipient has a profile, THE TrustFi Platform SHALL notify the recipient of the new reputation card

### Requirement 3

**User Story:** As an issuer using collectible minting, I want to create claimable reputation cards with eligibility criteria, so that qualified users can mint them independently

#### Acceptance Criteria

1. WHEN an issuer creates a collectible card type, THE Issuer Dashboard SHALL provide options to configure claim eligibility criteria
2. WHEN the issuer sets eligibility criteria, THE Smart Contract SHALL store the requirements on-chain or reference them verifiably
3. WHEN the issuer publishes a collectible card, THE Smart Contract SHALL make it available for claiming by eligible users
4. WHEN a collectible card is published, THE TrustFi Platform SHALL display it in the collectibles gallery for eligible users
5. WHEN the issuer updates eligibility criteria, THE Smart Contract SHALL apply changes to future claims without affecting existing tokens

### Requirement 4

**User Story:** As a user, I want to browse available collectible reputation cards, so that I can discover and claim credentials I am eligible for

#### Acceptance Criteria

1. WHEN a user accesses the collectibles section, THE TrustFi Platform SHALL display all available collectible reputation cards
2. WHEN displaying collectibles, THE TrustFi Platform SHALL indicate which cards the user is eligible to claim
3. WHEN a user views a collectible card, THE TrustFi Platform SHALL show the eligibility requirements and claim instructions
4. WHEN a collectible has limited supply, THE TrustFi Platform SHALL display the remaining quantity available
5. WHEN a user has already claimed a collectible, THE TrustFi Platform SHALL indicate the card as already owned

### Requirement 5

**User Story:** As a user, I want to mint collectible reputation cards to my wallet, so that I can claim credentials I have earned or qualify for

#### Acceptance Criteria

1. WHEN a user clicks claim on an eligible collectible, THE TrustFi Platform SHALL initiate the minting transaction
2. WHEN the user confirms the transaction, THE Smart Contract SHALL verify eligibility before minting
3. WHEN eligibility is confirmed, THE Smart Contract SHALL mint the NFT to the user's wallet address
4. WHEN minting completes successfully, THE TrustFi Platform SHALL display the new card in the user's collection
5. WHEN the user pays gas fees, THE Smart Contract SHALL execute the mint without additional payment to the issuer

### Requirement 6

**User Story:** As an issuer, I want to set supply limits for collectible reputation cards, so that I can create scarcity and exclusivity

#### Acceptance Criteria

1. WHEN creating a collectible card type, THE Issuer Dashboard SHALL provide an option to set maximum supply
2. WHEN a supply limit is set, THE Smart Contract SHALL enforce the maximum number of tokens that can be minted
3. WHEN the supply limit is reached, THE Smart Contract SHALL prevent further minting attempts
4. WHEN a collectible approaches its supply limit, THE TrustFi Platform SHALL display the remaining quantity to users
5. WHERE no supply limit is set, THE Smart Contract SHALL allow unlimited minting by eligible users

### Requirement 7

**User Story:** As an issuer, I want to configure time-based availability for collectible cards, so that I can create time-limited claiming opportunities

#### Acceptance Criteria

1. WHEN creating a collectible card type, THE Issuer Dashboard SHALL provide options to set start and end claim dates
2. WHEN a start date is configured, THE Smart Contract SHALL prevent claiming before the specified timestamp
3. WHEN an end date is configured, THE Smart Contract SHALL prevent claiming after the specified timestamp
4. WHEN a collectible is not yet available, THE TrustFi Platform SHALL display the start date to users
5. WHEN a collectible has expired, THE TrustFi Platform SHALL indicate that claiming is no longer available

### Requirement 8

**User Story:** As an issuer, I want to define eligibility criteria for collectible cards, so that only qualified users can claim them

#### Acceptance Criteria

1. WHEN configuring a collectible card, THE Issuer Dashboard SHALL provide eligibility options including whitelist, token ownership, and open access
2. WHEN whitelist eligibility is selected, THE Smart Contract SHALL only allow addresses on the approved list to mint
3. WHEN token ownership eligibility is selected, THE Smart Contract SHALL verify the user owns required tokens before minting
4. WHEN open access is selected, THE Smart Contract SHALL allow any user to mint the collectible
5. WHEN a user attempts to claim, THE Smart Contract SHALL validate eligibility before executing the mint transaction

### Requirement 9

**User Story:** As an issuer, I want to view analytics on collectible card claims, so that I can understand engagement and distribution

#### Acceptance Criteria

1. WHEN viewing a collectible card in the dashboard, THE Issuer Dashboard SHALL display the total number of claims
2. WHEN analytics are shown, THE Issuer Dashboard SHALL provide a list of wallet addresses that have claimed the card
3. WHEN viewing claim analytics, THE Issuer Dashboard SHALL show the claim timeline with dates and quantities
4. WHEN a supply limit exists, THE Issuer Dashboard SHALL display the percentage of supply that has been claimed
5. WHEN viewing multiple collectibles, THE Issuer Dashboard SHALL provide comparative analytics across card types

### Requirement 10

**User Story:** As a user, I want to see clear visual distinction between directly minted and collectible reputation cards, so that I understand how I obtained each credential

#### Acceptance Criteria

1. WHEN viewing reputation cards in my collection, THE TrustFi Platform SHALL display a badge indicating the minting method
2. WHEN a card was directly minted, THE TrustFi Platform SHALL show an "Awarded" or "Issued" indicator
3. WHEN a card was self-claimed, THE TrustFi Platform SHALL show a "Claimed" or "Collected" indicator
4. WHEN viewing card details, THE TrustFi Platform SHALL display the minting method and relevant metadata
5. WHEN filtering cards, THE TrustFi Platform SHALL provide options to filter by minting method

### Requirement 11

**User Story:** As an issuer, I want to pause and resume collectible card claiming, so that I can control distribution timing without deleting the card

#### Acceptance Criteria

1. WHEN managing a collectible card, THE Issuer Dashboard SHALL provide pause and resume controls
2. WHEN an issuer pauses a collectible, THE Smart Contract SHALL prevent new claims until resumed
3. WHEN a collectible is paused, THE TrustFi Platform SHALL display a paused status to users
4. WHEN an issuer resumes a collectible, THE Smart Contract SHALL allow eligible users to claim again
5. WHEN a collectible is paused, THE Issuer Dashboard SHALL display the pause status and resume option

### Requirement 12

**User Story:** As a user, I want to receive notifications about new collectible cards I am eligible for, so that I don't miss claiming opportunities

#### Acceptance Criteria

1. WHEN a new collectible card is published, THE TrustFi Platform SHALL identify eligible users based on criteria
2. WHEN a user is eligible for a new collectible, THE TrustFi Platform SHALL display a notification badge
3. WHEN viewing notifications, THE TrustFi Platform SHALL show details about the new collectible and claim instructions
4. WHEN a collectible has a time limit, THE TrustFi Platform SHALL display the expiration date in the notification
5. WHEN a user claims a collectible, THE TrustFi Platform SHALL remove the notification for that card

### Requirement 13

**User Story:** As an issuer, I want to preview how my collectible card will appear to users, so that I can ensure the presentation is correct before publishing

#### Acceptance Criteria

1. WHEN creating a collectible card, THE Issuer Dashboard SHALL provide a preview mode
2. WHEN in preview mode, THE Issuer Dashboard SHALL display the card as it will appear in the collectibles gallery
3. WHEN previewing, THE Issuer Dashboard SHALL show eligibility requirements as users will see them
4. WHEN previewing, THE Issuer Dashboard SHALL display supply limits and time restrictions
5. WHEN satisfied with the preview, THE Issuer Dashboard SHALL allow the issuer to publish the collectible

### Requirement 14

**User Story:** As a user, I want to see the gas cost estimate before claiming a collectible card, so that I can decide whether to proceed with the transaction

#### Acceptance Criteria

1. WHEN a user initiates a claim, THE TrustFi Platform SHALL estimate the gas cost for the minting transaction
2. WHEN displaying the gas estimate, THE TrustFi Platform SHALL show the cost in both native currency and USD equivalent
3. WHEN gas prices are high, THE TrustFi Platform SHALL display a warning about elevated transaction costs
4. WHEN the user confirms the transaction, THE TrustFi Platform SHALL proceed with the mint using the user's wallet
5. IF the user's wallet has insufficient funds for gas, THEN THE TrustFi Platform SHALL display an error with the required amount

### Requirement 15

**User Story:** As an issuer, I want to edit collectible card metadata before any claims occur, so that I can correct mistakes or update information

#### Acceptance Criteria

1. WHEN no claims have been made, THE Issuer Dashboard SHALL allow editing of card metadata
2. WHEN editing metadata, THE Issuer Dashboard SHALL allow changes to title, description, and image
3. WHEN saving metadata changes, THE Smart Contract SHALL update the card configuration
4. WHEN claims have already occurred, THE Issuer Dashboard SHALL prevent metadata changes to maintain consistency
5. WHEN metadata cannot be edited, THE Issuer Dashboard SHALL display a message explaining that claims have already been made

### Requirement 16

**User Story:** As a user, I want to share collectible cards I've claimed on social media, so that I can showcase my achievements

#### Acceptance Criteria

1. WHEN viewing a claimed collectible card, THE TrustFi Platform SHALL provide social sharing options
2. WHEN sharing to social media, THE TrustFi Platform SHALL generate a preview image with card details
3. WHEN sharing, THE TrustFi Platform SHALL include a link to the public verification page
4. WHEN the share link is accessed, THE TrustFi Platform SHALL display the card with blockchain verification
5. WHERE supported, THE TrustFi Platform SHALL include Open Graph metadata for rich social media previews

### Requirement 17

**User Story:** As an issuer, I want to create collectible cards with different rarity tiers, so that I can offer varied levels of achievement recognition

#### Acceptance Criteria

1. WHEN creating a collectible card, THE Issuer Dashboard SHALL provide rarity tier options
2. WHEN a rarity tier is selected, THE Smart Contract SHALL store the rarity as card metadata
3. WHEN displaying collectibles, THE TrustFi Platform SHALL use visual styling based on rarity tier
4. WHEN a user claims a rare collectible, THE TrustFi Platform SHALL display a special celebration animation
5. WHEN viewing analytics, THE Issuer Dashboard SHALL show claim statistics grouped by rarity tier

### Requirement 18

**User Story:** As a user, I want to see a history of collectible cards I've claimed, so that I can track my collection progress over time

#### Acceptance Criteria

1. WHEN viewing my profile, THE TrustFi Platform SHALL provide a claim history section
2. WHEN displaying claim history, THE TrustFi Platform SHALL show each collectible with claim date and transaction hash
3. WHEN viewing claim history, THE TrustFi Platform SHALL sort claims chronologically with most recent first
4. WHEN clicking a claim entry, THE TrustFi Platform SHALL display full card details and blockchain verification
5. WHEN filtering my collection, THE TrustFi Platform SHALL provide an option to view only claimed collectibles

### Requirement 19

**User Story:** As an issuer, I want to revoke or burn specific collectible tokens if needed, so that I can handle cases of fraud or policy violations

#### Acceptance Criteria

1. WHEN managing issued collectibles, THE Issuer Dashboard SHALL provide a revocation interface for specific tokens
2. WHEN an issuer initiates revocation, THE Smart Contract SHALL verify the issuer's authority
3. WHEN revocation is confirmed, THE Smart Contract SHALL burn the token or mark it as revoked
4. WHEN a token is revoked, THE TrustFi Platform SHALL update the user's collection to reflect the revocation
5. WHEN viewing a revoked token, THE TrustFi Platform SHALL display a revocation notice with reason if provided

### Requirement 20

**User Story:** As a user, I want to see trending and popular collectible cards, so that I can discover high-value credentials to claim

#### Acceptance Criteria

1. WHEN browsing collectibles, THE TrustFi Platform SHALL display a trending section based on claim activity
2. WHEN calculating trending status, THE TrustFi Platform SHALL consider claim velocity and recency
3. WHEN displaying trending collectibles, THE TrustFi Platform SHALL show claim counts and time remaining
4. WHEN a collectible is nearly sold out, THE TrustFi Platform SHALL highlight it in the trending section
5. WHEN viewing trending collectibles, THE TrustFi Platform SHALL provide sorting options by popularity, scarcity, and expiration
