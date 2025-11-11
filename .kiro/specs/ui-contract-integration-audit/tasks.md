# Implementation Plan

- [x] 1. Create standardized contract fetching infrastructure





  - Create a custom `useContractData` hook that wraps contract service calls with consistent loading, error handling, and retry logic
  - Implement error classification utility that maps contract errors to user-friendly messages
  - Create a `fetchWithRetry` utility function with exponential backoff for transient failures
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3_

- [x] 2. Implement loading state components





  - Create `PageLoadingSkeleton` component with variants for dashboard, issuer, and admin pages
  - Create `CardLoadingSkeleton` component for credential and collectible cards
  - Create `InlineLoader` component for inline loading indicators
  - _Requirements: 1.1, 1.2_

- [x] 3. Implement error handling components





  - Create `ErrorBoundary` component to catch and handle React errors gracefully
  - Create `ErrorFallback` component to display user-friendly error messages
  - Create `TransactionStatus` component to show blockchain transaction progress
  - _Requirements: 1.3, 3.2, 3.3, 8.1, 8.2, 8.3, 8.4_

- [x] 4. Enhance ProtectedRoute component

  - Add granular role checking with specific error messages for each failure reason
  - Implement loading skeleton while checking permissions
  - Add custom fallback paths and unauthorized messages
  - Add proper TypeScript types for role check results
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Audit and fix Dashboard page contract fetching

  - [x] 5.1 Wrap all contract fetching calls with the new `useContractData` hook


    - Replace direct service calls with standardized hook pattern
    - Add proper loading states for reputation score, cards, collectibles, and stats
    - Implement error handling with retry buttons for failed sections
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 1.1, 1.2, 1.3_
  

  - [x] 5.2 Implement parallel data fetching for independent data sources

    - Use Promise.all for profile, cards, collectibles, and stats
    - Show partial data if some requests fail
    - Add loading skeletons for each section
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.3 Add proper error boundaries around major sections


    - Wrap profile section, credentials section, and activity section in error boundaries
    - Implement section-level error fallbacks
    - _Requirements: 1.3, 3.2_
  
  - [x] 5.4 Ensure activation prompt shows correctly for users without on-chain profiles


    - Check both off-chain and on-chain profile status
    - Display clear call-to-action for profile activation
    - _Requirements: 4.5_

- [x] 6. Audit and fix Issuer page contract fetching


  - [x] 6.1 Implement proper role-based access control


    - Check `userProfile.isIssuer` before rendering page content
    - Show authorization request UI for non-issuers
    - Add loading state while checking issuer status
    - _Requirements: 2.2, 2.4_
  

  - [x] 6.2 Fix issued credentials history fetching

    - Wrap credentials fetching in `useContractData` hook
    - Add loading skeleton for credentials list
    - Implement error handling with retry button
    - Display total issued count correctly
    - _Requirements: 5.1, 5.3_
  

  - [x] 6.3 Fix collectibles management data fetching

    - Wrap collectibles fetching in `useContractData` hook
    - Add loading skeleton for collectibles list
    - Display active collectibles count correctly
    - _Requirements: 5.2, 5.4_
  

  - [x] 6.4 Implement real-time updates after credential issuance

    - Refresh issued credentials list after successful issuance
    - Update statistics immediately
    - Show success feedback with transaction details
    - _Requirements: 5.5, 8.3_
  

  - [x] 6.5 Add transaction status feedback for credential issuance

    - Show loading indicator during transaction
    - Display wallet confirmation prompt
    - Show success message with credential ID
    - Handle transaction rejection gracefully
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. Audit and fix Admin page contract fetching


  - [x] 7.1 Implement proper admin access control


    - Check `userProfile.isAdmin` before rendering page content
    - Show access denied UI for non-admins
    - Add loading state while checking admin status
    - _Requirements: 2.3, 2.5_
  
  - [x] 7.2 Fix system statistics fetching


    - Wrap total credentials count fetching in `useContractData` hook
    - Add loading skeleton for statistics cards
    - Implement error handling with retry button
    - _Requirements: 6.1_
  
  - [x] 7.3 Fix authorized issuers list fetching


    - Wrap issuers list fetching in `useContractData` hook
    - Add loading skeleton for issuers list
    - Display issuer count correctly
    - _Requirements: 6.2_
  
  - [x] 7.4 Implement real-time updates after issuer authorization


    - Refresh issuers list after successful authorization
    - Update issuer count immediately
    - Show success feedback
    - _Requirements: 6.5_
  
  - [x] 7.5 Add transaction status feedback for issuer management


    - Show loading indicator during authorization/revocation
    - Display wallet confirmation prompt
    - Show success message with issuer address
    - Handle transaction rejection gracefully
    - Add confirmation dialog for revocation
    - _Requirements: 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Audit and fix Collectibles page contract fetching





  - [x] 8.1 Fix collectibles list fetching


    - Wrap collectibles fetching in `useContractData` hook
    - Add loading skeleton for collectibles grid
    - Implement error handling with retry button
    - _Requirements: 9.1_
  
  - [x] 8.2 Fix eligibility status fetching


    - Fetch eligibility status for all collectibles in parallel
    - Cache eligibility results to avoid redundant calls
    - Show loading state while checking eligibility
    - _Requirements: 9.1, 9.2_
  
  - [x] 8.3 Implement proper filtering by claim status


    - Filter collectibles by Available (eligible + not claimed + can claim now)
    - Filter collectibles by Claimed (already claimed by user)
    - Filter collectibles by Locked (not eligible or cannot claim yet)
    - _Requirements: 9.2, 9.3, 9.4_
  
  - [x] 8.4 Implement collectible claiming flow with proper feedback


    - Check eligibility before allowing claim
    - Show transaction status modal during claim
    - Display wallet confirmation prompt
    - Update collectible status after successful claim
    - Show success message with collectible details
    - Handle claim errors gracefully
    - _Requirements: 9.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Enhance WalletContext for better state management





  - Add proper error handling for wallet connection failures
  - Implement automatic reconnection on network changes
  - Add wallet disconnection cleanup
  - Ensure profile data persists across page navigation
  - _Requirements: 7.1, 7.2, 7.3, 10.4_

- [x] 10. Implement service initialization checks





  - Add initialization verification to all contract service methods
  - Throw descriptive errors when services are not initialized
  - Implement automatic reinitialization on network changes
  - Add `isInitialized` method to all services
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 11. Add consistent navigation elements





  - Ensure navigation shows wallet connect button when not connected
  - Display user role badge in navigation (User/Issuer/Admin)
  - Show role-specific menu items based on user permissions
  - Maintain navigation state across page transitions
  - _Requirements: 7.4, 7.5_

- [x] 12. Implement performance optimizations





  - Add caching for user profile data with 5-minute TTL
  - Implement batch fetching for multiple cards
  - Add memoization for expensive computations (eligibility filtering)
  - Implement lazy loading for collectibles and issuer history
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 9.1_

- [x] 13. Add comprehensive error logging







  - Implement error tracking service
  - Log all contract errors with context
  - Add performance monitoring
  - Create error dashboard for debugging
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 14. Write unit tests for contract services
  - Test initialization with valid/invalid providers
  - Test error throwing for uninitialized services
  - Test error classification
  - Mock blockchain responses
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ]* 15. Write integration tests for pages
  - Test role-based access control on all pages
  - Test data fetching and display
  - Test error states and recovery
  - Test user interactions and form submissions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 16. Write E2E tests for critical flows
  - Test user onboarding flow (connect wallet → create profile → view dashboard)
  - Test credential issuance flow (issuer issues → user receives → displays on dashboard)
  - Test collectible claiming flow (user views → checks eligibility → claims → sees in gallery)
  - Test admin management flow (admin authorizes issuer → issuer can issue credentials)
  - _Requirements: 2.1, 2.2, 2.3, 4.5, 5.5, 6.5, 9.5_
