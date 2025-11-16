# Update Supabase Edge Function Environment Variables

## New Contract Addresses (Moonbase Alpha)

After the latest deployment, update the following environment variables in Supabase:

### Required Updates

```bash
REPUTATION_CARD_CONTRACT_ADDRESS=0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2
KUSAMA_SVG_CONTRACT_ADDRESS=0xF320656B42F663508CE06deE19C04b7C4Dc2FB89
MAIN_CHAIN_RPC_URL=https://rpc.api.moonbase.moonbeam.network
```

## How to Update

### Option 1: Using Supabase CLI

```bash
# Set environment variables
npx supabase secrets set REPUTATION_CARD_CONTRACT_ADDRESS=0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2
npx supabase secrets set KUSAMA_SVG_CONTRACT_ADDRESS=0xF320656B42F663508CE06deE19C04b7C4Dc2FB89
npx supabase secrets set MAIN_CHAIN_RPC_URL=https://rpc.api.moonbase.moonbeam.network

# Verify secrets
npx supabase secrets list
```

### Option 2: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/settings/functions
2. Click on "Edge Functions" in the sidebar
3. Click on "Manage secrets"
4. Update the following secrets:
   - `REPUTATION_CARD_CONTRACT_ADDRESS` → `0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2`
   - `KUSAMA_SVG_CONTRACT_ADDRESS` → `0xF320656B42F663508CE06deE19C04b7C4Dc2FB89`
   - `MAIN_CHAIN_RPC_URL` → `https://rpc.api.moonbase.moonbeam.network`

## After Updating

### Redeploy the Function

```bash
cd client
npx supabase functions deploy dynamic-metadata
```

### Test the Function

```bash
# Test with profile ID 1
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU" \
  https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
```

## What Changed

### Old Addresses (Previous Deployment)
- ReputationCard: `0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591`
- KusamaSVGArt: `0x4EC70469102122D27011d3d7179FF1612F1d33DB`

### New Addresses (Current Deployment)
- ReputationCard: `0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2` ✨ **New function: getCardsDetailForProfile**
- KusamaSVGArt: `0xF320656B42F663508CE06deE19C04b7C4Dc2FB89`

## Benefits of New Deployment

1. **getCardsDetailForProfile()** - New function in ReputationCard
   - Returns all card details in one call
   - No gas cost (view function)
   - More efficient than multiple queries

2. **Fresh Deployment** - Clean state
   - Template 999 created and verified
   - All contracts properly configured
   - Ready for production use

## Verification

After updating and redeploying, verify:

1. ✅ Function deploys without errors
2. ✅ Environment variables are set correctly
3. ✅ Function returns valid metadata for test profile
4. ✅ SVG generation works with new contract
5. ✅ Reputation score calculation works

## Troubleshooting

### If function fails after update:

1. Check environment variables are set:
   ```bash
   npx supabase secrets list
   ```

2. Check function logs:
   https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/functions/dynamic-metadata/logs

3. Verify contract addresses on Moonbase:
   - [ReputationCard](https://moonbase.moonscan.io/address/0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2)
   - [KusamaSVGArt](https://moonbase.moonscan.io/address/0xF320656B42F663508CE06deE19C04b7C4Dc2FB89)

## Next Steps

After updating environment variables:

1. ✅ Update environment variables
2. ✅ Redeploy function
3. ✅ Test with sample profile
4. ⏳ Update database template records
5. ⏳ Test end-to-end card claiming flow
