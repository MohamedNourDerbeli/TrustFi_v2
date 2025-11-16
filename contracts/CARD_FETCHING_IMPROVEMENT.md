# Card Fetching Improvement

## Problem
Previously, the frontend was fetching card IDs from the ProfileNFT contract, then querying Supabase to get additional card details (template ID, tier, issuer). This created a dependency on off-chain data.

## Solution
Added a new view function `getCardsDetailForProfile` to the ReputationCard contract that returns all card details in a single call without consuming gas.

## Changes Made

### 1. Smart Contract (ReputationCard.sol)

Added new view function:

```solidity
function getCardsDetailForProfile(uint256 profileId)
    external
    view
    returns (
        uint256[] memory cardIds,
        uint256[] memory templateIds,
        uint8[] memory tiers,
        address[] memory issuers
    )
```

This function:
- Gets all card IDs for a profile from ProfileNFT
- Returns detailed information for each card (template ID, tier, issuer)
- Is a view function (no gas cost when called externally)
- Returns all data in a single call (more efficient)

### 2. Frontend Hooks

Updated both `useProfile.ts` and `useProfileQuery.ts` to:
- Call `getCardsDetailForProfile` instead of `getCardsForProfile`
- Remove Supabase dependency for card data
- Get tier and issuer information directly from the contract

## Benefits

1. **No Supabase Dependency**: Card data comes directly from the blockchain
2. **Single Contract Call**: More efficient than multiple calls
3. **No Gas Cost**: View function is free to call
4. **Always Accurate**: Data comes from the source of truth (blockchain)
5. **Simpler Code**: No need to sync Supabase with contract state

## Migration Notes

- The contract needs to be redeployed with the new function
- Frontend will automatically use the new function once deployed
- No breaking changes to existing functionality
- Supabase `claims_log` table can still be used for analytics/history if needed
