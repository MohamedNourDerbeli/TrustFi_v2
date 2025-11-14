# Implementation Plan

- [x] 1. Set up project foundation and utilities








  - Create TypeScript type definitions for Profile, Template, Card, and ClaimSignature
  - Implement error parsing utility to convert contract errors into user-friendly messages
  - Create EIP712 signature utility functions for claim link generation and verification
  - Set up Supabase database schema with profiles, templates_cache, and claims_log tables
  - _Requirements: 1.1, 1.2, 1.3, 16.1, 16.2, 16.3_

- [x] 2. Implement authentication and wallet connection







  - [x] 2.1 Create WalletConnect component with connect/disconnect functionality


    - Build wallet connection button that triggers wagmi connector
    - Display connected wallet address in truncated format
    - Add disconnect button and wallet switching functionality
    - Handle connection errors and display user-friendly messages
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Implement useAuth hook for authentication state management


    - Track wallet connection status and connected address
    - Query Supabase to check if profile exists for connected wallet
    - Check on-chain roles (DEFAULT_ADMIN_ROLE, TEMPLATE_MANAGER_ROLE) using AccessControl
    - Provide connect and disconnect functions
    - _Requirements: 1.3, 1.4, 10.1_



  - [x] 2.3 Create AuthGuard component for route protection

    - Redirect unauthenticated users to wallet connection page
    - Verify wallet connection before rendering protected routes
    - Display loading state while checking authentication
    - _Requirements: 1.1, 1.5_

- [ ] 3. Build profile creation and viewing features





  - [x] 3.1 Enhance CreateProfile component with event listening


    - Add form validation for token URI input
    - Call ProfileNFT.createProfile() with user-provided tokenURI
    - Listen for ProfileCreated event to extract tokenId
    - Store wallet, profileId, and tokenURI in Supabase profiles table
    - Display success message with profile ID
    - Handle "Profile exists" error and redirect to profile view
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implement useProfile hook for profile data management


    - Fetch profileId using addressToProfileId mapping
    - Query profileIdToScore for current reputation score
    - Retrieve all attached cards using getCardsForProfile
    - Fetch profile metadata from Supabase (avatar, banner, bio, socials)
    - Provide createProfile, updateProfile, and recalculateScore functions
    - Implement uploadAvatar and uploadBanner functions using Pinata
    - Cache profile data and implement refresh mechanism
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 15.1, 15.2, 15.3, 15.6_

  - [x] 3.3 Create ProfileView component to display user profile


    - Display profile avatar and banner images from IPFS URLs
    - Show display name, bio, and social links
    - Display current reputation score prominently
    - Render grid of attached ReputationCard NFTs with metadata
    - Show tier and issuer information for each card
    - Add "Edit Profile" button for profile owner
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 15.8_

  - [x] 3.4 Build ProfileEdit component for profile customization


    - Create form with fields for display name, bio, Twitter, Discord, website
    - Integrate AvatarUpload component for avatar image selection
    - Integrate BannerUpload component for banner image selection
    - Validate form inputs before submission
    - Update Supabase profiles table with new metadata
    - Display success message and redirect to profile view
    - _Requirements: 15.1, 15.6, 15.7_

  - [x] 3.5 Implement AvatarUpload component


    - Create drag-and-drop file input with click-to-select fallback
    - Validate file type (image formats only) and size (max 5MB)
    - Display image preview in circular format before upload
    - Upload validated file to Pinata IPFS
    - Show upload progress indicator
    - Return IPFS URL on successful upload
    - Handle upload errors with user-friendly messages
    - _Requirements: 15.2, 15.3_

  - [x] 3.6 Implement BannerUpload component


    - Create drag-and-drop file input with click-to-select fallback
    - Validate file type (image formats only) and size (max 10MB)
    - Display image preview in 3:1 aspect ratio before upload
    - Upload validated file to Pinata IPFS
    - Show upload progress indicator
    - Return IPFS URL on successful upload
    - Handle upload errors with user-friendly messages
    - _Requirements: 15.4, 15.5_

- [x] 4. Implement score recalculation feature




  - [x] 4.1 Create ScoreRecalculate component


    - Display current score and last updated timestamp
    - Add "Recalculate Score" button
    - Call ProfileNFT.recalculateMyScore() on button click
    - Show loading state during transaction
    - Listen for ScoreUpdated event
    - Update displayed score with new value
    - Handle errors (no profile, reputation contract not set)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Build template discovery and card claiming




  - [x] 5.1 Implement useTemplates hook for template data


    - Query all template IDs from ReputationCard contract
    - Fetch template details using templates mapping
    - Filter templates by pause state and time windows
    - Check user eligibility using hasProfileClaimed mapping
    - Provide createTemplate and pauseTemplate functions for admins
    - Cache template data with refresh mechanism
    - _Requirements: 5.1, 5.2, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.2 Create DiscoverCollectibles component


    - Display grid of all available templates
    - Show template name, description, tier, and issuer for each
    - Display "Paused" badge for paused templates
    - Show "Already Claimed" status for claimed templates
    - Display eligibility status (claimable, not started, ended)
    - Add "Claim" button for eligible templates
    - Disable claim button for ineligible or paused templates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.3 Implement useReputationCards hook for card operations


    - Provide issueDirect function for issuer direct issuance
    - Implement claimWithSignature function for signature-based claiming
    - Handle transaction submission and confirmation
    - Listen for CardIssued events
    - Update local state after successful card issuance
    - Parse and handle contract validation errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.4 Enhance ClaimCard component for signature-based claiming


    - Accept template ID, nonce, tokenURI, and signature as props
    - Display template information and tier
    - Verify user has a profile before showing claim button
    - Call claimWithSignature with provided parameters
    - Show transaction progress and confirmation
    - Display newly minted card ID on success
    - Handle errors (invalid signature, already claimed, nonce used)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
-

- [x] 6. Build admin portal for platform management




  - [x] 6.1 Create AdminDashboard component


    - Verify connected wallet has DEFAULT_ADMIN_ROLE
    - Display total count of profiles from Supabase
    - Show total count of templates from contract
    - Display total issued cards count from claims_log
    - Show recent activity feed from claims_log
    - Add navigation to issuer management and template management
    - _Requirements: 10.1, 10.2_

  - [x] 6.2 Implement CreateTemplate component


    - Create form with fields for templateId, issuer, maxSupply, tier, startTime, endTime
    - Validate all inputs (tier 1-3, startTime < endTime if endTime > 0)
    - Call ReputationCard.createTemplate() with form data
    - Listen for TemplateCreated event
    - Display success message with template ID
    - Handle errors (template exists, invalid tier, unauthorized)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 6.3 Build IssuerManagement component


    - Display list of all addresses with TEMPLATE_MANAGER_ROLE
    - Add form to grant TEMPLATE_MANAGER_ROLE to new address
    - Validate address format before granting role
    - Call grantRole with TEMPLATE_MANAGER_ROLE
    - Add "Revoke" button for each issuer in list
    - Call revokeRole when revoke button is clicked
    - Update list after role changes
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 6.4 Create TemplateManagement component


    - Display all templates with pause status
    - Add toggle switch for each template to pause/unpause
    - Call setTemplatePaused with appropriate state
    - Listen for TemplatePaused event
    - Update UI to reflect new pause state
    - Show template details (current supply, max supply, tier)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Build issuer portal for credential management




  - [x] 7.1 Create IssuerDashboard component


    - Verify connected wallet has TEMPLATE_MANAGER_ROLE
    - Display templates where issuer matches connected wallet
    - Show analytics: total cards issued, claims by template
    - Display recent issuances from claims_log
    - Add navigation to template list, issue form, and claim link generator
    - _Requirements: 11.1, 11.2_


  - [x] 7.2 Implement TemplateList component for issuers

    - Query and display templates where issuer is connected wallet
    - Show templateId, tier, currentSupply, maxSupply for each
    - Display pause state with toggle button
    - Add "Issue Card" button for each template
    - Show detailed template info on click (startTime, endTime, total claims)
    - Call setTemplatePaused when toggle is clicked
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 7.3 Build IssueCardForm component for direct issuance


    - Create form with fields for recipient address, template selection, tokenURI
    - Filter template dropdown to show only issuer's templates
    - Validate recipient address format
    - Verify recipient has a profile before submission
    - Call ReputationCard.issueDirect() with form data
    - Display success message with minted card ID
    - Handle errors (no profile, already claimed, max supply, paused)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 7.4 Implement ClaimLinkGenerator component


    - Create form with fields for user address, template selection, nonce
    - Filter templates to show only issuer's templates
    - Construct EIP712 typed data structure with Claim parameters
    - Prompt issuer to sign typed data using connected wallet
    - Generate claim URL with encoded parameters and signature
    - Display generated URL with copy-to-clipboard button
    - Show QR code for easy mobile sharing
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 8. Create public claim page for claim links




  - [x] 8.1 Build PublicClaimPage component


    - Parse URL parameters to extract templateId, nonce, tokenURI, signature
    - Display template information (name, description, tier)
    - Show "Connect Wallet" button if no wallet connected
    - Verify connected address has ProfileNFT
    - Display "Claim" button when wallet is connected and profile exists
    - Call claimWithSignature when claim button is clicked
    - Show transaction progress and success message
    - Handle errors (invalid signature, already claimed, no profile)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 9. Implement routing and navigation





  - [x] 9.1 Set up React Router with route definitions


    - Create routes for home, user dashboard, issuer portal, admin portal
    - Add route for public claim page with URL parameter parsing
    - Implement nested routes for settings and profile pages
    - Add 404 not found page
    - _Requirements: 1.1, 1.5_

  - [x] 9.2 Create navigation components


    - Build main navigation bar with wallet connection status
    - Add role-based navigation items (show admin/issuer links based on roles)
    - Implement mobile-responsive navigation menu
    - Add user profile dropdown with settings and logout
    - _Requirements: 10.1, 11.1_

- [x] 10. Build shared UI components




  - [x] 10.1 Create reusable Card component


    - Accept title, description, image, and action buttons as props
    - Style with Tailwind CSS for consistent appearance
    - Support different card sizes and layouts
    - Add hover effects and animations
    - _Requirements: 3.5, 5.2_

  - [x] 10.2 Implement Button component with variants


    - Create primary, secondary, and danger button styles
    - Add loading state with spinner
    - Support disabled state
    - Implement different sizes (small, medium, large)
    - _Requirements: 2.4, 4.5, 12.4_

  - [x] 10.3 Build LoadingSpinner component


    - Create animated spinner with Tailwind CSS
    - Support different sizes
    - Add optional loading text
    - _Requirements: 2.3, 4.1_


  - [x] 10.4 Create ErrorMessage component

    - Display error messages in styled container
    - Add optional retry button
    - Support dismissible errors
    - Parse contract errors into user-friendly text
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 11. Implement user dashboard and homepage







  - [x] 11.1 Create HomePage component


    - Build hero section with value proposition
    - Add "Create My Profile" call-to-action button
    - Display feature highlights
    - Show recent platform activity
    - _Requirements: 1.1, 1.5_

  - [x] 11.2 Build UserDashboard component


    - Display user's profile summary (avatar, name, score)
    - Show "Recalculate Score" button
    - Display recent activity (newly claimed cards)
    - Add quick links to discover collectibles and profile settings
    - Show reputation score chart or visualization
    - _Requirements: 3.1, 3.2, 3.3, 4.1_

- [-] 12. Add error handling and user feedback


  - [x] 12.1 Implement global error boundary


    - Catch React component errors
    - Display fallback UI with error message
    - Log errors to console for debugging
    - Provide "Reload" button to recover
    - _Requirements: 16.3_

  - [x] 12.2 Add transaction error handling






    - Parse contract revert reasons
    - Map common errors to user-friendly messages
    - Display gas estimation errors with suggestions
    - Handle user rejection gracefully
    - Implement retry mechanism for network errors
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 12.3 Implement success notifications





    - Show toast notifications for successful transactions
    - Display transaction hash with block explorer link
    - Add confetti animation for profile creation and card claims
    - _Requirements: 2.4, 4.5, 7.6_

- [ ] 13. Optimize performance and user experience





  - [x] 13.1 Implement React Query for data caching


    - Cache contract read calls (profiles, templates, scores)
    - Set appropriate cache TTL for different data types
    - Implement optimistic updates for better UX
    - Add background refetching for stale data
    - _Requirements: 3.1, 3.2, 5.1_


  - [x] 13.2 Add loading states and skeletons

    - Create skeleton loaders for profile and card grids
    - Show loading spinners during transactions
    - Display progress bars for file uploads
    - Implement smooth transitions between states
    - _Requirements: 2.3, 15.3, 15.5_


  - [x] 13.3 Optimize bundle size

    - Implement code splitting for admin and issuer portals
    - Lazy load heavy components (image upload, QR code)
    - Tree-shake unused dependencies
    - Analyze bundle with Vite build analyzer
    - _Requirements: N/A (Performance optimization)_

- [ ] 14. Testing and validation
  - [ ]* 14.1 Write unit tests for custom hooks
    - Test useAuth hook with different wallet states
    - Test useProfile hook data fetching and mutations
    - Test useTemplates hook filtering and caching
    - Test useReputationCards hook transaction handling
    - _Requirements: All_

  - [ ]* 14.2 Write integration tests for user flows
    - Test complete profile creation flow
    - Test card claiming with signature flow
    - Test admin template creation flow
    - Test issuer direct issuance flow
    - _Requirements: 2.1-2.5, 6.1-6.5, 7.1-7.6, 8.1-8.5_

  - [ ]* 14.3 Perform end-to-end testing
    - Test new user onboarding journey
    - Test existing user profile viewing
    - Test issuer creating and distributing cards
    - Test admin managing templates and issuers
    - _Requirements: All_

- [ ] 15. Deployment and documentation
  - [ ] 15.1 Configure environment variables
    - Set up .env files for development and production
    - Document all required environment variables
    - Add validation for missing environment variables
    - _Requirements: N/A (Deployment)_

  - [ ] 15.2 Deploy frontend to Vercel
    - Configure Vercel project with environment variables
    - Set up custom domain (app.trustfi.com)
    - Enable HTTPS and CDN
    - Configure build settings and redirects
    - _Requirements: N/A (Deployment)_

  - [ ]* 15.3 Create user documentation
    - Write user guide for profile creation
    - Document card claiming process
    - Create issuer onboarding guide
    - Write admin portal documentation
    - _Requirements: N/A (Documentation)_
