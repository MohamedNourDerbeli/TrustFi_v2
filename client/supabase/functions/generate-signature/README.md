# Generate Signature Edge Function

This Edge Function generates EIP-712 signatures for claiming reputation cards with the `claimWithSignature` method.

## Deployment

The function is deployed to: `https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/generate-signature`

## Environment Variables

Required secrets (already configured):
- `ISSUER_PRIVATE_KEY` - Private key of the template issuer (used for signing)
- `REPUTATION_CARD_CONTRACT_ADDRESS` - Address of the ReputationCard contract

## Request Format

```json
{
  "user": "0x...",           // Address of the user claiming
  "profileOwner": "0x...",   // Address of the profile owner (usually same as user)
  "templateId": "999",       // Template ID to claim
  "tokenURI": "https://..."  // Token URI for the NFT
}
```

## Response Format

```json
{
  "nonce": "1763249401732831188",
  "signature": "0x1dd672ff9d02f6562a25fe82e2018eb7ea42c944041ed8dbb386badec69ec35e..."
}
```

## Signature Format

The signature is generated using EIP-712 typed data with the following structure:

**Domain:**
- name: "TrustFi ReputationCard"
- version: "1"
- chainId: 1287 (Moonbase Alpha)
- verifyingContract: ReputationCard contract address

**Message Type (Claim):**
- user: address
- profileOwner: address
- templateId: uint256
- nonce: uint256

This matches the contract's `CLAIM_TYPEHASH`:
```solidity
keccak256("Claim(address user,address profileOwner,uint256 templateId,uint256 nonce)")
```

## Testing

```bash
# PowerShell
$headers = @{ 
  "Authorization" = "Bearer YOUR_ANON_KEY"
  "Content-Type" = "application/json" 
}
$body = '{"user":"0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5","profileOwner":"0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5","templateId":"999","tokenURI":"https://example.com/metadata/1"}'
Invoke-RestMethod -Uri "https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/generate-signature" -Method Post -Headers $headers -Body $body
```

## Redeployment

To redeploy after making changes:

```bash
cd client
npx supabase functions deploy generate-signature
```

## Security Notes

- The issuer private key is stored securely in Supabase secrets
- Signatures are only valid for the specific user, profile, template, and nonce
- Each nonce can only be used once per template per profile (enforced by contract)
- CORS is enabled to allow frontend access
