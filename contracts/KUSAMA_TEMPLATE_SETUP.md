# Kusama Living Profile Template Setup

## Problem
The claim transaction is failing because template 999 either:
1. Doesn't exist
2. Has the wrong issuer
3. Is paused
4. Has other configuration issues

## Solution

### Step 1: Check Template Status

```bash
cd contracts
npx hardhat run scripts/check-template-999.ts --network moonbase
```

This will show you:
- ✅ If template exists
- ✅ Who the issuer is
- ✅ If it's paused
- ✅ Supply status
- ✅ If the user has a profile
- ✅ If already claimed

### Step 2: Create Template (if needed)

If template doesn't exist:

```bash
npx hardhat run scripts/create-kusama-template.ts --network moonbase
```

This creates template 999 with:
- **Template ID**: 999
- **Issuer**: Your deployer address
- **Tier**: 3 (Gold - 3 points)
- **Max Supply**: Unlimited
- **Token URI**: Dynamic metadata base URI
- **Always active**: No start/end time

### Step 3: Update Supabase Secrets

The issuer private key MUST match the template issuer:

```bash
cd client

# Set the private key of the template issuer
supabase secrets set ISSUER_PRIVATE_KEY=0xyour_private_key_here

# Set the contract address
supabase secrets set REPUTATION_CARD_CONTRACT_ADDRESS=0x58ae57ef894417eC69ABf29f8fC66fC9540b0dC2
```

**CRITICAL:** The address from `ISSUER_PRIVATE_KEY` must match the issuer shown in the check script!

### Step 4: Deploy Edge Function

```bash
cd client
supabase functions deploy generate-signature
```

### Step 5: Test Claim

1. Go to your app
2. Navigate to Discover page
3. Try claiming Kusama Living Profile
4. Check browser console for errors
5. Check Moonscan for transaction details

## Common Issues

### Issue: "Bad signature"
**Cause:** Issuer private key doesn't match template issuer  
**Fix:** 
```bash
# Option 1: Use correct private key
supabase secrets set ISSUER_PRIVATE_KEY=0xcorrect_key

# Option 2: Update template issuer (must be called by current issuer)
npx hardhat console --network moonbase
> const rc = await ethers.getContractAt("ReputationCard", "0x58ae57ef894417eC69ABf29f8fC66fC9540b0dC2")
> await rc.updateTemplateIssuer(999, "0xNewIssuerAddress")
```

### Issue: "Template missing"
**Cause:** Template 999 doesn't exist  
**Fix:** Run create script above

### Issue: "Paused"
**Cause:** Template is paused  
**Fix:**
```bash
npx hardhat console --network moonbase
> const rc = await ethers.getContractAt("ReputationCard", "0x58ae57ef894417eC69ABf29f8fC66fC9540b0dC2")
> await rc.updateTemplatePaused(999, false)
```

### Issue: "No profile"
**Cause:** User hasn't created a profile  
**Fix:** Create profile first in the app

### Issue: "Invalid tier"
**Cause:** Tier score not set  
**Fix:**
```bash
npx hardhat console --network moonbase
> const rc = await ethers.getContractAt("ReputationCard", "0x58ae57ef894417eC69ABf29f8fC66fC9540b0dC2")
> await rc.setTierScore(3, 3) // Tier 3 = 3 points
```

## Verify Setup

After setup, run the check script again:

```bash
npx hardhat run scripts/check-template-999.ts --network moonbase
```

You should see all ✅ green checkmarks!

## Environment Variables

Make sure these are set in `contracts/.env`:

```env
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
PRIVATE_KEY=0xyour_deployer_private_key
REPUTATION_CARD_ADDRESS=0x58ae57ef894417eC69ABf29f8fC66fC9540b0dC2
PROFILE_NFT_ADDRESS=0xyour_profile_nft_address
```

## Quick Troubleshooting

```bash
# 1. Check template
npx hardhat run scripts/check-template-999.ts --network moonbase

# 2. View Supabase logs
cd client
supabase functions logs generate-signature --tail

# 3. Test signature generation
curl -X POST 'https://your-project.supabase.co/functions/v1/generate-signature' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user":"0x...","profileOwner":"0x...","templateId":"999","tokenURI":"ipfs://test"}'

# 4. Check transaction on Moonscan
# Look for revert reason in transaction details
```

## Success Checklist

- [ ] Template 999 exists
- [ ] Template issuer matches ISSUER_PRIVATE_KEY address
- [ ] Template is not paused
- [ ] Tier 3 score is set (should be 3)
- [ ] User has a profile created
- [ ] Edge Function deployed
- [ ] Supabase secrets set correctly
- [ ] Test claim works
