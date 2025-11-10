# Implementation Plan

- [ ] 1. Extend ReputationCard smart contract with collectible minting structures



  - Add CollectibleTemplate struct with all required fields (templateId, category, description, value, maxSupply, currentSupply, startTime, endTime, eligibilityType, eligibilityData, isPaused, isActive, metadataURI, rarityTier)
  - Add EligibilityType enum (OPEN, WHITELIST, TOKEN_HOLDER, PROFILE_REQUIRED)
  - Add MintingMode enum (DIRECT, COLLECTIBLE)
  - Add RarityTier constants (COMMON=0, UNCOMMON=1, RARE=2, EPIC=3, LEGENDARY=4)
  - Create mappings for collectible templates, claims tracking, whitelist management, and minting modes
  - Add _nextTemplateId counter variable
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement collectible creation and management functions
  - [ ] 2.1 Write createCollectible function
    - Accept all collectible parameters (category, description, value, maxSupply, startTime, endTime, eligibilityType, eligibilityData, metadataURI, rarityTier)
    - Validate issuer authorization
    - Validate input data (string lengths, numeric ranges, time validity)
    - Create and store CollectibleTemplate
    - Emit CollectibleCreated event
    - Return templateId
    - _Requirements: 1.1, 3.1, 3.2, 6.1, 7.1, 8.1, 17.1_

  - [ ] 2.2 Write pauseCollectible and resumeCollectible functions
    - Verify caller is issuer or owner
    - Update isPaused flag in template
    - Emit CollectiblePaused/CollectibleResumed events
    - _Requirements: 11.1, 11.2, 11.4_

  - [ ] 2.3 Write updateCollectibleMetadata function
    - Check that no claims have been made yet
    - Verify caller is issuer
    - Update category, description, and metadataURI
    - Emit CollectibleMetadataUpdated event
    - _Requirements: 15.1, 15.2, 15.3, 15.4_


- [ ] 3. Implement eligibility verification system
  - [ ] 3.1 Write isEligibleToClaim function
    - Check collectible is active and not paused
    - Verify time window (startTime <= now <= endTime)
    - Check supply availability
    - Verify user hasn't already claimed
    - Implement OPEN eligibility check (always true or profile required)
    - Implement WHITELIST eligibility check (verify address in whitelist mapping)
    - Implement TOKEN_HOLDER eligibility check (decode eligibilityData, call token contract balanceOf)
    - Implement PROFILE_REQUIRED eligibility check (verify profile exists, check min reputation if specified)
    - Return boolean result
    - _Requirements: 3.1, 3.2, 5.2, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 3.2 Write whitelist management functions
    - Implement addToWhitelist function accepting templateId and address array
    - Implement removeFromWhitelist function accepting templateId and address array
    - Verify caller is issuer or owner
    - Update _collectibleWhitelist mapping
    - Emit WhitelistUpdated event
    - _Requirements: 8.2_

  - [ ] 3.3 Write hasClaimedCollectible view function
    - Check _collectibleClaims mapping for user and templateId
    - Return boolean result
    - _Requirements: 4.5, 5.2_

- [ ] 4. Implement collectible claiming functionality
  - [ ] 4.1 Write claimCollectible function
    - Verify collectible exists and is active
    - Check eligibility using isEligibleToClaim
    - Verify supply limit not reached
    - Increment currentSupply atomically
    - Mark user as claimed in _collectibleClaims mapping
    - Generate new cardId
    - Create Card struct with collectible data and msg.sender as recipient
    - Set minting mode to COLLECTIBLE
    - Mint NFT to msg.sender
    - Get user's profileId if exists
    - Add card to profile's card list if profile exists
    - Update profile reputation score if profile exists
    - Emit CollectibleClaimed event
    - Return cardId
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 4.2 Add ReentrancyGuard to claimCollectible
    - Import OpenZeppelin ReentrancyGuard
    - Add nonReentrant modifier to claimCollectible function
    - _Requirements: 5.2, 5.3_

- [ ] 5. Implement query and analytics functions
  - [ ] 5.1 Write getCollectibleTemplate view function
    - Accept templateId parameter
    - Return CollectibleTemplate struct
    - Revert if template doesn't exist
    - _Requirements: 4.3, 13.2_

  - [ ] 5.2 Write getActiveCollectibles view function
    - Iterate through all templates
    - Filter by isActive=true and isPaused=false
    - Check time window is valid
    - Return array of templateIds
    - _Requirements: 4.1_

  - [ ] 5.3 Write getClaimStats view function
    - Accept templateId parameter
    - Return totalClaims (currentSupply), remainingSupply (maxSupply - currentSupply), isActive
    - Handle unlimited supply case (maxSupply=0)
    - _Requirements: 4.4, 6.4, 9.1, 9.4_

  - [ ] 5.4 Write getCollectiblesByIssuer view function
    - Accept issuer address parameter
    - Return array of templateIds created by that issuer
    - _Requirements: 9.2_

- [ ] 6. Implement token revocation for collectibles
  - Write revokeCollectibleToken function
  - Verify caller is issuer or owner
  - Check card exists and was minted via collectible
  - Mark card as invalid
  - Update profile reputation score
  - Emit CardRevoked event
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 7. Update existing issueCard function to track minting mode
  - Add minting mode tracking when issuing direct cards
  - Set _cardMintingMode[cardId] = MintingMode.DIRECT
  - Ensure backward compatibility with existing functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 8. Add view function to get card minting mode
  - Write getCardMintingMode function accepting cardId
  - Return MintingMode enum value
  - _Requirements: 10.1, 10.2, 10.3, 10.4_


- [ ] 9. Create TypeScript types for collectibles
  - Create types/collectible.ts file
  - Define EligibilityType enum matching Solidity
  - Define RarityTier enum matching Solidity
  - Define CollectibleTemplate interface matching contract struct
  - Define CollectibleFormData interface for form inputs
  - Define ClaimStatus interface for eligibility checking
  - Define CollectibleMetadata interface for IPFS metadata
  - Define CollectibleAnalytics interface for statistics
  - Export all types
  - _Requirements: 1.1, 3.1, 4.1, 9.1_

- [ ] 10. Extend contract service with collectible functions
  - [ ] 10.1 Add collectible creation functions
    - Write createCollectible function accepting CollectibleFormData and signer
    - Build transaction with all parameters
    - Handle eligibilityData encoding based on type
    - Send transaction and wait for confirmation
    - Parse CollectibleCreated event to get templateId
    - Return templateId and txHash
    - _Requirements: 1.1, 3.1_

  - [ ] 10.2 Add collectible claiming functions
    - Write claimCollectible function accepting templateId and signer
    - Estimate gas before claiming
    - Send transaction and wait for confirmation
    - Parse CollectibleClaimed event to get cardId
    - Return cardId and txHash
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 10.3 Add eligibility checking functions
    - Write checkEligibility function accepting templateId and userAddress
    - Call isEligibleToClaim on contract
    - Call hasClaimedCollectible on contract
    - Get collectible template details
    - Build ClaimStatus object with all relevant info
    - Return ClaimStatus
    - _Requirements: 4.2, 4.3, 5.2_

  - [ ] 10.4 Add collectible query functions
    - Write getActiveCollectibles function to fetch all active collectibles
    - Write getCollectibleTemplate function to fetch single template
    - Write getClaimStats function to fetch claim statistics
    - Write getCollectiblesByIssuer function to fetch issuer's collectibles
    - _Requirements: 4.1, 4.3, 9.1, 9.2_

  - [ ] 10.5 Add collectible management functions
    - Write pauseCollectible function accepting templateId and signer
    - Write resumeCollectible function accepting templateId and signer
    - Write updateCollectibleMetadata function accepting templateId, metadata, and signer
    - Write addToWhitelist function accepting templateId, addresses array, and signer
    - Write removeFromWhitelist function accepting templateId, addresses array, and signer
    - _Requirements: 11.1, 11.4, 15.1_

  - [ ] 10.6 Add gas estimation function
    - Write estimateClaimGas function accepting templateId and userAddress
    - Estimate gas for claimCollectible transaction
    - Get current gas price
    - Calculate total cost in ETH
    - Fetch ETH/USD price from oracle or API
    - Calculate cost in USD
    - Return gas limit, ETH cost, and USD cost
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 11. Create custom hooks for collectibles
  - [ ] 11.1 Create useCollectibles hook
    - Fetch active collectibles on mount
    - Implement filtering by category
    - Implement filtering by eligibility status
    - Implement sorting by popularity, expiration, supply
    - Return collectibles array, loading state, error, and filter/sort functions
    - _Requirements: 4.1, 4.2, 20.1, 20.5_

  - [ ] 11.2 Create useClaimStatus hook
    - Accept array of templateIds and userAddress
    - Check eligibility for each template
    - Store results in Map<templateId, ClaimStatus>
    - Provide refresh function for individual templates
    - Return claimStatus map, loading state, and refresh function
    - _Requirements: 4.2, 4.5_

  - [ ] 11.3 Create useCollectibleClaim hook
    - Implement claim function accepting templateId
    - Estimate gas before claiming
    - Handle transaction submission
    - Track claiming state (idle, estimating, claiming, success, error)
    - Store transaction hash on success
    - Return claim function, claiming state, error, txHash, gasEstimate, and estimateGas function
    - _Requirements: 5.1, 5.3, 14.1, 14.4_

  - [ ] 11.4 Create useIssuerCollectibles hook
    - Fetch collectibles created by current issuer
    - Implement createCollectible function accepting CollectibleFormData
    - Implement pauseCollectible function
    - Implement resumeCollectible function
    - Implement updateMetadata function
    - Implement getAnalytics function to fetch claim stats
    - Return collectibles array, management functions, loading state, and error
    - _Requirements: 1.1, 9.1, 9.2, 9.3, 11.1, 11.4, 15.1_


- [ ] 12. Create issuer dashboard components for collectibles
  - [ ] 12.1 Create MintingModeSelector component
    - Build radio button group for Direct vs Collectible modes
    - Add descriptive text explaining each mode
    - Add visual icons/illustrations for each mode
    - Handle selection change callback
    - Style with Tailwind CSS
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 12.2 Create CollectibleCreationForm component
    - Build form with fields for category, description, value
    - Add supply limit input (0 for unlimited)
    - Add start/end date pickers for time-based availability
    - Add eligibility type selector (OPEN, WHITELIST, TOKEN_HOLDER, PROFILE_REQUIRED)
    - Add conditional eligibility configuration inputs based on type
    - Add rarity tier selector with visual preview
    - Add image upload with preview
    - Add metadata URI input
    - Implement form validation
    - Handle form submission calling createCollectible
    - Show loading state during submission
    - Display success/error messages
    - _Requirements: 1.1, 3.1, 6.1, 7.1, 8.1, 17.1_

  - [ ] 12.3 Create CollectiblePreview component
    - Display collectible as it will appear to users
    - Show card image, title, description
    - Display rarity tier with styling
    - Show supply limit and time restrictions
    - Display eligibility requirements
    - Add "Publish" button to finalize creation
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 12.4 Create CollectibleManagementPanel component
    - Display list of issuer's collectibles in table/grid format
    - Show key stats for each (claims, supply, status)
    - Add pause/resume toggle buttons
    - Add edit metadata button (disabled if claims exist)
    - Add view analytics button
    - Add whitelist management button for whitelist-type collectibles
    - Implement filtering and sorting
    - _Requirements: 9.1, 9.2, 11.1, 11.4, 11.5, 15.1, 15.4_

  - [ ] 12.5 Create CollectibleAnalytics component
    - Display total claims count
    - Show claim timeline chart
    - List recent claimers with addresses and timestamps
    - Display supply percentage with progress bar
    - Show claim velocity (claims per hour/day)
    - Add export functionality for claim data
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 12.6 Create WhitelistManager component
    - Display current whitelist addresses
    - Add bulk address input (textarea with one address per line)
    - Add individual address input
    - Implement add/remove functionality
    - Show confirmation before bulk operations
    - Display success/error feedback
    - _Requirements: 8.2_

- [ ] 13. Create user-facing collectibles components
  - [ ] 13.1 Create CollectiblesGalleryPage component
    - Fetch active collectibles using useCollectibles hook
    - Display collectibles in responsive grid layout
    - Add filter sidebar for category, rarity, eligibility
    - Add sort dropdown (popularity, expiration, supply)
    - Show loading skeletons while fetching
    - Display empty state if no collectibles available
    - Implement infinite scroll or pagination
    - _Requirements: 4.1, 4.2, 20.1, 20.5_

  - [ ] 13.2 Create CollectibleCard component
    - Display collectible image with rarity-based border/background
    - Show title and short description
    - Display rarity tier badge
    - Show supply indicator (X/Y claimed or "Unlimited")
    - Display time remaining if applicable
    - Show eligibility status badge (Eligible/Not Eligible/Claimed)
    - Add "Claim" button if eligible and not claimed
    - Disable button if not eligible or already claimed
    - Add hover effects and animations
    - Handle click to open detail modal
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3_

  - [ ] 13.3 Create CollectibleDetailModal component
    - Display full collectible information
    - Show large image
    - Display complete description
    - Show issuer information with verification
    - Display eligibility requirements with user's status for each
    - Show supply and time information
    - Display claim statistics
    - Add "Claim" button with gas estimate
    - Show blockchain verification details
    - Add share button
    - _Requirements: 4.3, 5.1, 14.1, 16.1_

  - [ ] 13.4 Create ClaimConfirmationModal component
    - Display transaction summary
    - Show collectible preview
    - Display gas cost estimate in ETH and USD
    - Show warning if gas is high
    - Add confirm and cancel buttons
    - Show transaction progress after confirmation
    - Display success message with celebration animation
    - Show transaction hash with explorer link
    - Add "View Card" button to navigate to collection
    - _Requirements: 5.1, 5.3, 14.1, 14.2, 14.3, 14.4, 14.5_


- [ ] 14. Create shared UI components
  - [ ] 14.1 Create MintingModeBadge component
    - Accept minting mode prop (DIRECT or COLLECTIBLE)
    - Display "Awarded" badge for direct minting
    - Display "Claimed" badge for collectible minting
    - Style with distinct colors and icons
    - Add tooltip explaining the difference
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 14.2 Create RarityIndicator component
    - Accept rarity tier prop (0-4)
    - Display rarity name (Common, Uncommon, Rare, Epic, Legendary)
    - Apply color-coded styling based on tier
    - Add gradient borders for higher rarities
    - Include rarity icon or badge
    - _Requirements: 17.1, 17.3, 17.4_

  - [ ] 14.3 Create SupplyIndicator component
    - Accept currentSupply and maxSupply props
    - Display progress bar showing claimed/total
    - Show percentage text
    - Display "Limited Edition" badge for low supply
    - Handle unlimited supply case (maxSupply=0)
    - Add color coding (green=plenty, yellow=low, red=almost gone)
    - _Requirements: 4.4, 6.4_

  - [ ] 14.4 Create EligibilityChecker component
    - Accept eligibility requirements and user status
    - Display list of requirements with checkmarks/X marks
    - Show user's current status for each requirement
    - Provide helpful messages for unmet requirements
    - Add links to actions (e.g., "Create Profile" if profile required)
    - _Requirements: 4.3, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 14.5 Create TimeRemainingBadge component
    - Accept start and end timestamps
    - Display "Starts in X" if not yet started
    - Display "Ends in X" if active
    - Display "Ended" if expired
    - Use human-readable format (e.g., "2 days 5 hours")
    - Update countdown in real-time
    - Add urgency styling for expiring soon
    - _Requirements: 7.4, 7.5_

  - [ ] 14.6 Create CelebrationAnimation component
    - Create confetti or particle animation
    - Trigger on successful claim
    - Add special effects for rare/epic/legendary claims
    - Include sound effect option (muted by default)
    - Auto-dismiss after animation completes
    - _Requirements: 17.4_

- [ ] 15. Enhance existing components to support collectibles
  - [ ] 15.1 Update ReputationCardsList component
    - Add minting mode badge to each card
    - Fetch minting mode from contract for each card
    - Add filter option for minting mode
    - Update card display to show collectible-specific info
    - _Requirements: 10.1, 10.5_

  - [ ] 15.2 Update CardDetailModal component
    - Display minting mode badge
    - Show collectible template info if applicable
    - Display claim date for collectibles
    - Show issuer info for both types
    - Add share functionality for collectibles
    - _Requirements: 10.4, 16.1, 16.2, 16.3_

  - [ ] 15.3 Update IssuerPage component
    - Add tab or section for collectible management
    - Integrate CollectibleCreationForm
    - Integrate CollectibleManagementPanel
    - Add navigation to collectible analytics
    - _Requirements: 1.1, 9.1_

  - [ ] 15.4 Update DashboardPage component
    - Add section for new collectible notifications
    - Display eligible collectibles count badge
    - Add quick link to collectibles gallery
    - Show recently claimed collectibles
    - _Requirements: 12.2, 12.3_

- [ ] 16. Implement notification system for collectibles
  - [ ] 16.1 Create notification service
    - Check for new collectibles user is eligible for
    - Store notification state in localStorage
    - Provide functions to mark notifications as read
    - Implement notification polling or event listening
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 16.2 Create NotificationBadge component
    - Display count of unread collectible notifications
    - Position on navigation or dashboard
    - Update count in real-time
    - Handle click to show notification list
    - _Requirements: 12.2_

  - [ ] 16.3 Create CollectibleNotification component
    - Display notification for new eligible collectible
    - Show collectible preview
    - Display eligibility reason
    - Show time remaining if applicable
    - Add "View" and "Dismiss" buttons
    - _Requirements: 12.3, 12.4_

- [ ] 17. Implement social sharing for collectibles
  - [ ] 17.1 Create ShareModal component
    - Display sharing options (Copy Link, QR Code, Social Media)
    - Generate shareable verification URL
    - Implement copy to clipboard functionality
    - Generate QR code using library
    - Add social media share buttons (Twitter, Facebook, LinkedIn)
    - Show success feedback on copy
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ] 17.2 Create public verification page
    - Create new route for /verify/:chainId/:contractAddress/:cardId
    - Fetch card details from blockchain (no wallet required)
    - Display card information in read-only view
    - Show blockchain verification status
    - Display issuer information
    - Add "Get Your Own" CTA linking to platform
    - Include Open Graph meta tags for social previews
    - _Requirements: 16.4, 16.5_

  - [ ] 17.3 Generate Open Graph metadata
    - Create utility to generate OG tags for collectibles
    - Include og:title, og:description, og:image
    - Add Twitter card metadata
    - Implement server-side rendering or meta tag injection
    - _Requirements: 16.5_


- [ ] 18. Implement trending and discovery features
  - [ ] 18.1 Create trending calculation service
    - Calculate claim velocity (claims per hour) for each collectible
    - Identify collectibles with high recent activity
    - Factor in scarcity (low remaining supply)
    - Factor in urgency (expiring soon)
    - Store trending scores in cache
    - Update trending data periodically
    - _Requirements: 20.1, 20.2_

  - [ ] 18.2 Create TrendingSection component
    - Display top trending collectibles
    - Show trending indicators (fire icon, "Hot" badge)
    - Display claim velocity stats
    - Show time remaining for expiring collectibles
    - Highlight nearly sold-out collectibles
    - Add "View All" link to full gallery
    - _Requirements: 20.1, 20.3, 20.4_

  - [ ] 18.3 Add sorting options to gallery
    - Implement sort by popularity (total claims)
    - Implement sort by scarcity (remaining supply percentage)
    - Implement sort by expiration (ending soonest first)
    - Implement sort by newest (recently created)
    - Update URL params to persist sort selection
    - _Requirements: 20.5_

- [ ] 19. Implement claim history tracking
  - [ ] 19.1 Create claim history service
    - Listen for CollectibleClaimed events
    - Store claim history in IndexedDB
    - Provide query functions for user's claim history
    - Implement pagination for large histories
    - _Requirements: 18.1, 18.2_

  - [ ] 19.2 Create ClaimHistory component
    - Display chronological list of user's claims
    - Show collectible preview for each claim
    - Display claim date and time
    - Include transaction hash with explorer link
    - Add filter by category or rarity
    - Implement sorting options
    - _Requirements: 18.1, 18.2, 18.3_

  - [ ] 19.3 Add claim history to profile page
    - Create new section in ProfilePage for claim history
    - Integrate ClaimHistory component
    - Add statistics (total claims, by category, by rarity)
    - Show claim timeline visualization
    - _Requirements: 18.1, 18.4, 18.5_

- [ ] 20. Add error handling and user feedback
  - [ ] 20.1 Create error message utilities
    - Map contract error codes to user-friendly messages
    - Provide specific messages for eligibility errors
    - Include helpful suggestions for resolution
    - Handle timing errors (not started, expired)
    - Handle supply errors (sold out)
    - _Requirements: 14.5_

  - [ ] 20.2 Implement toast notifications
    - Show toast on successful claim
    - Display error toasts with specific messages
    - Show warning toasts for high gas
    - Include transaction hash in success toasts
    - Add retry option in error toasts
    - _Requirements: 5.4, 14.3_

  - [ ] 20.3 Add loading states
    - Show skeleton loaders in gallery while fetching
    - Display spinner during claim transaction
    - Show progress indicator during gas estimation
    - Add loading overlay for form submissions
    - _Requirements: 4.1, 5.1_

- [ ] 21. Implement caching and performance optimization
  - [ ] 21.1 Set up IndexedDB for collectibles
    - Create database schema for collectible cache
    - Implement cache storage for collectible templates
    - Cache claim status results
    - Cache trending data
    - Set appropriate TTL for cached data
    - _Requirements: 4.1_

  - [ ] 21.2 Implement batch contract calls
    - Use multicall pattern for fetching multiple collectibles
    - Batch eligibility checks for multiple templates
    - Optimize gas estimation calls
    - Reduce RPC calls with efficient querying
    - _Requirements: 4.1, 4.2_

  - [ ] 21.3 Add virtual scrolling for large lists
    - Implement virtual scrolling in collectibles gallery
    - Optimize rendering for 1000+ collectibles
    - Lazy load images as they enter viewport
    - Implement intersection observer for visibility
    - _Requirements: 4.1_

  - [ ] 21.4 Optimize image loading
    - Implement lazy loading for collectible images
    - Use responsive image sizes
    - Add blur placeholder while loading
    - Optimize image formats (WebP with fallback)
    - _Requirements: 4.1, 4.3_


- [ ] 22. Update contract ABI and configuration
  - Export updated ReputationCard ABI with new collectible functions
  - Update contracts.ts configuration file
  - Add collectible-related contract addresses if needed
  - Update TypeChain types if using TypeChain
  - _Requirements: All contract-related requirements_

- [ ] 23. Add routing for new pages
  - Add route for /collectibles (CollectiblesGalleryPage)
  - Add route for /issuer/collectibles (issuer collectible management)
  - Add route for /verify/:chainId/:contractAddress/:cardId (public verification)
  - Update navigation menu with collectibles link
  - Add breadcrumbs for navigation
  - _Requirements: 4.1, 16.4_

- [ ] 24. Implement analytics tracking
  - Track collectible view events
  - Track claim attempts and successes
  - Track filter and sort usage
  - Track time spent on collectibles
  - Track conversion rates (views to claims)
  - Send analytics to service or store locally
  - _Requirements: 9.1, 9.3_

- [ ]* 25. Write smart contract tests
  - [ ]* 25.1 Test collectible creation
    - Test successful creation with valid parameters
    - Test authorization checks
    - Test input validation
    - Test event emission
    - _Requirements: 1.1, 3.1_

  - [ ]* 25.2 Test eligibility verification
    - Test OPEN eligibility
    - Test WHITELIST eligibility with valid/invalid addresses
    - Test TOKEN_HOLDER eligibility with sufficient/insufficient balance
    - Test PROFILE_REQUIRED eligibility
    - Test time window validation
    - Test supply limit checks
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 25.3 Test collectible claiming
    - Test successful claim by eligible user
    - Test rejection of ineligible user
    - Test rejection of duplicate claim
    - Test supply limit enforcement
    - Test time window enforcement
    - Test paused collectible rejection
    - Test reputation score update after claim
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 25.4 Test collectible management
    - Test pause/resume functionality
    - Test metadata updates before/after claims
    - Test whitelist add/remove operations
    - Test revocation functionality
    - _Requirements: 11.1, 11.2, 11.4, 15.1, 19.1_

  - [ ]* 25.5 Test edge cases
    - Test claiming at exact start/end time
    - Test claiming when supply is exactly 1 remaining
    - Test concurrent claims (race conditions)
    - Test pausing during active claims
    - Test issuer revocation with active collectibles
    - _Requirements: All_

- [ ]* 26. Write frontend component tests
  - [ ]* 26.1 Test CollectibleCard component
    - Test rendering with different states (eligible, not eligible, claimed)
    - Test supply indicator display
    - Test time remaining display
    - Test rarity styling
    - Test click handlers
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 26.2 Test CollectibleCreationForm component
    - Test form validation
    - Test conditional field rendering based on eligibility type
    - Test form submission
    - Test error handling
    - _Requirements: 1.1, 3.1, 8.1_

  - [ ]* 26.3 Test ClaimConfirmationModal component
    - Test gas estimate display
    - Test transaction flow
    - Test success/error states
    - Test celebration animation trigger
    - _Requirements: 5.1, 14.1, 14.4_

  - [ ]* 26.4 Test eligibility checking logic
    - Test isEligibleToClaim for various scenarios
    - Test claim status updates
    - Test error message generation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 27. Write integration tests
  - [ ]* 27.1 Test end-to-end claim flow
    - Test user browses collectibles
    - Test user checks eligibility
    - Test user claims collectible
    - Test card appears in user's collection
    - Test reputation score updates
    - _Requirements: 4.1, 5.1, 5.4_

  - [ ]* 27.2 Test issuer collectible creation flow
    - Test issuer creates collectible
    - Test collectible appears in gallery
    - Test eligible users can claim
    - Test issuer sees analytics
    - _Requirements: 1.1, 3.1, 4.1, 9.1_

  - [ ]* 27.3 Test whitelist management flow
    - Test issuer adds addresses to whitelist
    - Test whitelisted users can claim
    - Test non-whitelisted users cannot claim
    - Test issuer removes addresses
    - _Requirements: 8.2_

- [ ] 28. Deploy and verify contracts
  - Deploy updated ReputationCard contract to testnet
  - Verify contract on block explorer
  - Test all functions on testnet
  - Authorize contract in ProfileNFT
  - Deploy to mainnet after testing
  - Verify mainnet contract
  - _Requirements: All contract requirements_

- [ ]* 29. Update documentation
  - Document new collectible minting flow
  - Create issuer guide for creating collectibles
  - Create user guide for claiming collectibles
  - Document eligibility types and configuration
  - Add API documentation for new contract functions
  - Update README with new features
  - _Requirements: All_

- [ ] 30. Final integration and polish
  - Integrate all components into existing application
  - Test complete user flows end-to-end
  - Fix any visual inconsistencies
  - Optimize performance
  - Conduct accessibility audit
  - Fix any bugs discovered during testing
  - Prepare for production deployment
  - _Requirements: All_
