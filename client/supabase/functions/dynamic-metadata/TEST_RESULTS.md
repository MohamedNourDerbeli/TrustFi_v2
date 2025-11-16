# Edge Function Test Results

## ✅ Deployment Successful

**Date**: November 15, 2025  
**Function**: dynamic-metadata  
**Project**: kuqfccqirhwaqjkiglmf  
**Status**: ✅ WORKING

## Test Results

### Test 1: Profile ID 1

**Request**:
```bash
curl -H "Authorization: Bearer <ANON_KEY>" \
  https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/1
```

**Response** (Status 200):
```json
{
  "name": "Kusama Living Profile #1",
  "description": "A living Kusama profile image that evolves with a TrustFi reputation score.",
  "image": "data:image/svg+xml;base64,...",
  "attributes": [
    {
      "trait_type": "Score",
      "value": 20
    }
  ]
}
```

**Reputation Score Retrieved**: 20  
**SVG Generated**: ✅ Yes  
**Metadata Format**: ✅ Valid NFT metadata JSON

## What's Working

✅ Token ID extraction from URL path  
✅ Profile ID mapping (tokenId = profileId)  
✅ ReputationCard contract query on Moonbase Alpha  
✅ KusamaSVGArt contract call on Moonbase Alpha  
✅ Base64 metadata parsing  
✅ JSON response formatting  
✅ Error handling (400, 500 responses)  
✅ CORS and authentication

## Contract Addresses Used

- **ReputationCard**: `0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591` (Moonbase Alpha)
- **KusamaSVGArt**: `0x4EC70469102122D27011d3d7179FF1612F1d33DB` (Moonbase Alpha)
- **RPC Endpoint**: Dwellir Private RPC for Moonbase Alpha

## Dynamic Behavior Verified

The function successfully:
1. Queries the on-chain reputation score (20 for profile #1)
2. Generates dynamic SVG art based on that score
3. Returns complete NFT metadata with embedded SVG image
4. The SVG shows "Score: 20" and uses the appropriate color palette for that score range

## Next Steps

- ✅ Function is ready for integration with ProfileNFT contract
- ✅ Can be used as the tokenURI endpoint for Living Profile NFTs
- ⚠️ For production on Kusama Hub, redeploy KusamaSVGArt contract and update environment variables

## Usage in ProfileNFT

The ProfileNFT contract can use this endpoint as the base URI:

```solidity
string baseURI = "https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/";
```

Then `tokenURI(tokenId)` will return:
```
https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/{tokenId}
```

Which will dynamically generate metadata based on the current reputation score!
