# Implementation Plan

- [ ] 1. Create Treasury contract for fund management
  - Implement receive function to accept payments from ReputationCard contract
  - Add owner-only withdrawal function with reentrancy protection
  - Create view functions for balance and revenue statistics
  - Implement comprehensive event emissions for all financial operations
  - Add balance validation before withdrawal attempts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2. Extend ReputationCard contract with payment infrastructure
- [ ] 2.1 Add monetization state variables and data structures
  - Define SubscriptionTier enum (Free, Premium)
  - Create IssuerSubscription struct with tier, expiry, usage counters
  - Add state variables for fee configuration (cardIssuanceFee, premiumSubscriptionPrice, freeMonthlyCardLimit)
  - Add treasury contract address as immutable reference
  - Create mappings for issuer subscriptions and revenue tracking
  - _Requirements: 2.1, 2.2, 6.1_

- [ ] 2.2 Implement subscription management functions
  - Write upgradeToPremium function with payment validation
  - Write renewPremiumSubscription function for existing premium users
  - Create getSubscriptionInfo view function
  - Implement isSubscriptionActive helper to check expiration
  - Add internal function to initialize new issuers as free tier
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 2.3 Modify issueCard function to handle payments
  - Add payable modifier to issueCard function
  - Implement _checkIssuerLimits internal function to validate tier and usage
  - Implement _processCardIssuanceFee internal function to handle payment
  - Add logic to check and reset monthly limits for free tier
  - Forward collected fees to treasury contract
  - Update revenue tracking counters
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 2.4, 2.5, 7.1, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.4 Implement fee configuration management
  - Create setCardIssuanceFee function with owner restriction
  - Create setPremiumSubscriptionPrice function with owner restriction
  - Create setFreeMonthlyCardLimit function with owner restriction
  - Add validation for min/max fee bounds
  - Emit FeeConfigurationUpdated events for all changes
  - _Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2.5 Add analytics and reporting functions
  - Implement getIssuerStats function returning usage and subscription data
  - Implement getRevenueStats function returning all revenue metrics
  - Create view functions for individual revenue counters
  - Add function to get active premium issuer count
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 2.6 Add new events and error definitions
  - Define CardIssuanceFeeCollected event
  - Define SubscriptionUpgraded and SubscriptionRenewed events
  - Define FreeMonthlyLimitReset event
  - Define FeeConfigurationUpdated event
  - Create custom errors: InsufficientPayment, MonthlyLimitExceeded, SubscriptionExpired, InvalidFeeConfiguration
  - _Requirements: 1.5, 2.5, 4.5, 6.4, 8.5_

- [ ] 3. Update contract constructor and initialization
  - Modify ReputationCard constructor to accept treasury address parameter
  - Initialize default fee configuration values
  - Set initial cardIssuanceFee to 0.001 ether
  - Set initial premiumSubscriptionPrice to 0.05 ether
  - Set initial freeMonthlyCardLimit to 10
  - _Requirements: 6.1_

- [ ] 4. Implement emergency pause functionality for payments
  - Ensure existing pause mechanism blocks subscription upgrades
  - Ensure existing pause mechanism blocks card issuance with payments
  - Verify withdrawal function works during pause state
  - Add tests for pause/unpause behavior with payments
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 5. Create deployment script for monetization contracts
  - Write script to deploy Treasury contract
  - Write script to deploy upgraded ReputationCard with treasury reference
  - Add authorization of ReputationCard to update ProfileNFT scores
  - Configure initial fee values
  - Verify all contract connections
  - Output deployed addresses and configuration
  - _Requirements: All_

- [ ] 6. Build frontend subscription management component
- [ ] 6.1 Create SubscriptionManager component
  - Display current subscription tier (Free/Premium)
  - Show subscription expiration date for premium users
  - Display remaining free tier cards for current month
  - Add "Upgrade to Premium" button with price display
  - Add "Renew Subscription" button for expired premium users
  - Show subscription benefits comparison
  - _Requirements: 2.1, 2.2, 3.1, 4.1_

- [ ] 6.2 Create PaymentModal component
  - Build modal for payment confirmation
  - Display payment amount in ETH and USD equivalent
  - Show gas estimate for transaction
  - Add transaction status indicators (pending, success, error)
  - Handle MetaMask payment flow
  - Display error messages for insufficient funds or failed transactions
  - _Requirements: 1.1, 1.2, 3.2, 3.3_

- [ ] 6.3 Update IssueCardForm to handle payments
  - Add payment amount display to card issuance form
  - Integrate PaymentModal for card issuance confirmation
  - Show subscription status and limits before issuance
  - Handle InsufficientPayment errors gracefully
  - Handle MonthlyLimitExceeded errors with upgrade prompt
  - Display transaction confirmation after successful issuance
  - _Requirements: 1.1, 1.2, 1.3, 2.4_

- [ ] 7. Build admin revenue dashboard
- [ ] 7.1 Create RevenueAnalytics component
  - Display total revenue (card fees + subscriptions)
  - Show revenue breakdown chart
  - Display total cards issued counter
  - Show active premium issuers count
  - Add date range filter for revenue metrics
  - Create export functionality for financial reports
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7.2 Create PricingConfiguration component
  - Build admin panel for fee configuration
  - Add input fields for cardIssuanceFee with validation
  - Add input fields for premiumSubscriptionPrice with validation
  - Add input fields for freeMonthlyCardLimit with validation
  - Show min/max bounds for each configuration
  - Display preview of pricing changes impact
  - Add confirmation modal before applying changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7.3 Create TreasuryManagement component
  - Display current treasury balance
  - Show total received and total withdrawn statistics
  - Add withdrawal button for owner
  - Implement withdrawal amount input with max button
  - Show withdrawal transaction status
  - Display withdrawal history from events
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Create blockchain service functions for monetization
  - Add upgradeToPremium service function with payment handling
  - Add renewSubscription service function
  - Add getSubscriptionInfo service function
  - Add issueCardWithPayment service function
  - Add getRevenueStats service function for admin
  - Add withdrawFromTreasury service function for admin
  - Add updateFeeConfiguration service functions
  - Implement error handling for all payment operations
  - _Requirements: All_

- [ ] 9. Update existing components for subscription awareness
  - Modify IssuerDashboard to show subscription status
  - Update AdminPanel to include revenue analytics tab
  - Add subscription tier badge to issuer profile display
  - Show upgrade prompts when free tier limit is reached
  - Display subscription expiration warnings
  - _Requirements: 2.1, 2.2, 2.4, 4.1_

- [ ]* 10. Write comprehensive tests for monetization system
- [ ]* 10.1 Write Treasury contract unit tests
  - Test receive function accepts payments correctly
  - Test withdrawal function transfers funds to owner
  - Test withdrawal reverts for non-owner
  - Test withdrawal reverts when balance insufficient
  - Test event emissions for all operations
  - Test revenue statistics tracking
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 10.2 Write subscription management tests
  - Test new issuer initialization as free tier
  - Test upgrade to premium with correct payment
  - Test upgrade reverts with insufficient payment
  - Test subscription expiration after 30 days
  - Test renewal extends expiration correctly
  - Test free tier monthly limit enforcement
  - Test monthly limit reset after 30 days
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 10.3 Write card issuance payment tests
  - Test card issuance with correct payment succeeds
  - Test card issuance reverts with insufficient payment
  - Test payment forwarded to treasury correctly
  - Test revenue counters updated after issuance
  - Test free tier issuer can issue within limit
  - Test free tier issuer blocked beyond limit
  - Test premium tier issuer has unlimited issuance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4, 2.5, 7.5_

- [ ]* 10.4 Write fee configuration tests
  - Test owner can update card issuance fee
  - Test owner can update subscription price
  - Test owner can update free tier limit
  - Test non-owner cannot update fees
  - Test fee bounds validation
  - Test FeeConfigurationUpdated events emitted
  - Test new fees apply to subsequent transactions
  - _Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 10.5 Write integration tests for complete payment flows
  - Test end-to-end free tier issuer workflow
  - Test end-to-end premium upgrade and unlimited issuance
  - Test subscription expiration and renewal flow
  - Test revenue accumulation and withdrawal
  - Test multiple concurrent issuers with different tiers
  - Test pause functionality blocks payments correctly
  - _Requirements: All_

- [ ]* 10.6 Write frontend component tests
  - Test SubscriptionManager displays correct tier and status
  - Test PaymentModal handles payment confirmation flow
  - Test IssueCardForm integrates payment correctly
  - Test RevenueAnalytics displays metrics accurately
  - Test PricingConfiguration updates fees correctly
  - Test TreasuryManagement handles withdrawals
  - _Requirements: All frontend requirements_

- [ ] 11. Create documentation and migration guide
  - Write deployment documentation for Treasury and upgraded ReputationCard
  - Create issuer migration guide explaining new payment requirements
  - Document subscription tiers and pricing
  - Create admin guide for fee configuration and revenue management
  - Write API documentation for new contract functions
  - Add code comments explaining payment flow logic
  - _Requirements: All_

- [ ] 12. Deploy to testnet and validate
  - Deploy Treasury contract to testnet (Sepolia or Goerli)
  - Deploy upgraded ReputationCard to testnet
  - Configure initial fees and test all payment flows
  - Test subscription upgrade and renewal on testnet
  - Test admin withdrawal functionality
  - Verify all events are emitted correctly
  - Test frontend integration with testnet contracts
  - _Requirements: All_
