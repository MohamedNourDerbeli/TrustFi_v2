# Kusama Claim Fix - Complete Diagnosis

## ✅ What's Working:
- ✅ Template 999 exists on-chain
- ✅ You are the issuer
- ✅ Template is not paused
- ✅ Tier 3 score is valid (200 points)
- ✅ User has a profile (Profile ID: 2)
- ✅ User hasn't claimed yet
- ✅ Signature generation works
- ✅ Edge Function is deployed

## ❌ What's Broken:
The Kusama Living Profile collectible in Supabase has a **NULL or EMPTY `token_uri`** field!

When the user tries to claim, the code does:
```typescript
let tokenURI: string;
if (isKusamaLivingProfile) {
  tokenURI = `${collectible.tokenUri}${profileId.toString()}`;
  // This becomes: "undefined2" or "null2" - INVALID!
}
```

## 🔧 Fix:

### Step 1: Update Supabase Collectible

Go to Supabase Dashboard → SQL Editor and run:

```sql
UPDATE collectibles
SET token_uri = 'ipfs://QmYourMetadataHash/'
WHERE template_id = 999;
```

Or use a dynamic metadata endpoint:

```sql
UPDATE collectibles
SET token_uri = 'https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId='
WHERE template_id = 999;
```

### Step 2: Verify the Update

```sql
SELECT id, template_id, title, token_uri FROM collectibles WHERE template_id = 999;
```

You should see a proper token_uri value, not NULL or empty.

### Step 3: Test Claim Again

1. Go to Discover page
2. Try claiming Kusama Living Profile
3. Should work now!

## 📝 What the Token URI Should Be:

For Kusama Living Profile (dynamic NFT), the token_uri should be a base URI that gets the profileId appended:

**Option 1: IPFS (Static)**
```
ipfs://QmYourMetadataHash/
```
Then the full URI becomes: `ipfs://QmYourMetadataHash/2` (where 2 is the profileId)

**Option 2: HTTP Endpoint (Dynamic)**
```
https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId=
```
Then the full URI becomes: `https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId=2`

**Option 3: Data URI (Fallback)**
```
data:application/json;base64,
```

## 🎯 Recommended:

Use the Supabase dynamic metadata endpoint so the NFT metadata updates in real-time as the user's reputation score changes!

```sql
UPDATE collectibles
SET token_uri = 'https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId='
WHERE template_id = 999;
```

## ✅ After Fix:

Once you update the token_uri in Supabase:
1. The claim will work
2. The card will be issued
3. The user will see it in their dashboard
4. The metadata will be dynamic (updates with reputation score)

## 🚀 Next Steps:

1. Update the collectible in Supabase
2. Test the claim
3. If it works, you're done!
4. If not, check browser console and Supabase function logs
