# Deployment Status

## ✅ Successfully Deployed

The `dynamic-metadata` Edge Function has been deployed to Supabase!

**Project**: kuqfccqirhwaqjkiglmf  
**Function URL**: https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/{tokenId}  
**Dashboard**: https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/functions

## Environment Variables Set

✅ `REPUTATION_CARD_CONTRACT_ADDRESS` = `0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591`  
✅ `KUSAMA_SVG_CONTRACT_ADDRESS` = `0x4EC70469102122D27011d3d7179FF1612F1d33DB`  
✅ `MAIN_CHAIN_RPC_URL` = `https://api-moonbase-alpha.n.dwellir.com/1350b635-a82e-4e02-b336-7de9dba9108f`

## Important Notes

### Contract Deployment Location

⚠️ **Current Setup**: The KusamaSVGArt contract is currently deployed on **Moonbase Alpha** (testnet), not Kusama Hub.

- **KusamaSVGArt Address**: `0x4EC70469102122D27011d3d7179FF1612F1d33DB`
- **Network**: Moonbase Alpha (Chain ID: 1287)
- **Deployment Details**: See `contracts/MOONBASE_DEPLOYMENT_SUCCESS.md`

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

✅ **Successfully tested with Profile ID 1**
- Reputation score retrieved: 20
- SVG generated with correct color palette
- Metadata returned in proper NFT format
- See TEST_RESULTS.md for full details
