# TrustFi Deployment Summary

## ✅ Completed Steps

### 1. Smart Contracts Deployed to Moonbase Alpha

**ProfileNFT Contract:**
- Address: `0xB96b539725408Ba97b42637E4E3a893c7f9e41b1`
- Features: Soulbound profile NFTs, metadata updates

**ReputationCard Contract:**
- Address: `0x74Ba1C03cBfCCa0A3B0e2f5558140307FaEa9725`
- Features: Signature-based claiming, supply caps, nonce replay protection

### 2. Roles Configured

**Admin/Owner:** `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- Has DEFAULT_ADMIN_ROLE
- Has TEMPLATE_MANAGER_ROLE

**Issuer:** `0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb`
- Has TEMPLATE_MANAGER_ROLE (granted via script)

### 3. Template Created On-Chain

**Template #1:**
- Template ID: 1
- Issuer: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- Max Supply: 100
- Tier: 2 (Silver - 50 points)

### 4. Supabase Functions

**✅ pin-metadata** - Uploads metadata to IPFS
**✅ generate-signature** - Generates EIP-712 signatures for claims
**❌ issue-card** - REMOVED (obsolete with new architecture)

## 🔄 Next Steps

### 1. Deploy generate-signature Function

You need to deploy the function via Supabase Dashboard since CLI isn't installed:

1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Deploy the `generate-signature` folder
4. Set environment variable: `ISSUER_PRIVATE_KEY`

### 2. Add Template Metadata to Supabase

Insert a row in the `collectible_templates` table:

```sql
INSERT INTO collectible_templates (
  id,
  issuer_name,
  title,
  description,
  image_url,
  tier,
  template_id
) VALUES (
  gen_random_uuid(),
  'TrustFi Academy',
  'Early Adopter',
  'Awarded to early supporters of the TrustFi platform',
  'https://your-image-url.com/early-adopter.png',
  2,
  1
);
```

### 3. Update CollectiblesPage.tsx

Update the claim flow to:
1. Call `generate-signature` function to get signature + nonce
2. Upload metadata to IPFS (via `pin-metadata`)
3. Call `claimWithSignature()` on the ReputationCard contract

### 4. Test the Full Flow

1. Create a profile (if you haven't already)
2. Go to Collectibles page
3. Click "Claim" on a collectible
4. Approve the transaction in MetaMask
5. Verify the card appears in your profile

## 📝 Important Notes

- **Network:** All contracts are on Moonbase Alpha testnet (Chain ID: 1287)
- **RPC URL:** https://rpc.api.moonbase.moonbeam.network
- **Block Explorer:** https://moonbase.moonscan.io
- **Faucet:** https://faucet.moonbeam.network (for DEV tokens)

## 🔐 Security Reminders

- Never commit private keys to git
- Store ISSUER_PRIVATE_KEY securely in Supabase secrets
- In production, add proper eligibility checks to generate-signature
- Consider rate limiting on the signature endpoint
