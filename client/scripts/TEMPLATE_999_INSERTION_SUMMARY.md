# Template 999 Insertion Summary

## Task Completed: 7.2 Execute template insertion

**Date:** November 15, 2025  
**Status:** ✅ Successfully Completed

## What Was Done

Successfully inserted Template 999 (Kusama Living Profile) into the Supabase `collectibles` table and verified the record is correctly configured and queryable by the frontend.

## Scripts Created

### 1. `insert-template-999.mjs`
- **Purpose:** Insert the Kusama Living Profile collectible into the database
- **Location:** `client/scripts/insert-template-999.mjs`
- **Features:**
  - Checks for existing records to prevent duplicates
  - Inserts complete collectible configuration
  - Validates insertion success
  - Provides clear success/error messages

### 2. `verify-template-999-collectible.mjs`
- **Purpose:** Verify the collectible was inserted correctly
- **Location:** `client/scripts/verify-template-999-collectible.mjs`
- **Features:**
  - Fetches and displays complete collectible details
  - Runs 7 validation checks against requirements
  - Shows all active collectibles for context
  - Confirms configuration matches specifications

### 3. `test-frontend-query.mjs`
- **Purpose:** Test that the frontend can query the collectible
- **Location:** `client/scripts/test-frontend-query.mjs`
- **Features:**
  - Simulates the `useCollectibles` hook query
  - Verifies Template 999 appears in results
  - Shows how the frontend will display the data
  - Validates tokenURI construction

## Database Record Details

**Table:** `collectibles`  
**Record ID:** `3a027830-817e-41bb-a7a8-7a480ebb382c`

### Configuration

| Field | Value |
|-------|-------|
| **template_id** | 999 |
| **title** | Kusama Living Profile |
| **description** | A dynamic NFT collectible that reflects your real-time on-chain reputation score, powered by Kusama EVM. The visual representation evolves as you earn more reputation through community contributions and achievements. |
| **image_url** | https://kuqfccqirhwaqjkiglmf.supabase.co/storage/v1/object/public/collectibles/kusama-living-profile-placeholder.png |
| **banner_url** | https://kuqfccqirhwaqjkiglmf.supabase.co/storage/v1/object/public/collectibles/kusama-living-profile-banner.png |
| **token_uri** | https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/ |
| **claim_type** | signature |
| **requirements** | `{ "requiresProfile": true, "description": "You must have a TrustFi profile to claim this dynamic collectible" }` |
| **created_by** | 0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5 (TrustFi Core Team) |
| **is_active** | true |

## Validation Results

All 7 validation checks passed:

- ✅ Template ID is 999
- ✅ Title is "Kusama Living Profile"
- ✅ Created by TrustFi Core Team
- ✅ Claim type is "signature"
- ✅ Token URI points to dynamic-metadata function
- ✅ Is active
- ✅ Requires profile

## Requirements Satisfied

This task satisfies the following requirements from the design document:

- **Requirement 5.1:** Template record contains template_id 999
- **Requirement 5.2:** Issuer name is "TrustFi Core Team" (via created_by address)
- **Requirement 5.3:** Title is "Kusama Living Profile"
- **Requirement 5.4:** Description explains the dynamic nature
- **Requirement 5.5:** Tier value 3 (will be fetched from on-chain template)
- **Requirement 5.6:** token_uri points to deployed Edge Function URL
- **Requirement 5.7:** Placeholder image_url included

## Frontend Integration

The collectible is now ready for frontend integration:

1. **Visibility:** Template 999 appears in the collectibles query
2. **Display:** Title, description, and images are configured
3. **Claiming:** Claim type is set to "signature" for backend-signed claims
4. **Dynamic URI:** Token URI prefix is correctly set to the Edge Function endpoint
5. **Requirements:** Profile requirement is properly configured

### Token URI Construction

When a user with profile ID `123` claims this collectible, the tokenURI will be:
```
https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/123
```

This endpoint will:
1. Query the user's reputation score from the ReputationCard contract
2. Call the KusamaSVGArt contract to generate dynamic SVG art
3. Return JSON metadata with the current reputation visualization

## How to Run Scripts

```bash
# Insert template (idempotent - safe to run multiple times)
node client/scripts/insert-template-999.mjs

# Verify insertion
node client/scripts/verify-template-999-collectible.mjs

# Test frontend query
node client/scripts/test-frontend-query.mjs
```

## Next Steps

With Template 999 successfully inserted into the database, the next tasks are:

1. **Task 8:** Update CollectiblesPage component to handle dynamic metadata
   - Add template 999 detection logic
   - Implement dynamic URI construction
   - Add visual indicators for dynamic collectibles
   - Handle profile requirement validation

2. **Task 9:** Create deployment documentation
   - Document the complete setup process
   - Include troubleshooting guides

3. **Task 10:** Integration testing
   - Test complete claim flow
   - Verify dynamic metadata updates
   - Test error scenarios

## Notes

- The collectible is currently set to `is_active: true` and will appear in the UI immediately
- The image and banner URLs point to Supabase storage (placeholders need to be uploaded)
- The on-chain template (template ID 999) must be created on the ReputationCard contract for claiming to work
- The dynamic-metadata Edge Function must be deployed and configured with the correct contract addresses

## Troubleshooting

If the collectible doesn't appear in the frontend:

1. Check that `is_active` is `true`: Run verify script
2. Verify the frontend is querying the correct Supabase project
3. Check browser console for any query errors
4. Ensure the on-chain template 999 exists on the ReputationCard contract
5. Verify the dynamic-metadata Edge Function is deployed and accessible

## Success Criteria Met

- ✅ Script executed successfully against Supabase database
- ✅ Record created with all correct values
- ✅ All validation checks passed
- ✅ Frontend query test passed
- ✅ Template 999 is visible in active collectibles list
- ✅ Token URI prefix correctly points to Edge Function
- ✅ Requirements properly configured

**Task 7.2 is complete!** 🎉
