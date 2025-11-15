# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive audit and improvement of the TrustFi reputation platform. The system is a decentralized reputation platform built on Ethereum that allows users to create soulbound profiles and earn verifiable reputation cards from authorized issuers. The audit will verify that all functionality works correctly, data is properly saved and fetched from the database, smart contracts are functioning as intended, and the UI/UX is user-friendly and intuitive.

## Glossary

- **System**: The TrustFi reputation platform consisting of smart contracts, frontend application, and database
- **Profile NFT**: A soulbound (non-transferable) NFT representing a user's identity on the platform
- **Reputation Card**: A soulbound credential NFT issued by authorized issuers to profiles
- **Template**: A blueprint defining the properties of reputation cards (tier, supply, time windows)
- **Issuer**: An address with TEMPLATE_MANAGER_ROLE authorized to create templates and issue cards
- **Admin**: An address with DEFAULT_ADMIN_ROLE authorized to manage issuers and system settings
- **Supabase**: The PostgreSQL database service used for caching and metadata storage
- **Smart Contract**: The on-chain Solidity contracts (ProfileNFT and ReputationCard)
- **Frontend**: The React/TypeScript web application
- **Claim**: The action of a user receiving a reputation card, either directly or via signature

## Requirements

### Requirement 1: Smart Contract Functionality Verification

**User Story:** As a developer, I want to verify that all smart contract functions work correctly, so that the on-chain logic is reliable and secure.

#### Acceptance Criteria

1. WHEN the ProfileNFT contract is deployed, THE System SHALL verify that profile creation, score calculation, and card attachment functions execute without errors
2. WHEN the ReputationCard contract is deployed, THE System SHALL verify that template creation, direct issuance, and signature-based claiming functions execute correctly
3. WHEN a user creates a profile, THE System SHALL verify that the profile is soulbound and cannot be transferred
4. WHEN a reputation card is issued, THE System SHALL verify that the card is soulbound and attached to the correct profile
5. WHEN access control functions are called, THE System SHALL verify that only authorized addresses can execute privileged operations

### Requirement 2: Database Operations Verification

**User Story:** As a developer, I want to verify that all database operations save and fetch data correctly, so that the application state is consistent and reliable.

#### Acceptance Criteria

1. WHEN a profile is created on-chain, THE System SHALL save the profile metadata to the profiles table in Supabase
2. WHEN a reputation card is claimed, THE System SHALL log the claim event to the claims_log table with correct profile_id, template_id, and card_id
3. WHEN templates are created, THE System SHALL cache template data in the templates_cache table for faster queries
4. WHEN issuers are granted or revoked roles, THE System SHALL update the issuers table with correct status and timestamps
5. WHEN profile data is fetched, THE System SHALL retrieve complete profile information including wallet, display_name, bio, avatar_url, and social links

### Requirement 3: Data Synchronization Verification

**User Story:** As a user, I want my on-chain and off-chain data to stay synchronized, so that I see accurate and up-to-date information.

#### Acceptance Criteria

1. WHEN a card is claimed on-chain, THE System SHALL update the claims_log table within 5 seconds
2. WHEN a profile score is recalculated, THE System SHALL fetch the updated score from the contract and display it immediately
3. WHEN a template is paused or unpaused, THE System SHALL reflect the change in the UI without requiring a page refresh
4. WHEN profile metadata is updated in Supabase, THE System SHALL invalidate cached data and refetch from the database
5. WHEN multiple cards are attached to a profile, THE System SHALL display all cards without missing or duplicate entries

### Requirement 4: Frontend Hook Functionality Verification

**User Story:** As a developer, I want to verify that all React hooks fetch and manage data correctly, so that the UI displays accurate information.

#### Acceptance Criteria

1. WHEN useProfile hook is called, THE System SHALL fetch profileId, score, cards, and metadata from both contract and database
2. WHEN useTemplates hook is called, THE System SHALL fetch all active templates with correct eligibility status for the user
3. WHEN useReputationCards hook is called, THE System SHALL provide working issueDirect and claimWithSignature functions
4. WHEN useAuth hook is called, THE System SHALL correctly identify wallet connection status, profile existence, and user roles
5. WHEN useCollectibles hook is called, THE System SHALL fetch collectibles from Supabase enriched with on-chain template data

### Requirement 5: User Interface Usability Verification

**User Story:** As a user, I want the interface to be intuitive and easy to use, so that I can accomplish tasks without confusion.

#### Acceptance Criteria

1. WHEN a user visits the homepage, THE System SHALL display clear calls-to-action based on wallet connection and profile status
2. WHEN a user navigates the application, THE System SHALL provide consistent navigation with role-based menu items
3. WHEN a user performs an action, THE System SHALL display loading states during processing and clear feedback on completion
4. WHEN an error occurs, THE System SHALL display user-friendly error messages with actionable guidance
5. WHEN a user views their dashboard, THE System SHALL present information in a visually organized layout with clear hierarchy

### Requirement 6: Form Validation and Error Handling

**User Story:** As a user, I want forms to validate my input and provide helpful error messages, so that I can correct mistakes easily.

#### Acceptance Criteria

1. WHEN a user submits a form with invalid data, THE System SHALL display field-specific error messages before submission
2. WHEN a transaction fails, THE System SHALL parse the contract error and display a user-friendly explanation
3. WHEN a user enters an invalid Ethereum address, THE System SHALL validate the format and show an error immediately
4. WHEN a user uploads an image, THE System SHALL validate file type and size before attempting upload
5. WHEN a network error occurs, THE System SHALL provide a retry option and explain the issue

### Requirement 7: Profile Creation and Management

**User Story:** As a user, I want to create and customize my profile easily, so that I can represent my identity on the platform.

#### Acceptance Criteria

1. WHEN a user creates a profile, THE System SHALL mint a ProfileNFT and save metadata to Supabase in a single flow
2. WHEN a user edits their profile, THE System SHALL update display_name, bio, avatar_url, banner_url, and social links
3. WHEN a user uploads an avatar, THE System SHALL resize the image, upload to IPFS, and save the URL
4. WHEN a user views their profile, THE System SHALL display their reputation score, card count, and recent activity
5. WHEN a user recalculates their score, THE System SHALL call the contract function and update the displayed score

### Requirement 8: Card Discovery and Claiming

**User Story:** As a user, I want to discover available reputation cards and claim them easily, so that I can build my reputation.

#### Acceptance Criteria

1. WHEN a user visits the discover page, THE System SHALL display all active and claimable templates
2. WHEN a user views a template, THE System SHALL show tier, issuer, supply information, and eligibility status
3. WHEN a user claims a card via signature, THE System SHALL verify the signature and mint the card to their profile
4. WHEN a user has already claimed a template, THE System SHALL display "Already Claimed" status and disable the claim button
5. WHEN a card is successfully claimed, THE System SHALL show a success notification with confetti animation

### Requirement 9: Admin Portal Functionality

**User Story:** As an admin, I want to manage the platform effectively, so that I can oversee issuers, templates, and system health.

#### Acceptance Criteria

1. WHEN an admin accesses the admin portal, THE System SHALL verify DEFAULT_ADMIN_ROLE before displaying admin features
2. WHEN an admin views the dashboard, THE System SHALL display platform statistics including total profiles, templates, and cards
3. WHEN an admin grants TEMPLATE_MANAGER_ROLE, THE System SHALL execute the transaction and update the issuers table
4. WHEN an admin revokes an issuer role, THE System SHALL remove the role on-chain and mark the issuer as inactive
5. WHEN an admin views templates, THE System SHALL display all templates with pause status and supply information

### Requirement 10: Issuer Portal Functionality

**User Story:** As an issuer, I want to create templates and issue cards efficiently, so that I can distribute credentials to users.

#### Acceptance Criteria

1. WHEN an issuer accesses the issuer portal, THE System SHALL verify TEMPLATE_MANAGER_ROLE before displaying issuer features
2. WHEN an issuer creates a template, THE System SHALL validate inputs, create the template on-chain, and cache in Supabase
3. WHEN an issuer issues a card directly, THE System SHALL verify recipient has a profile and mint the card
4. WHEN an issuer generates a claim link, THE System SHALL create an EIP712 signature and generate a shareable URL
5. WHEN an issuer views their templates, THE System SHALL display only templates where they are the issuer

### Requirement 11: Mobile Responsiveness

**User Story:** As a mobile user, I want the application to work well on my device, so that I can use it anywhere.

#### Acceptance Criteria

1. WHEN a user accesses the site on mobile, THE System SHALL display a responsive layout that adapts to screen size
2. WHEN a user navigates on mobile, THE System SHALL provide a mobile-friendly navigation menu
3. WHEN a user views cards on mobile, THE System SHALL display them in a single-column grid
4. WHEN a user performs actions on mobile, THE System SHALL ensure buttons and forms are touch-friendly
5. WHEN a user uploads images on mobile, THE System SHALL support mobile camera and gallery selection

### Requirement 12: Performance Optimization

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that I have a pleasant experience.

#### Acceptance Criteria

1. WHEN a user loads a page, THE System SHALL display content within 2 seconds on a standard connection
2. WHEN data is fetched, THE System SHALL use React Query caching to avoid redundant network requests
3. WHEN images are displayed, THE System SHALL lazy load images below the fold
4. WHEN the application is built, THE System SHALL implement code splitting for admin and issuer portals
5. WHEN contract calls are made, THE System SHALL batch multiple reads into multicall when possible

### Requirement 13: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the application to be usable with assistive technologies, so that I can access all features.

#### Acceptance Criteria

1. WHEN a user navigates with keyboard, THE System SHALL provide visible focus indicators on all interactive elements
2. WHEN a screen reader is used, THE System SHALL provide descriptive labels for all form inputs and buttons
3. WHEN images are displayed, THE System SHALL include alt text describing the content
4. WHEN color is used to convey information, THE System SHALL also provide text or icon indicators
5. WHEN modals or dialogs appear, THE System SHALL trap focus and provide a clear way to close

### Requirement 14: Transaction Feedback and Confirmation

**User Story:** As a user, I want clear feedback during transactions, so that I know what's happening and when it's complete.

#### Acceptance Criteria

1. WHEN a user initiates a transaction, THE System SHALL display a loading state with descriptive text
2. WHEN a transaction is submitted, THE System SHALL show the transaction hash and a link to the block explorer
3. WHEN a transaction is confirming, THE System SHALL display a progress indicator
4. WHEN a transaction succeeds, THE System SHALL show a success notification with relevant details
5. WHEN a transaction fails, THE System SHALL display the error reason and suggest next steps

### Requirement 15: Data Integrity and Validation

**User Story:** As a developer, I want to ensure data integrity across the system, so that inconsistencies don't occur.

#### Acceptance Criteria

1. WHEN a profile is created, THE System SHALL ensure the wallet address is stored in lowercase for consistency
2. WHEN a card is claimed, THE System SHALL verify the profile_id exists before logging to claims_log
3. WHEN template data is cached, THE System SHALL validate that all required fields are present
4. WHEN user input is processed, THE System SHALL sanitize and validate data before database insertion
5. WHEN foreign key relationships exist, THE System SHALL enforce referential integrity constraints

### Requirement 16: Security Best Practices

**User Story:** As a user, I want my data and transactions to be secure, so that I can trust the platform.

#### Acceptance Criteria

1. WHEN a user connects their wallet, THE System SHALL never request or store private keys
2. WHEN signatures are generated, THE System SHALL use EIP712 typed data for clarity and security
3. WHEN API calls are made to Supabase, THE System SHALL use Row Level Security policies
4. WHEN environment variables are used, THE System SHALL never expose sensitive keys in client-side code
5. WHEN contract interactions occur, THE System SHALL validate all inputs before submission
