# Kusama Living Profile - Deployment Complete ✅

## What Was Done

### 1. ✅ Template 999 Created On-Chain
- **Transaction**: `0x35297c83f9bcf480d9ce425fb50f379e6046266d67abbf0997b3a0d679ea66d3`
- **Block**: 14269837
- **Template ID**: 999
- **Issuer**: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- **Tier**: 3 (Gold - 200 points)
- **Max Supply**: Unlimited
- **Status**: Active (not paused)

### 2. ✅ Dynamic Metadata Function Deployed
- **Function**: `dynamic-metadata`
- **Location**: `client/supabase/functions/dynamic-metadata/index.ts`
- **Features**:
  - Reads reputation score from contract
  - Generates dynamic SVG badge
  - Returns proper JSON metadata
  - Updates in real-time as score changes

### 3. ⏳ Next: Update Supabase Collectible

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
INSERT INTO collectibles (
  template_id,
  title,
  description,
  image_url,
  banner_url,
  token_uri,
  claim_type,
  requirements,
  created_by,
  is_active
) VALUES (
  999,
  'Kusama Living Profile',
  'A dynamic NFT collectible that reflects your real-time on-chain reputation score, powered by Kusama EVM. The visual representation evolves as you earn more reputation points.',
  'https://via.placeholder.com/400x400?text=Kusama+Living+Profile',
  'https://via.placeholder.com/1200x400?text=Kusama+Living+Profile+Banner',
  'https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata?profileId=',
  'signature',
  '{"description": "You must have a TrustFi profile to claim this dynamic collectible", "requiresProfile": true}',
  '0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5',
  true
);
```

## Configuration Summary

### Contract Addresses (from your .env)
- **ReputationCard**: `0x60BdA778B580262376aAd0Bc8a15AEe374168559`
- **ProfileNFT**: `0x312349142940f3FDfC33588a6cdeADC7aDE35f40`
- **RPC**: `https://api-moonbase-alpha.n.dwellir.com/1350b635-a82e-4e02-b336-7de9dba9108f`

### Supabase Configuration
- **URL**: `https://kuqfccqirhwaqjkiglmf.supabase.co`
- **Dynamic Metadata Endpoint**: `https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata?profileId=`

### Edge Function Secrets (Already Set)
- ✅ `ISSUER_PRIVATE_KEY`: Set to issuer's private key
- ✅ `REPUTATION_CARD_CONTRACT_ADDRESS`: `0x60BdA778B580262376aAd0Bc8a15AEe374168559`

## Testing the Claim

1. **Deploy the dynamic-metadata function** (if not already done):
   ```bash
   cd client
   supabase functions deploy dynamic-metadata
   ```

2. **Update Supabase** with the collectible entry (SQL above)

3. **Test the claim**:
   - Go to Discover page
   - Find "Kusama Living Profile"
   - Click "Claim Now"
   - Sign the transaction
   - Should succeed! ✅

## What Happens When User Claims

1. User clicks "Claim Now"
2. Edge Function generates signature with nonce
3. User signs transaction
4. Contract calls `claimWithSignature`
5. Contract verifies signature
6. Card is minted to ProfileNFT contract
7. Metadata is fetched from dynamic-metadata function
8. SVG badge is generated based on reputation score
9. Card appears in user's dashboard

## Troubleshooting

If claim still fails:

1. **Check Supabase collectible exists**:
   ```sql
   SELECT * FROM collectibles WHERE template_id = 999;
   ```

2. **Check dynamic-metadata function logs**:
   ```bash
   cd client
   supabase functions logs dynamic-metadata --tail
   ```

3. **Check signature generation**:
   ```bash
   supabase functions logs generate-signature --tail
   ```

4. **Verify contract state**:
   ```bash
   cd contracts
   npx hardhat run scripts/check-template-999.ts --network moonbaseAlpha
   ```

## Success Indicators

✅ Template 999 exists on-chain  
✅ Issuer is correct  
✅ Template is not paused  
✅ Tier 3 score is valid  
✅ User has profile  
✅ Collectible in Supabase  
✅ Token URI is set  
✅ Dynamic metadata function deployed  
✅ Claim works!

---

**Status**: Ready to test! 🚀
