# Monetization System Design Document

## Overview

The Monetization System introduces revenue generation capabilities to TrustFi through a multi-tiered approach combining transaction fees, subscription models, and premium features. The design extends the existing ReputationCard contract with payment processing logic and introduces a new Treasury contract for secure fund management. The system maintains backward compatibility while adding new payment-gated functionality.

The architecture follows a separation of concerns pattern where the ReputationCard contract handles business logic and payment validation, while the Treasury contract manages fund custody and withdrawal operations. This design ensures security, upgradeability, and clear audit trails for all financial transactions.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  (React + Ethers.js - Payment UI & Subscription Management) │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ issueCard(payable)            │ upgradeTier(payable)
             │                                │
┌────────────▼────────────────────────────────▼───────────────┐
│              ReputationCard Contract                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Payment Validation & Fee Collection                  │  │
│  │  - Check subscription tier & limits                   │  │
│  │  - Validate payment amounts                           │  │
│  │  - Forward fees to Treasury                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Subscription Management                              │  │
│  │  - Track issuer tiers (Free/Premium)                  │  │
│  │  - Monitor usage limits                               │  │
│  │  - Handle upgrades & renewals                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────┘
             │
             │ forward fees
             │
┌────────────▼────────────────────────────────────────────────┐
│                    Treasury Contract                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Fund Management                                      │  │
│  │  - Receive payments from ReputationCard              │  │
│  │  - Store accumulated revenue                          │  │
│  │  - Process owner withdrawals                          │  │
│  │  - Emit financial events                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Contract Interaction Flow

**Card Issuance with Fee:**
```
Issuer → issueCard(profileId, ...) + ETH
  ↓
ReputationCard: Check tier & limits
  ↓
ReputationCard: Validate payment amount
  ↓
ReputationCard: Forward fee to Treasury
  ↓
ReputationCard: Mint card NFT
  ↓
Emit CardIssued + FeeCollected events
```

**Subscription Upgrade:**
```
Issuer → upgradeToPremium() + ETH
  ↓
ReputationCard: Validate subscription price
  ↓
ReputationCard: Forward payment to Treasury
  ↓
ReputationCard: Update tier & expiration
  ↓
Emit SubscriptionUpgraded event
```

## Components and Interfaces

### 1. Treasury Contract

**Purpose:** Secure custody of platform revenue with owner-only withdrawal capabilities.

**State Variables:**
```solidity
address public immutable owner;
uint256 public totalReceived;
uint256 public totalWithdrawn;
```

**Key Functions:**

```solidity
// Receive payments from ReputationCard contract
receive() external payable;

// Owner withdraws accumulated funds
function withdraw(uint256 amount) external onlyOwner;

// View current balance
function getBalance() external view returns (uint256);

// View revenue statistics
function getRevenueStats() external view returns (uint256 received, uint256 withdrawn);
```

**Events:**
```solidity
event FundsReceived(address indexed from, uint256 amount, string source);
event FundsWithdrawn(address indexed to, uint256 amount);
```

**Security Considerations:**
- Immutable owner prevents ownership transfer attacks
- Reentrancy guard on withdrawal function
- Balance checks before withdrawal
- Comprehensive event logging for audit trails

### 2. Enhanced ReputationCard Contract

**New State Variables:**

```solidity
// Pricing configuration
uint256 public cardIssuanceFee;
uint256 public premiumSubscriptionPrice;
uint256 public freeMonthlyCardLimit;

// Treasury reference
address public immutable treasury;

// Subscription tracking
enum SubscriptionTier { Free, Premium }

struct IssuerSubscription {
    SubscriptionTier tier;
    uint256 subscriptionExpiry;
    uint256 cardsIssuedThisMonth;
    uint256 lastResetTimestamp;
}

mapping(address => IssuerSubscription) public issuerSubscriptions;

// Revenue tracking
uint256 public totalCardFeeRevenue;
uint256 public totalSubscriptionRevenue;
mapping(address => uint256) public issuerTotalCardsIssued;
```

**Modified Functions:**

```solidity
// Enhanced issueCard with payment requirement
function issueCard(
    uint256 profileId,
    string memory category,
    string memory description,
    uint256 value
) external payable whenNotPaused returns (uint256);

// Internal helper to check and enforce limits
function _checkIssuerLimits(address issuer) internal;

// Internal helper to process payment
function _processCardIssuanceFee() internal;
```

**New Functions:**

```solidity
// Subscription management
function upgradeToPremium() external payable;
function renewPremiumSubscription() external payable;
function getSubscriptionInfo(address issuer) external view returns (IssuerSubscription memory);
function isSubscriptionActive(address issuer) external view returns (bool);

// Fee configuration (owner only)
function setCardIssuanceFee(uint256 newFee) external onlyOwner;
function setPremiumSubscriptionPrice(uint256 newPrice) external onlyOwner;
function setFreeMonthlyCardLimit(uint256 newLimit) external onlyOwner;

// Analytics
function getIssuerStats(address issuer) external view returns (
    uint256 totalCards,
    uint256 cardsThisMonth,
    SubscriptionTier tier,
    uint256 subscriptionExpiry
);
function getRevenueStats() external view returns (
    uint256 cardFeeRevenue,
    uint256 subscriptionRevenue,
    uint256 totalRevenue
);
```

**New Events:**

```solidity
event CardIssuanceFeeCollected(address indexed issuer, uint256 amount);
event SubscriptionUpgraded(address indexed issuer, uint256 expiry);
event SubscriptionRenewed(address indexed issuer, uint256 newExpiry);
event FreeMonthlyLimitReset(address indexed issuer, uint256 timestamp);
event FeeConfigurationUpdated(string configName, uint256 oldValue, uint256 newValue);
```

**New Errors:**

```solidity
error InsufficientPayment(uint256 required, uint256 provided);
error MonthlyLimitExceeded(uint256 limit, uint256 attempted);
error SubscriptionExpired(uint256 expiry);
error InvalidFeeConfiguration(string reason);
```

### 3. Frontend Payment Components

**New React Components:**

**SubscriptionManager.tsx**
- Display current subscription tier and status
- Show remaining free tier cards for the month
- Upgrade/renew subscription buttons with price display
- Subscription expiration countdown

**PaymentModal.tsx**
- Confirm payment amounts before transactions
- Display gas estimates
- Show transaction status and confirmations
- Handle payment errors gracefully

**RevenueAnalytics.tsx** (Admin only)
- Display total revenue metrics
- Show revenue breakdown (cards vs subscriptions)
- List top issuers by activity
- Export financial reports

**PricingConfiguration.tsx** (Admin only)
- Update card issuance fee
- Modify subscription pricing
- Adjust free tier limits
- Preview impact of pricing changes

## Data Models

### IssuerSubscription Structure

```solidity
struct IssuerSubscription {
    SubscriptionTier tier;           // Current subscription level
    uint256 subscriptionExpiry;      // Unix timestamp when premium expires
    uint256 cardsIssuedThisMonth;    // Counter for free tier limit
    uint256 lastResetTimestamp;      // Last time monthly counter was reset
}
```

**State Transitions:**

```
New Issuer → Free Tier (default)
  ↓
Free Tier → Premium Tier (via upgradeToPremium + payment)
  ↓
Premium Tier → Expired Premium (after 30 days)
  ↓
Expired Premium → Free Tier (automatic, no payment)
  ↓
Free Tier → Premium Tier (via renewPremiumSubscription + payment)
```

### Fee Configuration Model

```solidity
struct FeeConfiguration {
    uint256 cardIssuanceFee;          // Fee per card (in wei)
    uint256 premiumSubscriptionPrice;  // Monthly premium cost (in wei)
    uint256 freeMonthlyCardLimit;     // Max cards for free tier
    uint256 minCardFee;               // Minimum allowed card fee
    uint256 maxCardFee;               // Maximum allowed card fee
    uint256 minSubscriptionPrice;     // Minimum subscription price
    uint256 maxSubscriptionPrice;     // Maximum subscription price
}
```

**Validation Rules:**
- Card issuance fee: 0.0001 ETH to 0.1 ETH
- Premium subscription: 0.01 ETH to 1 ETH
- Free monthly limit: 1 to 100 cards

### Revenue Tracking Model

```solidity
struct RevenueMetrics {
    uint256 totalCardFeeRevenue;
    uint256 totalSubscriptionRevenue;
    uint256 totalCardsIssued;
    uint256 activePremiumIssuers;
    uint256 totalIssuers;
}
```

## Error Handling

### Payment Validation Errors

**InsufficientPayment**
- Trigger: msg.value < required amount
- User Action: Retry with correct payment amount
- Frontend: Display required amount clearly

**MonthlyLimitExceeded**
- Trigger: Free tier issuer exceeds monthly card limit
- User Action: Upgrade to premium or wait for monthly reset
- Frontend: Show upgrade prompt with benefits

**SubscriptionExpired**
- Trigger: Premium issuer's subscription has expired
- User Action: Renew subscription to continue unlimited issuance
- Frontend: Display renewal prompt with expiration date

### Configuration Errors

**InvalidFeeConfiguration**
- Trigger: Owner sets fee outside allowed bounds
- User Action: Set fee within valid range
- Frontend: Show min/max bounds in admin panel

### Transaction Failures

**Failed Payment Transfer**
- Scenario: Treasury contract unreachable or reverts
- Handling: Revert entire transaction, no card minted
- Recovery: Check treasury contract status, retry

**Insufficient Gas**
- Scenario: User provides insufficient gas for payment + minting
- Handling: Transaction reverts before any state changes
- Recovery: Estimate gas properly in frontend

## Testing Strategy

### Unit Tests

**Treasury Contract Tests:**
```javascript
describe("Treasury", () => {
  it("should receive payments and update totalReceived");
  it("should allow owner to withdraw funds");
  it("should prevent non-owner withdrawals");
  it("should revert withdrawal when balance insufficient");
  it("should emit FundsReceived and FundsWithdrawn events");
  it("should track revenue statistics accurately");
});
```

**Payment Validation Tests:**
```javascript
describe("Card Issuance Payments", () => {
  it("should accept correct payment and issue card");
  it("should revert when payment is insufficient");
  it("should forward payment to treasury");
  it("should update revenue counters");
  it("should emit CardIssuanceFeeCollected event");
});
```

**Subscription Management Tests:**
```javascript
describe("Subscription Tiers", () => {
  it("should initialize new issuers as free tier");
  it("should upgrade to premium with correct payment");
  it("should enforce free tier monthly limits");
  it("should allow unlimited cards for premium tier");
  it("should expire premium subscriptions after 30 days");
  it("should reset free tier limits monthly");
  it("should handle subscription renewals correctly");
});
```

**Fee Configuration Tests:**
```javascript
describe("Fee Management", () => {
  it("should allow owner to update card issuance fee");
  it("should allow owner to update subscription price");
  it("should enforce min/max bounds on fees");
  it("should emit FeeConfigurationUpdated events");
  it("should apply new fees to subsequent transactions");
});
```

### Integration Tests

**End-to-End Payment Flow:**
```javascript
describe("Complete Payment Flow", () => {
  it("should handle free tier issuer issuing cards within limit");
  it("should prevent free tier issuer from exceeding limit");
  it("should allow upgrade to premium and unlimited issuance");
  it("should collect fees and accumulate in treasury");
  it("should allow owner to withdraw accumulated revenue");
  it("should handle subscription expiration and renewal");
});
```

**Multi-Issuer Scenarios:**
```javascript
describe("Multiple Issuers", () => {
  it("should track subscriptions independently per issuer");
  it("should handle concurrent card issuance with payments");
  it("should maintain accurate revenue attribution");
  it("should reset free tier limits independently");
});
```

### Frontend Tests

**Payment Component Tests:**
- Subscription upgrade flow with MetaMask
- Payment amount validation
- Transaction confirmation handling
- Error message display
- Gas estimation accuracy

**Admin Panel Tests:**
- Fee configuration updates
- Revenue analytics display
- Withdrawal functionality
- Access control enforcement

### Security Tests

**Attack Vectors:**
```javascript
describe("Security", () => {
  it("should prevent reentrancy attacks on withdrawal");
  it("should prevent payment bypass attempts");
  it("should prevent unauthorized fee configuration changes");
  it("should handle failed treasury transfers safely");
  it("should prevent integer overflow in revenue tracking");
});
```

**Access Control:**
```javascript
describe("Authorization", () => {
  it("should restrict withdrawal to owner only");
  it("should restrict fee configuration to owner only");
  it("should allow any authorized issuer to upgrade subscription");
  it("should prevent unauthorized card issuance");
});
```

## Implementation Considerations

### Gas Optimization

**Strategies:**
- Use `uint256` for counters (cheaper than smaller types)
- Pack subscription data into single storage slot where possible
- Batch fee configuration updates
- Minimize storage writes in hot paths (card issuance)
- Use events for historical data instead of storage arrays

**Estimated Gas Costs:**
- Card issuance with payment: ~150,000 gas
- Subscription upgrade: ~80,000 gas
- Fee configuration update: ~45,000 gas
- Treasury withdrawal: ~35,000 gas

### Upgrade Path

**Phase 1: Deploy Treasury**
- Deploy new Treasury contract
- Transfer ownership to platform owner
- Test receive and withdrawal functions

**Phase 2: Upgrade ReputationCard**
- Deploy new ReputationCard with monetization features
- Initialize with treasury address
- Set initial fee configuration
- Migrate issuer authorizations from old contract

**Phase 3: Frontend Integration**
- Add payment UI components
- Integrate subscription management
- Build admin revenue dashboard
- Update documentation

**Phase 4: Migration**
- Announce upgrade to issuers
- Provide migration guide
- Monitor initial transactions
- Adjust fees based on usage data

### Backward Compatibility

**Considerations:**
- Existing authorized issuers automatically get free tier
- Historical cards remain valid and unchanged
- ProfileNFT contract requires no modifications
- Old frontend can still view cards (read-only)

**Breaking Changes:**
- `issueCard` function signature changes (adds `payable`)
- New subscription requirements for unlimited issuance
- Payment required for card issuance

### Pricing Recommendations

**Initial Configuration:**
```solidity
cardIssuanceFee = 0.001 ether;           // ~$2-3 per card
premiumSubscriptionPrice = 0.05 ether;   // ~$100-150/month
freeMonthlyCardLimit = 10;               // 10 free cards/month
```

**Rationale:**
- Card fee low enough for individual issuers
- Premium tier attractive for organizations (>10 cards/month)
- Free tier enables experimentation and onboarding
- Prices adjustable based on ETH/USD rate

### Monitoring and Analytics

**Key Metrics to Track:**
- Daily/monthly revenue (card fees + subscriptions)
- Conversion rate (free → premium)
- Average cards per issuer
- Subscription renewal rate
- Revenue per issuer
- Gas costs vs revenue

**Dashboard Requirements:**
- Real-time revenue counter
- Issuer tier distribution chart
- Card issuance volume graph
- Top issuers leaderboard
- Subscription expiration calendar

### Future Enhancements

**Potential Features:**
- Annual subscription discount (15% off)
- Enterprise tier with custom pricing
- Referral rewards for bringing new issuers
- Volume discounts for high-activity issuers
- Staking mechanism for reduced fees
- DAO governance for fee adjustments
- Multi-token payment support (USDC, DAI)
- Automated fee adjustment based on gas prices
