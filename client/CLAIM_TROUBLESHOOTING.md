# Kusama Claim Troubleshooting Guide

## Issue: Claim transaction failing

### Quick Checklist

1. **Check Environment Variables**
   ```bash
   # In Supabase dashboard, verify these secrets are set:
   - ISSUER_PRIVATE_KEY
   - REPUTATION_CARD_CONTRACT_ADDRESS
   ```

2. **Verify Signer Matches Template Issuer**
   
   The address from `ISSUER_PRIVATE_KEY` MUST match the issuer set for template 999.
   
   Check in contract:
   ```javascript
   // In browser console or Hardhat
   const template = await reputationCard.templates(999);
   console.log('Template issuer:', template.issuer);
   ```

3. **Check Template Status**
   ```javascript
   const template = await reputationCard.templates(999);
   console.log('Is paused:', template.isPaused);
   console.log('Current supply:', template.currentSupply.toString());
   console.log('Max supply:', template.maxSupply.toString());
   ```

4. **Verify User Has Profile**
   ```javascript
   const profileId = await profileNFT.addressToProfileId(userAddress);
   console.log('Profile ID:', profileId.toString());
   // Should be > 0
   ```

### Deploy Updated Function

```bash
cd client
supabase functions deploy generate-signature
```

### View Logs

```bash
# Real-time logs
supabase functions logs generate-signature --tail

# Or in Supabase Dashboard:
# Functions > generate-signature > Logs
```

### Test Signature Generation

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-signature' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "0x91cD0b6b5D33cd446d9f450AD1519f6a1e0E7f5",
    "profileOwner": "0x91cD0b6b5D33cd446d9f450AD1519f6a1e0E7f5",
    "templateId": "999",
    "tokenURI": "ipfs://test"
  }'
```

Expected response:
```json
{
  "nonce": "1731739027000000123456",
  "signature": "0x...",
  "signer": "0x..."
}
```

### Common Errors

#### "Bad signature"
- **Cause**: Signer doesn't match template issuer
- **Fix**: Use correct private key OR update template issuer

#### "Nonce used"
- **Cause**: Nonce was already used
- **Fix**: Wait and try again (nonces are auto-generated with timestamp)

#### "Template missing"
- **Cause**: Template 999 doesn't exist
- **Fix**: Create template first

#### "No profile"
- **Cause**: User hasn't created profile
- **Fix**: Create profile first

#### "Paused"
- **Cause**: Template is paused
- **Fix**: Unpause template: `reputationCard.updateTemplatePaused(999, false)`

#### "Max supply"
- **Cause**: Template reached max supply
- **Fix**: Increase max supply or create new template

### Debug in Browser

Open browser console and check:

```javascript
// Check what's being sent to Edge Function
// Look for: [DiscoverCollectibles] Using dynamic URI for template 999

// Check for errors
// Look for: [DiscoverCollectibles] Error claiming collectible
```

### Verify Contract State

```javascript
// Check template exists
const template = await reputationCard.templates(999);
console.log('Template:', {
  issuer: template.issuer,
  tier: template.tier.toString(),
  isPaused: template.isPaused,
  currentSupply: template.currentSupply.toString(),
  maxSupply: template.maxSupply.toString(),
});

// Check if already claimed
const profileId = await profileNFT.addressToProfileId(userAddress);
const hasClaimed = await reputationCard.hasProfileClaimed(999, profileId);
console.log('Already claimed:', hasClaimed);
```

### Still Not Working?

1. Check Moonscan transaction for revert reason
2. Check Supabase function logs
3. Verify all environment variables are set
4. Test with a simpler template (not dynamic NFT)
5. Make sure you're on Moonbase Alpha network

### Update Template Issuer (if needed)

If you need to change who can issue template 999:

```javascript
// Must be called by current issuer
await reputationCard.updateTemplateIssuer(999, newIssuerAddress);
```

### Contract Addresses

- **ReputationCard**: `0x58ae57ef894417eC69ABf29f8fC66fC9540b0dC2`
- **ProfileNFT**: Check your deployment

### Network

- **Chain**: Moonbase Alpha
- **Chain ID**: 1287
- **RPC**: https://rpc.api.moonbase.moonbeam.network
