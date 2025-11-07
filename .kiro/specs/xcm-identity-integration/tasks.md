# Implementation Plan

## XCM Identity Integration Tasks

- [ ] 1. Set up Moonbeam development environment and dependencies
  - Install Polkadot.js API and Moonbeam-specific packages (@polkadot/api, @moonbeam-network/xcm-sdk, moonbeam-types-bundle)
  - Configure Hardhat for Moonbase Alpha testnet deployment with proper network settings and RPC endpoints
  - Set up environment variables for Moonbase Alpha RPC URL, private keys, and parachain endpoints
  - Create deployment scripts for Moonbase Alpha network
  - _Requirements: 1.1, 3.1_

- [ ] 2. Implement XCMIdentityBridge smart contract
  - [ ] 2.1 Create core contract structure and state variables
    - Define IdentityVerification and ParachainConfig structs
    - Implement storage mappings for identity records, parachain configs, and pending requests
    - Set up access control modifiers and contract initialization
    - _Requirements: 1.1, 3.1_
  
  - [ ] 2.2 Implement identity verification initiation
    - Write initiateIdentityVerification function to create verification requests
    - Implement XCM message construction using Moonbeam XCM Transactor precompile
    - Add request ID generation and tracking logic
    - Emit IdentityVerificationInitiated events
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.3 Implement XCM response processing
    - Write processIdentityResponse function to handle incoming attestations
    - Implement signature verification for attestation data
    - Add logic to update identity verification records
    - Integrate with ProfileNFT contract to update identity status
    - Emit IdentityLinked events
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ] 2.4 Implement identity revocation
    - Write revokeIdentityLink function for users to remove identity links
    - Add logic to send XCM revocation message to identity parachain
    - Update ProfileNFT contract to clear verification status
    - Emit IdentityRevoked events
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 2.5 Implement parachain whitelist management
    - Write addTrustedParachain function for admin to add identity parachains
    - Implement removeTrustedParachain function with safety checks
    - Add getParachainConfig view function
    - Emit ParachainWhitelisted and ParachainRemoved events
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 2.6 Add query and utility functions
    - Implement getIdentityVerification view function
    - Add helper functions for verification status checks
    - Implement failed request tracking and retry logic
    - Add emergency pause functionality
    - _Requirements: 2.1, 2.2, 5.1, 5.2_
  
  - [ ]* 2.7 Write unit tests for XCMIdentityBridge
    - Test identity verification initiation with valid and invalid inputs
    - Test XCM response processing with mock attestation data
    - Test parachain whitelist management functions
    - Test identity revocation flow
    - Test access control and authorization
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 7.1_

- [ ] 3. Extend ProfileNFT contract for identity integration
  - [ ] 3.1 Update Profile struct with identity fields
    - Add hasVerifiedIdentity, identityParachainId, verificationLevel, and identityVerifiedAt fields
    - Update contract storage layout
    - _Requirements: 1.4, 2.1, 4.1_
  
  - [ ] 3.2 Implement identity status management functions
    - Write updateIdentityStatus function (callable only by authorized XCMIdentityBridge)
    - Implement getIdentityStatus view function
    - Add authorization for XCMIdentityBridge contract
    - _Requirements: 1.4, 2.1, 2.2, 4.2_
  
  - [ ] 3.3 Implement enhanced reputation score calculation
    - Write calculateEnhancedReputationScore function with verification level multipliers
    - Update existing reputation score queries to include verification bonus
    - Add view functions to show base vs enhanced scores
    - _Requirements: 2.3, 4.5_
  
  - [ ] 3.4 Update profile creation and query functions
    - Modify createProfile to initialize identity fields
    - Update getProfile to return identity verification data
    - Update getProfileByOwner to include identity status
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ]* 3.5 Write unit tests for ProfileNFT extensions
    - Test identity status updates from authorized contract
    - Test enhanced reputation score calculations
    - Test profile queries with identity data
    - Test unauthorized access prevention
    - _Requirements: 1.4, 2.1, 2.3_

- [ ] 4. Extend ReputationCard contract for verification requirements
  - [ ] 4.1 Add verification level requirements to card issuance
    - Update Card struct to include requiredVerificationLevel field
    - Modify issueCard function to check profile verification status
    - Add setMinimumVerificationLevel function for issuers
    - _Requirements: 2.1, 2.5_
  
  - [ ] 4.2 Implement verification-gated card issuance
    - Write issueCardWithVerification function that enforces verification requirements
    - Add logic to query ProfileNFT for verification status before issuance
    - Emit events indicating verification-gated issuance
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 4.3 Update card query functions
    - Modify getCard to return verification requirement information
    - Update getCardsByProfile to show which cards required verification
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 4.4 Write unit tests for ReputationCard extensions
    - Test verification requirement enforcement
    - Test card issuance with insufficient verification level
    - Test card issuance with valid verification
    - _Requirements: 2.1, 2.5_

- [ ] 5. Create XCM message handling utilities
  - [ ] 5.1 Implement XCM message encoder
    - Write functions to encode identity verification requests in XCM format
    - Implement SCALE codec encoding for cross-chain messages
    - Add message versioning support
    - _Requirements: 1.1, 1.2_
  
  - [ ] 5.2 Implement XCM message decoder
    - Write functions to decode incoming attestation responses
    - Implement SCALE codec decoding
    - Add validation for message structure and format
    - _Requirements: 1.3_
  
  - [ ] 5.3 Create Moonbeam XCM precompile interface
    - Write Solidity interface for XCM Transactor precompile (0x0000000000000000000000000000000000000806)
    - Implement wrapper functions for transactThroughSigned
    - Add gas estimation utilities for XCM calls
    - _Requirements: 1.1, 1.2, 6.1, 6.4_
  
  - [ ]* 5.4 Write unit tests for XCM utilities
    - Test message encoding with various data types
    - Test message decoding with valid and malformed data
    - Test precompile interface calls
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Implement frontend XCM identity service
  - [ ] 6.1 Create XCMIdentityService class
    - Implement requestIdentityVerification method to interact with XCMIdentityBridge contract
    - Add getVerificationStatus method to query identity verification state
    - Implement revokeIdentity method for users to remove identity links
    - Add getSupportedParachains method to fetch whitelisted parachains
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 6.2 Implement wallet integration for Polkadot wallets
    - Add support for Talisman wallet connection
    - Add support for SubWallet connection
    - Implement wallet signature requests for identity verification
    - Handle wallet switching and account changes
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 6.3 Create contract interaction layer
    - Write ethers.js contract instances for XCMIdentityBridge
    - Implement transaction signing and submission
    - Add transaction status monitoring and confirmation
    - Implement error handling and retry logic
    - _Requirements: 1.1, 4.1, 6.3_
  
  - [ ] 6.4 Add event listeners for identity verification
    - Listen for IdentityVerificationInitiated events
    - Listen for IdentityLinked events
    - Listen for IdentityRevoked events
    - Update UI state based on events
    - _Requirements: 1.5, 4.5, 7.5_

- [ ] 7. Build identity verification UI components
  - [ ] 7.1 Create IdentityVerificationWidget component
    - Build UI to display current verification status
    - Add button to initiate identity verification
    - Show verification level badges (Basic, Enhanced, Full KYC)
    - Display source parachain information
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [ ] 7.2 Create ParachainSelector component
    - Build dropdown to select identity parachain (KILT, Litentry)
    - Display parachain information and capabilities
    - Show verification levels available per parachain
    - _Requirements: 4.3_
  
  - [ ] 7.3 Create VerificationStatusBadge component
    - Design visual badge for verified profiles
    - Show verification level with color coding
    - Display tooltip with verification details
    - Add animation for newly verified profiles
    - _Requirements: 2.4, 4.5_
  
  - [ ] 7.4 Create IdentityRevocationModal component
    - Build modal dialog for identity revocation confirmation
    - Show warning about reputation score impact
    - Add confirmation button with transaction submission
    - Display revocation success/failure messages
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [ ] 7.5 Update ProfileView component
    - Integrate IdentityVerificationWidget into profile display
    - Show enhanced reputation score for verified profiles
    - Display verification timestamp and parachain
    - Add visual distinction for verified vs unverified profiles
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 8. Implement enhanced reputation score display
  - [ ] 8.1 Update reputation score calculation in frontend
    - Fetch base reputation score from ProfileNFT
    - Calculate enhanced score based on verification level
    - Display both base and enhanced scores
    - Show percentage boost from verification
    - _Requirements: 2.3, 4.5_
  
  - [ ] 8.2 Create ReputationScoreBreakdown component
    - Build visual breakdown of reputation score components
    - Show base score from reputation cards
    - Show verification bonus separately
    - Add tooltip explaining score calculation
    - _Requirements: 2.3, 4.5_
  
  - [ ] 8.3 Update leaderboard and ranking displays
    - Modify ranking logic to use enhanced scores
    - Add filter to show verified profiles only
    - Display verification badges in leaderboard
    - _Requirements: 2.3, 4.5_

- [ ] 9. Create deployment and configuration scripts
  - [ ] 9.1 Write Moonbase Alpha deployment script
    - Create deployment script for XCMIdentityBridge contract
    - Deploy updated ProfileNFT and ReputationCard contracts
    - Configure contract addresses and authorizations
    - Verify contracts on Moonscan
    - _Requirements: 3.1, 3.2_
  
  - [ ] 9.2 Create parachain configuration script
    - Write script to add KILT testnet to whitelist
    - Add Litentry testnet to whitelist
    - Configure XCM endpoints and parameters
    - Test XCM connectivity
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ] 9.3 Create demo account setup script
    - Generate demo accounts with test tokens
    - Create profiles for demo accounts
    - Pre-verify some profiles for demonstration
    - Issue sample reputation cards
    - _Requirements: 1.1, 2.1_
  
  - [ ] 9.4 Update frontend configuration
    - Add Moonbase Alpha network configuration
    - Update contract addresses in frontend config
    - Configure parachain endpoints
    - Add environment variables for testnet
    - _Requirements: 6.1, 6.4_

- [ ] 10. Integration testing and demo preparation
  - [ ] 10.1 Test complete identity verification flow on testnet
    - Deploy all contracts to Moonbase Alpha
    - Initiate identity verification from frontend
    - Verify XCM message is sent to KILT testnet
    - Confirm attestation response is received
    - Validate ProfileNFT is updated with verification status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 10.2 Test verification-gated card issuance
    - Attempt to issue high-value card to unverified profile (should fail)
    - Verify profile through XCM flow
    - Issue high-value card to verified profile (should succeed)
    - Verify enhanced reputation score is calculated correctly
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 10.3 Test identity revocation flow
    - Revoke identity link from verified profile
    - Verify XCM revocation message is sent
    - Confirm ProfileNFT verification status is cleared
    - Validate reputation score returns to base value
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 10.4 Prepare hackathon demo environment
    - Set up demo accounts with various verification levels
    - Create demo script with step-by-step flow
    - Prepare block explorer links for XCM messages
    - Test demo flow multiple times
    - _Requirements: All requirements_

- [ ] 11. Create hackathon documentation and presentation materials
  - [ ] 11.1 Write comprehensive README
    - Document XCM identity integration feature
    - Add setup instructions for Moonbase Alpha
    - Include demo walkthrough with screenshots
    - Add troubleshooting section
    - _Requirements: All requirements_
  
  - [ ] 11.2 Create architecture documentation
    - Write detailed architecture overview
    - Document XCM message flow with diagrams
    - Explain smart contract interactions
    - Add sequence diagrams for key flows
    - _Requirements: All requirements_
  
  - [ ] 11.3 Record demo video
    - Record 3-5 minute demo video showing complete flow
    - Show identity verification initiation
    - Display XCM message on block explorer
    - Show verified badge and enhanced score
    - Demonstrate verification-gated card issuance
    - _Requirements: All requirements_
  
  - [ ] 11.4 Create presentation slides
    - Build technical presentation deck
    - Explain problem and solution
    - Show architecture diagrams
    - Include live demo section
    - Add future roadmap
    - _Requirements: All requirements_
