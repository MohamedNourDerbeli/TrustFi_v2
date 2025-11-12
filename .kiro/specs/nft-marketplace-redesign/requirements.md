# Requirements Document

## Introduction

This document outlines the requirements for redesigning the TrustFi V2 platform user interface to match modern Web3 design standards. TrustFi is a Web3 digital identity and reputation platform built on Polkadot that enables users to build verifiable on-chain reputations through collectible credentials (NFT-based attestations). The V2 architecture introduces a "child NFT" model where ReputationCard NFTs are owned by the ProfileNFT contract, not the user's wallet, and implements a "pull, don't push" score update mechanism. The redesign will transform the existing interface into a visually stunning, user-friendly platform with improved navigation, enhanced visual hierarchy, and a cohesive dark-themed aesthetic inspired by leading NFT marketplaces.

## Glossary

- **TrustFi Platform**: The Web3 application that enables users to create digital identities, collect verifiable credentials, and build on-chain reputation on the Polkadot blockchain
- **User Interface**: The visual presentation layer including all pages, components, and interactive elements
- **Hero Section**: The prominent featured content area at the top of the homepage showcasing platform value proposition and featured collectibles
- **Collectible Card**: A visual component displaying a credential/attestation NFT's image, title, issuer, and claim information
- **Navigation Bar**: The persistent header component containing logo, menu items, and wallet connection actions
- **Profile Page**: A user profile displaying identity information, reputation statistics, and collected credentials
- **Collectibles Gallery**: A responsive grid layout displaying multiple collectible credential cards
- **Countdown Timer**: A visual component showing time remaining for limited-time credential drops or claims
- **Wallet Connection**: The authentication mechanism using Polkadot wallet providers (Talisman, Polkadot.js, SubWallet) and EVM wallets (Metamask, WalletConnect, Coinbase)
- **Dark Theme**: A color scheme using dark backgrounds with vibrant purple/violet accent colors
- **Responsive Design**: Layout adaptation across desktop, tablet, and mobile screen sizes
- **Issuer**: An entity authorized to create and distribute verifiable credentials on the platform
- **Attestation**: A verifiable credential issued to a user's profile as an NFT collectible
- **ProfileNFT**: The master identity NFT that owns all of a user's ReputationCard NFTs (child NFTs)
- **ReputationCard**: A child NFT representing a credential or collectible, owned by the ProfileNFT contract
- **Achievement Tier**: A categorical ranking system (Tiers 1-5) that determines the score value of a ReputationCard
- **Collectible Template**: A claimable credential type that users can self-claim if they meet eligibility requirements
- **Score Recalculation**: A user-triggered action to update their reputation score by calling the ProfileNFT contract

## Requirements

### Requirement 1: Homepage Redesign

**User Story:** As a visitor, I want to see an engaging homepage that explains TrustFi's value proposition and showcases featured credentials, so that I can understand the platform and discover interesting collectibles.

#### Acceptance Criteria

1. WHEN the User Interface loads the homepage, THE TrustFi Platform SHALL display a hero section with headline "Discover Digital Art & Collect NFTs" (or similar Web3 identity messaging), description text, and a primary call-to-action button
2. WHEN the User Interface renders the homepage, THE TrustFi Platform SHALL display a "Trending Collection" section with at least 4 collectible cards in a horizontal scrollable layout
3. WHEN the User Interface renders the homepage, THE TrustFi Platform SHALL display a "Top Creators" section showing issuer/creator avatars, names, and credential counts in a grid layout
4. WHEN the User Interface renders the homepage, THE TrustFi Platform SHALL display a "Browse Categories" section with category cards (Art, Collectibles, Music, Photography - adaptable to credential types)
5. WHEN the User Interface renders the homepage, THE TrustFi Platform SHALL display a "Notable Drops" section featuring upcoming credential releases with countdown timers

### Requirement 2: Navigation System

**User Story:** As a user, I want intuitive navigation throughout the platform, so that I can easily access different sections and connect my wallet.

#### Acceptance Criteria

1. THE TrustFi Platform SHALL display a navigation bar with TrustFi logo, "Marketplace", "Rankings", and "Connect a wallet" menu items
2. WHEN a user is not authenticated, THE TrustFi Platform SHALL display a "Sign Up" button in the navigation bar
3. WHEN a user is authenticated, THE TrustFi Platform SHALL display the user's avatar and profile link in the navigation bar
4. WHEN the User Interface detects a screen width below 768px, THE TrustFi Platform SHALL display a mobile hamburger menu
5. THE TrustFi Platform SHALL highlight the active page in the navigation menu with visual indication

### Requirement 3: Collectible Detail Page

**User Story:** As a user, I want to view detailed information about a credential collectible, so that I can understand its value and claim it.

#### Acceptance Criteria

1. WHEN the User Interface displays a collectible detail page, THE TrustFi Platform SHALL show the collectible image, title, issuer information, and creation date
2. WHEN the User Interface displays a collectible detail page, THE TrustFi Platform SHALL show a countdown timer for time-limited credential claims
3. WHEN the User Interface displays a collectible detail page, THE TrustFi Platform SHALL display claim requirements and eligibility status
4. WHEN the User Interface displays a collectible detail page, THE TrustFi Platform SHALL show a "More From This Issuer" section with related credentials
5. WHEN a user clicks the "Claim" or "Collect" button, THE TrustFi Platform SHALL initiate the credential claiming process

### Requirement 4: Collectibles Gallery Page

**User Story:** As a user, I want to browse all available credential collectibles with filtering options, so that I can find specific types of credentials.

#### Acceptance Criteria

1. WHEN the User Interface loads the collectibles gallery page, THE TrustFi Platform SHALL display a search input field
2. WHEN the User Interface loads the collectibles gallery page, THE TrustFi Platform SHALL display tabs for "NFTs" and "Collections"
3. WHEN the User Interface renders the collectibles grid, THE TrustFi Platform SHALL display collectible cards in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile)
4. WHEN the User Interface displays a collectible card, THE TrustFi Platform SHALL show the collectible image, title, issuer avatar, issuer name, and claim status
5. WHEN a user scrolls to the bottom of the collectibles gallery page, THE TrustFi Platform SHALL load additional collectible cards

### Requirement 5: User Profile Page

**User Story:** As a user, I want to view my profile or another user's profile with their credentials and reputation, so that I can showcase my digital identity.

#### Acceptance Criteria

1. WHEN the User Interface displays a user profile, THE TrustFi Platform SHALL show a hero banner image
2. WHEN the User Interface displays a user profile, THE TrustFi Platform SHALL show the user's avatar, name, reputation score, credentials collected count, and follower count
3. WHEN the User Interface displays a user profile, THE TrustFi Platform SHALL display "Activate Profile" and "Follow" action buttons where appropriate
4. WHEN the User Interface displays a user profile, THE TrustFi Platform SHALL show tabs for "Created", "Owned", and "Collections"
5. WHEN the User Interface displays a user profile, THE TrustFi Platform SHALL show the user's collectible credentials in a responsive grid layout

### Requirement 6: Authentication Flow

**User Story:** As a new user, I want to connect my wallet to access the platform, so that I can create my digital identity and collect credentials.

#### Acceptance Criteria

1. WHEN a user clicks "Sign Up", THE TrustFi Platform SHALL display an account creation flow with profile setup options
2. WHEN a user clicks "Connect a wallet", THE TrustFi Platform SHALL display wallet provider options (Metamask, WalletConnect, Coinbase for EVM; Talisman, Polkadot.js, SubWallet for Polkadot)
3. WHEN the User Interface displays the authentication modal, THE TrustFi Platform SHALL show a visually appealing background image with space/sci-fi aesthetic
4. WHEN a user successfully connects a wallet, THE TrustFi Platform SHALL check if the user has an activated profile
5. WHEN a user successfully connects a wallet, THE TrustFi Platform SHALL update the navigation to show the user's avatar and profile link

### Requirement 7: Rankings Page

**User Story:** As a user, I want to see top-performing users and issuers, so that I can discover reputable profiles and credential providers.

#### Acceptance Criteria

1. WHEN the User Interface loads the rankings page, THE TrustFi Platform SHALL display a "Top Creators" heading
2. WHEN the User Interface renders the rankings list, THE TrustFi Platform SHALL display tabs for "Today", "This Week", "This Month", and "All Time"
3. WHEN the User Interface displays a user ranking, THE TrustFi Platform SHALL show rank number, user avatar, username, change percentage, credential count, and reputation score
4. WHEN the User Interface renders the rankings list, THE TrustFi Platform SHALL display at least 20 users
5. WHEN the User Interface displays change percentage, THE TrustFi Platform SHALL use green color for positive changes and red for negative changes

### Requirement 8: Dark Theme Implementation

**User Story:** As a user, I want a visually appealing dark theme with space/sci-fi aesthetics, so that I can comfortably browse the platform.

#### Acceptance Criteria

1. THE TrustFi Platform SHALL use a dark background color (approximately #1A1A2E to #0D1421) for all pages
2. THE TrustFi Platform SHALL use a vibrant purple/violet color (approximately #6F4FF2) for primary action buttons and accents
3. THE TrustFi Platform SHALL use white or light gray text for primary content with proper contrast
4. THE TrustFi Platform SHALL use subtle dark gray backgrounds (approximately #2D3748) for card components
5. THE TrustFi Platform SHALL maintain WCAG AA contrast ratios for all text elements

### Requirement 9: Responsive Design

**User Story:** As a mobile user, I want the platform to work seamlessly on my device, so that I can manage my digital identity and browse credentials on the go.

#### Acceptance Criteria

1. WHEN the User Interface detects a screen width below 768px, THE TrustFi Platform SHALL adjust the grid layout to single column
2. WHEN the User Interface detects a screen width below 768px, THE TrustFi Platform SHALL display a mobile-optimized navigation menu
3. WHEN the User Interface detects a screen width below 768px, THE TrustFi Platform SHALL adjust font sizes for readability
4. WHEN the User Interface detects a screen width below 768px, THE TrustFi Platform SHALL stack form fields vertically
5. THE TrustFi Platform SHALL maintain touch-friendly button sizes (minimum 44x44px) on mobile devices

### Requirement 10: Footer Component

**User Story:** As a user, I want access to additional information and links in the footer, so that I can learn more about TrustFi and connect with the community.

#### Acceptance Criteria

1. THE TrustFi Platform SHALL display a footer with the TrustFi logo and platform description
2. THE TrustFi Platform SHALL display an "Explore" section with links to Marketplace, Rankings, and "Connect a wallet"
3. THE TrustFi Platform SHALL display a "Join Our Weekly Digest" section with an email subscription form
4. THE TrustFi Platform SHALL display social media icons (Discord, Twitter, potentially GitHub for Web3 community)
5. THE TrustFi Platform SHALL display a copyright notice and relevant legal links

### Requirement 11: Dashboard with Score Recalculation

**User Story:** As a user, I want to view my reputation score and manually trigger score updates, so that I have control over when my score is recalculated.

#### Acceptance Criteria

1. WHEN the User Interface displays the dashboard, THE TrustFi Platform SHALL show the user's current reputation score prominently
2. WHEN the User Interface displays the dashboard, THE TrustFi Platform SHALL display a "Refresh" or "Recalculate Score" button next to the reputation score
3. WHEN a user clicks the recalculate button, THE TrustFi Platform SHALL prompt the user to sign a transaction calling recalculateMyScore() on the ProfileNFT contract
4. WHEN the User Interface displays the dashboard, THE TrustFi Platform SHALL show a feed of recently acquired ReputationCards
5. WHEN the User Interface displays the dashboard, THE TrustFi Platform SHALL feature a "Living Profile" section displaying the dynamic generative art SVG from the ProfileNFT tokenURI

### Requirement 12: Child NFT Architecture Support

**User Story:** As a user, I want to view all my credentials as child NFTs owned by my ProfileNFT, so that I can see my complete identity portfolio.

#### Acceptance Criteria

1. WHEN the User Interface fetches a user's credentials, THE TrustFi Platform SHALL call getCardsByProfile(profileId) on the ReputationCard contract
2. THE TrustFi Platform SHALL NOT scan the user's wallet for ReputationCard NFTs
3. WHEN the User Interface displays a ReputationCard, THE TrustFi Platform SHALL show its achievement tier (e.g., "Tier 3: Significant Contribution")
4. WHEN the User Interface displays a ReputationCard, THE TrustFi Platform SHALL fetch and display the tier's corresponding score value from the tierToScore mapping
5. WHEN the User Interface displays credentials, THE TrustFi Platform SHALL provide filters for "Credentials" (issued) and "Collectibles" (self-claimed)

### Requirement 13: Collectibles Discovery and Claiming

**User Story:** As a user, I want to discover and claim collectible credentials I'm eligible for, so that I can build my reputation.

#### Acceptance Criteria

1. WHEN the User Interface loads the collectibles discovery page, THE TrustFi Platform SHALL fetch all active CollectibleTemplates from the ReputationCard contract
2. WHEN the User Interface displays a collectible template, THE TrustFi Platform SHALL call isEligibleToClaim for the connected user
3. WHEN the User Interface displays a collectible template, THE TrustFi Platform SHALL show the "Claim Now" button as active, disabled, or claimed based on eligibility status
4. WHEN the User Interface displays collectible templates, THE TrustFi Platform SHALL prominently feature the "Civic Duty: Active Polkadot Voter" badge
5. WHEN a user clicks "Claim Now" on an eligible collectible, THE TrustFi Platform SHALL initiate the claiming transaction

### Requirement 14: Issuer Portal Updates for V2

**User Story:** As an issuer, I want to issue credentials using the new achievement tier system, so that I can properly categorize credential value.

#### Acceptance Criteria

1. WHEN the User Interface displays the credential issuance form, THE TrustFi Platform SHALL show a dropdown menu for achievement tier selection
2. WHEN the User Interface displays the achievement tier dropdown, THE TrustFi Platform SHALL show all 5 tiers with their names and associated score values
3. THE TrustFi Platform SHALL NOT display a manual value input field for credential issuance
4. WHEN the User Interface displays the collectible creation form, THE TrustFi Platform SHALL use the achievement tier dropdown instead of a value input
5. WHEN the User Interface displays the issuer's collectibles table, THE TrustFi Platform SHALL show the achievement tier for each collectible

### Requirement 15: Integration Placeholders

**User Story:** As a user, I want to see future integration options, so that I can understand the platform's interoperability roadmap.

#### Acceptance Criteria

1. WHEN the User Interface displays the integrations settings page, THE TrustFi Platform SHALL show a Litentry section with "Link Litentry Account" button
2. WHEN the User Interface displays the integrations settings page, THE TrustFi Platform SHALL show a Kilt section explaining credential portability
3. WHEN the User Interface displays the integrations settings page, THE TrustFi Platform SHALL show descriptive text for each integration
4. THE TrustFi Platform SHALL clearly indicate which integrations are placeholders for future functionality
5. THE TrustFi Platform SHALL maintain consistent styling with the rest of the settings pages
