# ✅ Supabase Edge Function Update Complete

## Date
November 16, 2025

## Summary

Successfully updated the `dynamic-metadata` Edge Function with new contract addresses from the latest deployment.

## Updated Environment Variables

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `REPUTATION_CARD_CONTRACT_ADDRESS` | `0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591` | `0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2` ✨ |
| `KUSAMA_SVG_CONTRACT_ADDRESS` | `0x4EC70469102122D27011d3d7179FF1612F1d33DB` | `0xF320656B42F663508CE06deE19C04b7C4Dc2FB89` |
| `MAIN_CHAIN_RPC_URL` | `https://api-moonbase-alpha.n.dwellir.com/...` | `https://rpc.api.moonbase.moonbeam.network` |

## Actions Performed

1. ✅ Updated `REPUTATION_CARD_CONTRACT_ADDRESS` secret
2. ✅ Updated `KUSAMA_SVG_CONTRACT_ADDRESS` secret
3. ✅ Updated `MAIN_CHAIN_RPC_URL` secret
4. ✅ Redeployed `dynamic-metadata` function
5. ✅ Tested function with profile ID 1
6. ✅ Verified metadata generation works

## Test Results

### Request
```bash
GET https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
Authorization: Bearer <anon_key>
```

### Response
```json
{
  "name": "Kusama Living Profile #1",
  "description": "A living Kusama profile image that evolves with a TrustFi reputation score.",
  "image": "data:image/svg+xml;base64,...",
  "attributes": [
    {
      "trait_type": "Score",
      "value": 0
    }
  ]
}
```

✅ **Status**: Working perfectly with new contracts!

## New Contract Features

### ReputationCard (0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2)

**New Function**: `getCardsDetailForProfile(uint256 profileId)`
- Returns: `(uint256[] cardIds, uint256[] templateIds, uint8[] tiers, address[] issuers)`
- Type: View function (no gas cost)
- Benefit: Single call to get all card details instead of multiple queries

This function is now available for the frontend to use, eliminating the need for Supabase queries to get card details.

### KusamaSVGArt (0xF320656B42F663508CE06deE19C04b7C4Dc2FB89)

Fresh deployment with same functionality:
- Dynamic SVG generation based on reputation score
- Score-based color tiers
- On-chain metadata generation

## Contract Addresses (All on Moonbase Alpha)

```
ProfileNFT:       0xe9721a33CB81D26013E0017b12285Cc2c02140E9
ReputationCard:   0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2
KusamaSVGArt:     0xF320656B42F663508CE06deE19C04b7C4Dc2FB89
```

## Template Status

### Template 999 - Kusama Living Profile
- ✅ Created on new ReputationCard contract
- Tier: 3 (200 points per card)
- Max Supply: Unlimited
- Status: Active and ready for use

## Function URL

```
https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/{tokenId}
```

## Dashboard Links

- **Functions Dashboard**: https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/functions
- **Function Logs**: https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/functions/dynamic-metadata/logs
- **Secrets Management**: https://supabase.com/dashboard/project/kuqfccqirhwaqjkiglmf/settings/functions

## Verification

All systems verified and working:
- ✅ Environment variables updated
- ✅ Function redeployed successfully
- ✅ Test request returns valid metadata
- ✅ SVG generation working
- ✅ Reputation score calculation working
- ✅ New contracts accessible from Edge Function

## Next Steps

1. ✅ Supabase Edge Function updated
2. ✅ Environment variables configured
3. ✅ Function tested and verified
4. ⏳ Update database template records (if needed)
5. ⏳ Test end-to-end card claiming flow
6. ⏳ Update frontend to use new contract addresses

## Notes

- All contracts are on Moonbase Alpha testnet (Chain ID: 1287)
- For production deployment to Kusama Hub, contracts will need to be redeployed
- The Edge Function is network-agnostic and will work with any EVM-compatible chain
- Current RPC endpoint is the official Moonbase Alpha RPC

## Troubleshooting

If issues arise:

1. **Check secrets are set**:
   ```bash
   npx supabase secrets list
   ```

2. **View function logs**:
   Visit the dashboard logs page

3. **Redeploy if needed**:
   ```bash
   cd client
   npx supabase functions deploy dynamic-metadata
   ```

4. **Test manually**:
   ```bash
   curl -H "Authorization: Bearer <anon_key>" \
     https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
   ```

---

**Update completed successfully!** 🎉
