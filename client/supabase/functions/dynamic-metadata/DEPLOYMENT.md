# Deployment Status

## ✅ Successfully Deployed

The `dynamic-metadata` Edge Function has been deployed to Supabase!

**Project**: kuqfccqirhwaqjkiglmf  
**Function URL**: https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/{tokenId}  
**Dashboard**: https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/functions

## Environment Variables Set

✅ `REPUTATION_CARD_CONTRACT_ADDRESS` = `0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2` (Updated Nov 16, 2025)  
✅ `KUSAMA_SVG_CONTRACT_ADDRESS` = `0xF320656B42F663508CE06deE19C04b7C4Dc2FB89` (Updated Nov 16, 2025)  
✅ `MAIN_CHAIN_RPC_URL` = `https://rpc.api.moonbase.moonbeam.network`

## Important Notes

### Contract Deployment Location

✅ **Current Setup**: All contracts deployed on **Moonbase Alpha** (testnet)

- **ProfileNFT Address**: `0xe9721a33CB81D26013E0017b12285Cc2c02140E9`
- **ReputationCard Address**: `0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2`
- **KusamaSVGArt Address**: `0xF320656B42F663508CE06deE19C04b7C4Dc2FB89`
- **Network**: Moonbase Alpha (Chain ID: 1287)
- **Deployment Details**: See `DEPLOYMENT_COMPLETE.md` in project root

### New Features (Nov 16, 2025)

✨ **getCardsDetailForProfile()** - New function in ReputationCard contract
- Returns all card details in a single call (cardIds, templateIds, tiers, issuers)
- No gas cost (view function)
- Eliminates need for multiple contract calls or Supabase queries

### For Production

To use this in production with Kusama Hub:

1. Deploy the KusamaSVGArt contract to Kusama Hub (Chain ID: 420420418)
2. Update the `KUSAMA_SVG_CONTRACT_ADDRESS` environment variable
3. Update the `KUSAMA_HUB_RPC` constant in the function code to point to Kusama Hub

**Current Code**:
```typescript
const KUSAMA_HUB_RPC = "https://kusama-asset-hub-eth-rpc.polkadot.io";
```

**For Testnet** (if both contracts are on Moonbase):
```typescript
const KUSAMA_HUB_RPC = Deno.env.get("MAIN_CHAIN_RPC_URL") || "https://rpc.api.moonbase.moonbeam.network";
```

## Testing

### With Authentication

```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
```

### Example with the project's anon key

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU" \
  https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
```

## Redeployment

To redeploy after making changes:

```bash
cd client
npx supabase functions deploy dynamic-metadata
```

## Viewing Logs

Check the Supabase Dashboard for function logs:
https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/functions/dynamic-metadata/logs

## Next Steps

1. ✅ Function deployed
2. ✅ Environment variables configured
3. ✅ Function tested and working (see TEST_RESULTS.md)
4. ✅ Updated to use Moonbase Alpha for both contracts
5. ⚠️ Consider deploying KusamaSVGArt to Kusama Hub for production
6. ✅ Ready for integration with ProfileNFT contract

## Test Results

✅ **Successfully tested with Profile ID 1** (Updated Nov 16, 2025)
- Reputation score retrieved: 0 (new deployment, no cards yet)
- SVG generated with correct color palette (gray tier)
- Metadata returned in proper NFT format
- Function working with new contract addresses
- See TEST_RESULTS.md for full details

### Latest Test Response
```json
{
  "name": "Kusama Living Profile #1",
  "description": "A living Kusama profile image that evolves with a TrustFi reputation score.",
  "image": "data:image/svg+xml;base64,...",
  "attributes": [{"trait_type": "Score", "value": 0}]
}
```
