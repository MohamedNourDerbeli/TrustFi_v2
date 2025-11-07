# Requirements Document

## Introduction

The Monetization System enables TrustFi to generate revenue through transaction fees, issuer subscriptions, and premium features while maintaining a fair and transparent pricing model. The system will implement smart contract-based payment collection, subscription management, and revenue distribution mechanisms that align with the platform's decentralized nature.

## Glossary

- **Platform**: The TrustFi reputation system consisting of ProfileNFT and ReputationCard smart contracts
- **Platform_Owner**: The administrator account that controls the Platform and receives revenue
- **Issuer**: An authorized entity that can mint reputation cards for users
- **Card_Issuance_Fee**: A payment required when an Issuer mints a reputation card
- **Subscription_Tier**: A membership level that determines an Issuer's capabilities and pricing
- **Treasury_Contract**: A smart contract that collects and manages Platform revenue
- **Free_Tier**: A subscription level allowing limited card issuance at no cost
- **Premium_Tier**: A paid subscription level offering enhanced features and unlimited card issuance
- **Withdrawal_Function**: A contract method that allows Platform_Owner to extract collected fees
- **Fee_Rate**: The percentage or fixed amount charged per transaction

## Requirements

### Requirement 1: Transaction Fee Collection

**User Story:** As a Platform_Owner, I want to collect fees when reputation cards are issued, so that the Platform generates revenue from card issuance activity

#### Acceptance Criteria

1. WHEN an Issuer calls the card issuance function, THE Platform SHALL require payment of the Card_Issuance_Fee before minting the card
2. WHEN the Card_Issuance_Fee payment is insufficient, THE Platform SHALL revert the transaction with an error message
3. WHEN a card is successfully issued with payment, THE Platform SHALL transfer the Card_Issuance_Fee to the Treasury_Contract
4. THE Platform_Owner SHALL have the ability to update the Card_Issuance_Fee value through an administrative function
5. WHEN the Card_Issuance_Fee is updated, THE Platform SHALL emit an event containing the old fee value and new fee value

### Requirement 2: Issuer Subscription Management

**User Story:** As a Platform_Owner, I want to manage issuer subscription tiers, so that I can offer different pricing models based on usage levels

#### Acceptance Criteria

1. THE Platform SHALL support at least two Subscription_Tier levels: Free_Tier and Premium_Tier
2. WHEN an Issuer is authorized, THE Platform SHALL assign the Issuer to the Free_Tier by default
3. THE Platform SHALL store the monthly card issuance limit for each Subscription_Tier
4. WHEN an Issuer on Free_Tier attempts to issue cards beyond the monthly limit, THE Platform SHALL revert the transaction
5. WHEN an Issuer on Premium_Tier issues cards, THE Platform SHALL allow unlimited card issuance within the subscription period

### Requirement 3: Subscription Payment Processing

**User Story:** As an Issuer, I want to upgrade my subscription tier by paying the required fee, so that I can access premium features and unlimited card issuance

#### Acceptance Criteria

1. THE Platform SHALL provide a function that allows an Issuer to upgrade from Free_Tier to Premium_Tier
2. WHEN an Issuer calls the upgrade function, THE Platform SHALL require payment equal to the Premium_Tier subscription price
3. WHEN the subscription payment is successful, THE Platform SHALL update the Issuer's Subscription_Tier to Premium_Tier
4. WHEN a subscription is upgraded, THE Platform SHALL record the subscription start timestamp
5. THE Platform SHALL calculate subscription expiration as 30 days from the subscription start timestamp

### Requirement 4: Subscription Renewal and Expiration

**User Story:** As an Issuer, I want my subscription to automatically expire after the paid period, so that I only pay for the time I use premium features

#### Acceptance Criteria

1. WHEN the current timestamp exceeds the subscription expiration timestamp, THE Platform SHALL treat the Issuer as Free_Tier for card issuance limits
2. THE Platform SHALL provide a function that allows an Issuer to renew their Premium_Tier subscription
3. WHEN an Issuer renews their subscription, THE Platform SHALL require payment equal to the Premium_Tier subscription price
4. WHEN renewal payment is successful, THE Platform SHALL extend the subscription expiration by 30 days from the current expiration date
5. THE Platform SHALL emit an event when a subscription is renewed containing the Issuer address and new expiration timestamp

### Requirement 5: Revenue Withdrawal

**User Story:** As a Platform_Owner, I want to withdraw collected fees from the treasury, so that I can access the Platform's revenue

#### Acceptance Criteria

1. THE Platform SHALL provide a Withdrawal_Function accessible only to the Platform_Owner
2. WHEN the Platform_Owner calls the Withdrawal_Function, THE Platform SHALL transfer the entire Treasury_Contract balance to the Platform_Owner address
3. WHEN a withdrawal is successful, THE Platform SHALL emit an event containing the withdrawn amount and recipient address
4. WHEN the Treasury_Contract balance is zero, THE Platform SHALL revert the withdrawal transaction
5. THE Platform SHALL provide a view function that returns the current Treasury_Contract balance

### Requirement 6: Fee Configuration Management

**User Story:** As a Platform_Owner, I want to configure different fee structures, so that I can adjust pricing based on market conditions and business strategy

#### Acceptance Criteria

1. THE Platform SHALL store configurable values for Card_Issuance_Fee, Premium_Tier subscription price, and Free_Tier monthly card limit
2. THE Platform SHALL provide administrative functions that allow Platform_Owner to update each fee configuration value
3. WHEN a fee configuration is updated, THE Platform SHALL apply the new value to all subsequent transactions
4. WHEN a fee configuration is updated, THE Platform SHALL emit an event containing the configuration name, old value, and new value
5. THE Platform SHALL enforce minimum and maximum bounds on fee values to prevent misconfiguration

### Requirement 7: Usage Tracking and Analytics

**User Story:** As a Platform_Owner, I want to track revenue metrics and issuer activity, so that I can make informed business decisions

#### Acceptance Criteria

1. THE Platform SHALL maintain a counter of total cards issued per Issuer
2. THE Platform SHALL maintain a counter of total revenue collected from card issuance fees
3. THE Platform SHALL maintain a counter of total revenue collected from subscription fees
4. THE Platform SHALL provide view functions that return these metrics for any Issuer address
5. WHEN a card is issued or subscription is purchased, THE Platform SHALL increment the appropriate counters

### Requirement 8: Free Tier Card Limit Reset

**User Story:** As an Issuer on the free tier, I want my monthly card limit to reset each month, so that I can continue issuing cards without upgrading

#### Acceptance Criteria

1. THE Platform SHALL track the timestamp of the last card issuance for each Free_Tier Issuer
2. WHEN 30 days have elapsed since the last limit reset, THE Platform SHALL reset the Issuer's monthly card issuance counter to zero
3. WHEN an Issuer issues a card, THE Platform SHALL check if a reset is needed before validating the card limit
4. THE Platform SHALL update the last reset timestamp when a reset occurs
5. THE Platform SHALL emit an event when a Free_Tier limit is reset containing the Issuer address and reset timestamp

### Requirement 9: Refund Protection

**User Story:** As an Issuer, I want assurance that my subscription payment is non-refundable but fairly priced, so that I understand the payment terms

#### Acceptance Criteria

1. THE Platform SHALL not provide refund functionality for subscription payments
2. THE Platform SHALL clearly document in contract comments that subscriptions are non-refundable
3. WHEN a subscription expires, THE Platform SHALL not automatically charge for renewal
4. THE Platform SHALL allow Issuers to continue using Free_Tier features after Premium_Tier expiration
5. THE Platform SHALL maintain the Issuer's historical data and card issuance records regardless of subscription status

### Requirement 10: Emergency Pause for Payments

**User Story:** As a Platform_Owner, I want to pause payment collection during emergencies, so that I can protect users if a security issue is discovered

#### Acceptance Criteria

1. WHEN the Platform is paused, THE Platform SHALL continue to reject card issuance attempts
2. WHEN the Platform is paused, THE Platform SHALL reject subscription upgrade and renewal attempts
3. WHEN the Platform is unpaused, THE Platform SHALL resume normal payment collection operations
4. THE Platform SHALL allow Platform_Owner to withdraw funds even when the Platform is paused
5. THE Platform SHALL emit events when payment operations are paused or unpaused
