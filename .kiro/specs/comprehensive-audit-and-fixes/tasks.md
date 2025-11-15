# Implementation Plan

- [x] 1. Smart Contract Functionality Audit





  - Review and test ProfileNFT contract functions
  - Review and test ReputationCard contract functions
  - Verify access control and role management
  - Test soulbound behavior and event emissions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Audit ProfileNFT contract functions


  - Test createProfile() with various tokenURI inputs
  - Verify addressToProfileId mapping is set correctly
  - Test updateProfileMetadata() updates tokenURI
  - Test recalculateMyScore() calls ReputationCard contract
  - Verify notifyNewCard() is only callable by ReputationCard
  - Test getCardsForProfile() returns correct card IDs
  - Verify ProfileCreated and ScoreUpdated events are emitted
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Audit ReputationCard contract functions

  - Test createTemplate() with valid and invalid inputs
  - Verify templates mapping stores all fields correctly
  - Test setTemplatePaused() toggles pause state
  - Test issueDirect() mints card and attaches to profile
  - Test claimWithSignature() validates signature and mints card
  - Verify hasProfileClaimed mapping prevents double claims
  - Test calculateScoreForProfile() returns accurate score
  - Verify TemplateCreated, CardIssued, and TemplatePaused events
  - _Requirements: 1.2, 1.4_

- [x] 1.3 Verify access control and roles

  - Test DEFAULT_ADMIN_ROLE can grant/revoke TEMPLATE_MANAGER_ROLE
  - Verify only TEMPLATE_MANAGER_ROLE can create templates
  - Test only template issuer can pause their templates
  - Verify unauthorized addresses cannot call privileged functions
  - Test hasRole() returns correct values for all addresses
  - _Requirements: 1.5_

- [x] 1.4 Test soulbound token behavior

  - Verify ProfileNFT cannot be transferred after mint
  - Verify ReputationCard cannot be transferred after mint
  - Test that burn operations work if implemented
  - Confirm _update() override prevents transfers correctly
  - _Requirements: 1.3, 1.4_

- [x] 2. Database Schema and Operations Audit





  - Verify profiles table structure and constraints
  - Verify templates_cache table structure and constraints
  - Verify claims_log table structure and constraints
  - Verify issuers table structure and constraints
  - Test all CRUD operations on each table
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 2.1 Audit profiles table operations


  - Test INSERT operation saves all profile fields correctly
  - Verify wallet address is stored in lowercase
  - Test UPDATE operation modifies display_name, bio, avatar_url, etc.
  - Verify unique constraints on wallet and profile_id
  - Test SELECT queries retrieve complete profile data
  - Verify updated_at timestamp is automatically updated
  - Check indexes on wallet, profile_id, and username
  - _Requirements: 2.1, 2.5, 15.1_


- [ ] 2.2 Audit templates_cache table operations




  - Test INSERT operation caches template data correctly
  - Verify all template fields are saved (issuer, tier, supply, times)
  - Test UPDATE operation modifies current_supply and is_paused
  - Test SELECT queries filter by issuer, tier, and pause state
  - Verify indexes on issuer, tier, and is_paused
  - Check that updated_at timestamp is automatically updated
  - _Requirements: 2.3_


- [ ] 2.3 Audit claims_log table operations
  - Test INSERT operation logs claims with correct IDs
  - Verify profile_id, template_id, and card_id are saved correctly
  - Test claim_type is validated (direct or signature)
  - Test SELECT queries filter by profile_id and template_id
  - Verify indexes on profile_id, template_id, card_id, and claimed_at
  - Check that claimed_at timestamp is set automatically

  - _Requirements: 2.2_

- [ ] 2.4 Audit issuers table operations
  - Test INSERT operation adds new issuers correctly
  - Verify address is stored and unique constraint works
  - Test UPDATE operation sets revoked_at and is_active
  - Test SELECT queries filter by is_active status
  - Verify indexes on address and is_active

  - Check timestamps are set correctly
  - _Requirements: 2.4_

- [ ] 2.5 Audit collectibles table operations
  - Test INSERT operation saves collectible metadata
  - Verify template_id links to on-chain template
  - Test UPDATE operation modifies title, description, image_url
  - Test SELECT queries filter by is_active and created_by

  - Verify indexes on template_id, is_active, and created_by
  - Check JSONB requirements field stores data correctly
  - _Requirements: 2.3_

- [ ] 2.6 Verify Row Level Security policies
  - Test that anonymous users can SELECT from all tables
  - Verify only service role can INSERT/UPDATE profiles
  - Test RLS policies on templates_cache, claims_log, issuers
  - Verify collectibles table allows public SELECT for active items
  - Test that unauthorized operations are blocked
  - _Requirements: 16.3_

- [x] 3. Data Flow and Synchronization Audit





  - Test profile creation flow (contract → database)
  - Test card claiming flow (contract → database)
  - Test template creation flow (contract → database)
  - Verify event listeners capture all events
  - Test cache invalidation after mutations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Audit profile creation data flow


  - Test that ProfileCreated event is captured by frontend
  - Verify profile data is saved to Supabase after event
  - Test that wallet address is normalized to lowercase
  - Verify profile_id from event matches database entry
  - Test that cache is invalidated after profile creation
  - Verify useAuth hook detects new profile immediately
  - _Requirements: 3.1, 3.4_

- [x] 3.2 Audit card claiming data flow

  - Test that CardIssued event is captured by frontend
  - Verify claim is logged to claims_log with correct IDs
  - Test that profile cards array is updated immediately
  - Verify useProfile hook refetches cards after claim
  - Test that score is recalculated if needed
  - Verify UI displays new card without page refresh
  - _Requirements: 3.2, 3.5_

- [x] 3.3 Audit template creation data flow

  - Test that TemplateCreated event is captured by frontend
  - Verify template is cached in templates_cache table
  - Test that useTemplates hook refetches after creation
  - Verify new template appears in discover page immediately
  - Test that template counter is incremented in database
  - _Requirements: 3.1, 3.4_

- [x] 3.4 Audit score recalculation flow

  - Test that recalculateMyScore() calls contract correctly
  - Verify ScoreUpdated event is captured by frontend
  - Test that useProfile hook updates score immediately
  - Verify UI displays new score without page refresh
  - Test that score calculation matches expected value
  - _Requirements: 3.2_

- [x] 3.5 Verify cache invalidation strategy

  - Test that React Query cache is invalidated after mutations
  - Verify stale time settings are appropriate (2-5 minutes)
  - Test that refetch functions work correctly
  - Verify optimistic updates rollback on error
  - Test that multiple tabs stay synchronized
  - _Requirements: 3.3, 3.4_

- [ ] 4. Frontend Hooks Functionality Audit
  - Test useAuth hook with different wallet states
  - Test useProfile hook data fetching and caching
  - Test useTemplates hook filtering and eligibility
  - Test useReputationCards hook transaction handling
  - Test useCollectibles hook data enrichment
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.1 Audit useAuth hook
  - Test hook returns correct isConnected status
  - Verify hasProfile is determined correctly from database
  - Test isAdmin checks DEFAULT_ADMIN_ROLE on-chain
  - Test isIssuer checks TEMPLATE_MANAGER_ROLE on-chain
  - Verify connect() and disconnect() functions work
  - Test refreshProfile() invalidates cache and refetches
  - Verify loading states are accurate during checks
  - _Requirements: 4.1, 4.4_

- [ ] 4.2 Audit useProfile hook
  - Test hook fetches profileId from contract correctly
  - Verify score is fetched from profileIdToScore mapping
  - Test cards array is fetched from getCardsForProfile()
  - Verify profile metadata is fetched from Supabase
  - Test that missing profile returns null gracefully
  - Verify refreshProfile() refetches all data
  - Test error handling for network failures
  - _Requirements: 4.1, 4.2_

- [ ] 4.3 Audit useTemplates hook
  - Test hook fetches all templates from contract
  - Verify templates are filtered by time windows correctly
  - Test hasClaimed status is checked for user's profile
  - Verify createTemplate() function works for admins
  - Test pauseTemplate() function works for issuers
  - Verify checkEligibility() returns correct boolean
  - Test refreshTemplates() invalidates cache and refetches
  - _Requirements: 4.2, 4.3_

- [ ] 4.4 Audit useReputationCards hook
  - Test issueDirect() function submits transaction correctly
  - Verify claimWithSignature() validates signature properly
  - Test that CardIssued event is captured and card ID returned
  - Verify isProcessing state is managed correctly
  - Test error handling and retry logic
  - Verify claims are logged to Supabase after success
  - Test clearError() function resets error state
  - _Requirements: 4.3, 4.4_

- [ ] 4.5 Audit useCollectibles hook
  - Test hook fetches collectibles from Supabase
  - Verify on-chain template data is enriched correctly
  - Test hasClaimed status is checked for user's profile
  - Verify isClaimable status considers time windows and pause state
  - Test refreshCollectibles() invalidates cache and refetches
  - Verify error handling for missing templates
  - _Requirements: 4.5_

- [ ] 5. User Interface and UX Audit
  - Test navigation and routing across all pages
  - Verify form validation and error messages
  - Test loading states and user feedback
  - Verify mobile responsiveness
  - Test accessibility compliance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 5.1 Audit navigation and routing
  - Test all routes render correct components
  - Verify protected routes redirect unauthenticated users
  - Test role-based navigation shows correct menu items
  - Verify back buttons and breadcrumbs work correctly
  - Test 404 page for invalid routes
  - Verify URL parameters are parsed correctly (claim page)
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 Audit form validation and error handling
  - Test CreateProfile form validates tokenURI input
  - Verify CreateTemplate form validates all fields
  - Test IssueCardForm validates recipient address
  - Verify ProfileEdit form validates display name and bio
  - Test that invalid Ethereum addresses show errors
  - Verify file upload forms validate type and size
  - Test that error messages are clear and actionable
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5.3 Audit loading states and feedback
  - Test that loading spinners appear during data fetching
  - Verify transaction progress is shown during submissions
  - Test that success notifications appear after mutations
  - Verify error notifications display parsed error messages
  - Test that confetti animation plays for card claims
  - Verify transaction hashes link to block explorer
  - _Requirements: 5.3, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 5.4 Audit mobile responsiveness
  - Test homepage layout on mobile devices (320px-768px)
  - Verify dashboard displays correctly on tablets
  - Test navigation menu collapses on mobile
  - Verify card grids stack in single column on mobile
  - Test forms are usable with touch input
  - Verify images scale appropriately on small screens
  - Test that modals and dialogs fit mobile screens
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 5.5 Audit accessibility compliance
  - Test keyboard navigation through all interactive elements
  - Verify focus indicators are visible on all focusable elements
  - Test screen reader compatibility with ARIA labels
  - Verify color contrast meets WCAG AA standards
  - Test that images have descriptive alt text
  - Verify form inputs have associated labels
  - Test that modals trap focus and can be closed with Escape
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 6. Page-Specific Functionality Audit
  - Test HomePage displays correct CTAs based on user state
  - Test UserDashboard shows profile summary and stats
  - Test DiscoverPage displays available collectibles
  - Test PublicClaimPage handles claim links correctly
  - Test Admin and Issuer portals verify roles
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 6.1 Audit HomePage functionality
  - Test that unauthenticated users see "Connect Wallet" message
  - Verify connected users without profile see "Create Profile" CTA
  - Test that users with profile see "Go to Dashboard" button
  - Verify admin users see admin portal link
  - Test that issuer users see issuer portal link
  - Verify recent activity section displays latest claims
  - Test that feature highlights are displayed correctly
  - _Requirements: 5.1_

- [ ] 6.2 Audit UserDashboard functionality
  - Test that profile summary displays avatar, banner, and name
  - Verify reputation score is displayed prominently
  - Test that cards collected count is accurate
  - Verify recent activity shows latest claims
  - Test "Edit Profile" button navigates to edit page
  - Verify "Discover Collectibles" button works
  - Test score breakdown shows tier distribution
  - Verify missing profile metadata shows helpful message
  - _Requirements: 5.2, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.3 Audit DiscoverPage functionality
  - Test that all active templates are displayed
  - Verify paused templates show "Paused" badge
  - Test that claimed templates show "Already Claimed" status
  - Verify eligibility status is displayed correctly
  - Test "Claim" button is disabled for ineligible templates
  - Verify template details (tier, issuer, supply) are shown
  - Test that clicking claim opens claim modal or flow
  - _Requirements: 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.4 Audit PublicClaimPage functionality
  - Test that URL parameters are parsed correctly
  - Verify template information is displayed
  - Test "Connect Wallet" button appears for unauthenticated users
  - Verify "Create Profile" message shows for users without profile
  - Test "Claim" button calls claimWithSignature correctly
  - Verify success message displays card ID after claim
  - Test error messages for invalid signature or already claimed
  - Verify paused templates show appropriate message
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.5 Audit AdminDashboard functionality
  - Test that only DEFAULT_ADMIN_ROLE can access
  - Verify platform statistics are displayed correctly
  - Test navigation to issuer management works
  - Verify navigation to template management works
  - Test recent activity feed shows latest platform events
  - _Requirements: 9.1, 9.2, 10.1, 10.2_

- [ ] 6.6 Audit IssuerDashboard functionality
  - Test that only TEMPLATE_MANAGER_ROLE can access
  - Verify issuer's templates are displayed
  - Test analytics show correct card issuance counts
  - Verify navigation to template list works
  - Test navigation to issue form works
  - Verify navigation to claim link generator works
  - _Requirements: 10.1, 10.2_

- [ ] 7. Component-Specific Functionality Audit
  - Test CreateProfile component creates profile correctly
  - Test ProfileEdit component updates metadata
  - Test CreateTemplate component validates and creates templates
  - Test IssuerManagement component grants/revokes roles
  - Test ClaimLinkGenerator creates valid claim links
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.3, 10.4, 10.5_

- [ ] 7.1 Audit CreateProfile component
  - Test form validates tokenURI input
  - Verify createProfile() is called with correct parameters
  - Test that ProfileCreated event is captured
  - Verify profile data is saved to Supabase
  - Test success message displays profile ID
  - Verify "Profile exists" error is handled gracefully
  - Test that user is redirected to dashboard after creation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.2 Audit ProfileEdit component
  - Test form pre-fills with existing profile data
  - Verify all fields can be edited (name, bio, socials)
  - Test avatar upload validates file type and size
  - Verify banner upload validates file type and size
  - Test that images are uploaded to IPFS correctly
  - Verify Supabase profiles table is updated
  - Test success message and redirect to profile view
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.3 Audit CreateTemplate component
  - Test form validates all inputs (templateId, issuer, tier, etc.)
  - Verify tier dropdown only allows 1-3
  - Test that startTime < endTime validation works
  - Verify createTemplate() is called with correct parameters
  - Test that TemplateCreated event is captured
  - Verify template is cached in Supabase
  - Test success message displays template ID
  - Verify error handling for "Template exists" and "Unauthorized"
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7.4 Audit IssuerManagement component
  - Test that list displays all addresses with TEMPLATE_MANAGER_ROLE
  - Verify form validates Ethereum address format
  - Test grantRole() is called when granting issuer role
  - Verify revokeRole() is called when revoking issuer role
  - Test that issuers table is updated after role changes
  - Verify list refreshes after grant/revoke operations
  - Test error handling for unauthorized operations
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 7.5 Audit ClaimLinkGenerator component
  - Test form filters templates to show only issuer's templates
  - Verify user address and nonce inputs are validated
  - Test that EIP712 typed data is constructed correctly
  - Verify issuer signs the typed data with their wallet
  - Test that claim URL is generated with encoded parameters
  - Verify QR code is displayed for the claim link
  - Test copy-to-clipboard functionality works
  - _Requirements: 10.1, 10.2_

- [ ] 8. Integration Testing and End-to-End Flows
  - Test complete new user onboarding flow
  - Test existing user profile viewing and editing
  - Test card discovery and claiming flow
  - Test issuer template creation and card issuance
  - Test admin issuer management flow
  - _Requirements: All_

- [ ] 8.1 Test new user onboarding flow
  - Connect wallet → verify useAuth detects connection
  - Create profile → verify ProfileNFT minted and Supabase updated
  - View dashboard → verify profile data is displayed
  - Discover collectibles → verify templates are shown
  - Claim card → verify card is minted and logged
  - View profile → verify card appears in collection
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 7.1_

- [ ] 8.2 Test profile editing flow
  - Navigate to edit page → verify form pre-fills
  - Update display name and bio → verify validation
  - Upload avatar image → verify IPFS upload
  - Upload banner image → verify IPFS upload
  - Save changes → verify Supabase update
  - View profile → verify changes are reflected
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8.3 Test issuer template creation and issuance flow
  - Access issuer portal → verify role check
  - Create template → verify on-chain creation and caching
  - View template list → verify new template appears
  - Issue card directly → verify recipient has profile
  - Verify card is minted → check CardIssued event
  - Verify claim is logged → check claims_log table
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2_

- [ ] 8.4 Test claim link generation and usage flow
  - Generate claim link → verify signature is created
  - Copy claim URL → verify URL contains all parameters
  - Open claim page → verify template info is displayed
  - Connect wallet → verify wallet connection
  - Claim card → verify signature validation and minting
  - Verify success → check card appears in profile
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2_

- [ ] 8.5 Test admin issuer management flow
  - Access admin portal → verify DEFAULT_ADMIN_ROLE
  - View issuer list → verify current issuers displayed
  - Grant issuer role → verify grantRole transaction
  - Verify issuer can create templates → test access
  - Revoke issuer role → verify revokeRole transaction
  - Verify issuer cannot create templates → test denial
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 9. Performance and Optimization Audit
  - Test page load times and bundle size
  - Verify React Query caching reduces network requests
  - Test image lazy loading and optimization
  - Verify code splitting for admin/issuer portals
  - Test concurrent operations don't cause conflicts
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 9.1 Audit page load performance
  - Measure initial page load time (target < 2 seconds)
  - Verify bundle size is optimized (check with Vite analyzer)
  - Test that code splitting reduces initial bundle
  - Verify lazy loading of heavy components (QR, image upload)
  - Test that images are lazy loaded below the fold
  - _Requirements: 12.1, 12.3_

- [ ] 9.2 Audit caching and network efficiency
  - Verify React Query cache reduces redundant requests
  - Test that stale time settings are appropriate
  - Verify optimistic updates improve perceived performance
  - Test that background refetching keeps data fresh
  - Verify multicall batching for contract reads (if implemented)
  - _Requirements: 12.1, 12.2_

- [ ] 9.3 Test concurrent operations
  - Test multiple users claiming same template simultaneously
  - Verify race conditions don't cause double claims
  - Test that cache invalidation works with concurrent updates
  - Verify optimistic updates rollback correctly on conflict
  - Test that multiple tabs stay synchronized
  - _Requirements: 12.5_

- [ ] 10. Security and Data Integrity Audit
  - Verify wallet connection never exposes private keys
  - Test EIP712 signatures are validated correctly
  - Verify Supabase RLS policies prevent unauthorized access
  - Test input sanitization prevents injection attacks
  - Verify environment variables are not exposed
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 10.1 Audit wallet security
  - Verify private keys are never requested or stored
  - Test that wallet connection uses secure methods
  - Verify signatures are requested only when necessary
  - Test that user can reject transactions safely
  - Verify wallet disconnection clears all sensitive data
  - _Requirements: 16.1_

- [ ] 10.2 Audit signature security
  - Test that EIP712 typed data is constructed correctly
  - Verify domain separator includes correct chain ID
  - Test that signatures are validated on-chain
  - Verify nonce prevents signature replay attacks
  - Test that expired signatures are rejected
  - _Requirements: 16.2_

- [ ] 10.3 Audit database security
  - Verify RLS policies allow only authorized operations
  - Test that service role key is not exposed in client
  - Verify foreign key constraints prevent orphaned records
  - Test that input is sanitized before database insertion
  - Verify prepared statements prevent SQL injection
  - _Requirements: 16.3, 16.4_

- [ ] 10.4 Audit environment variable security
  - Verify sensitive keys are not committed to repository
  - Test that .env files are in .gitignore
  - Verify client-side code doesn't expose secrets
  - Test that Supabase anon key has appropriate RLS policies
  - Verify Pinata keys are used securely
  - _Requirements: 16.4, 16.5_

- [ ] 11. Bug Fixes and Improvements
  - Fix any issues discovered during audit
  - Improve error messages for better UX
  - Optimize slow queries or operations
  - Enhance UI/UX based on findings
  - Update documentation with fixes
  - _Requirements: All_

- [ ] 11.1 Fix critical bugs
  - Fix any data synchronization issues found
  - Resolve contract interaction errors
  - Fix database query errors or missing data
  - Resolve UI rendering issues
  - Fix broken navigation or routing
  - _Requirements: All_

- [ ] 11.2 Improve error handling
  - Enhance contract error parsing for clarity
  - Improve database error messages
  - Add retry logic for network failures
  - Enhance user-facing error messages
  - Add error recovery flows
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11.3 Optimize performance
  - Reduce bundle size if too large
  - Optimize slow database queries
  - Improve image loading and caching
  - Enhance React Query cache configuration
  - Implement additional code splitting if needed
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11.4 Enhance UI/UX
  - Improve mobile responsiveness issues found
  - Enhance accessibility compliance
  - Improve loading states and feedback
  - Enhance form validation messages
  - Improve visual design consistency
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.2, 11.3, 11.4, 11.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 11.5 Update documentation
  - Document any bugs found and fixes applied
  - Update README with new findings
  - Document any API or interface changes
  - Update deployment instructions if needed
  - Create troubleshooting guide for common issues
  - _Requirements: All_

- [ ] 12. Final Verification and Testing
  - Perform final end-to-end testing of all flows
  - Verify all bugs have been fixed
  - Test on multiple browsers and devices
  - Verify performance meets targets
  - Confirm security best practices are followed
  - _Requirements: All_

- [ ] 12.1 Final end-to-end testing
  - Test complete user onboarding flow
  - Test profile creation and editing
  - Test card discovery and claiming
  - Test issuer template creation and issuance
  - Test admin issuer management
  - Test claim link generation and usage
  - _Requirements: All_

- [ ] 12.2 Cross-browser and device testing
  - Test on Chrome, Firefox, Safari, Edge
  - Test on desktop (1920x1080, 1366x768)
  - Test on tablet (iPad, Android tablet)
  - Test on mobile (iPhone, Android phone)
  - Verify all features work across platforms
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12.3 Performance verification
  - Verify page load times meet targets (< 2 seconds)
  - Check bundle size is optimized
  - Verify caching reduces network requests
  - Test that images load efficiently
  - Confirm no performance regressions
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12.4 Security verification
  - Verify no private keys are exposed
  - Test that signatures are validated correctly
  - Confirm RLS policies prevent unauthorized access
  - Verify input sanitization works
  - Test that environment variables are secure
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 12.5 Create audit report
  - Document all issues found during audit
  - List all fixes and improvements made
  - Provide recommendations for future improvements
  - Include performance metrics and benchmarks
  - Create summary of audit findings
  - _Requirements: All_
