# Moonbase Alpha Deployment Reference

## Quick Reference

### Contract Addresses

```
ProfileNFT:       0xe9721a33CB81D26013E0017b12285Cc2c02140E9
ReputationCard:   0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2
KusamaSVGArt:     0xF320656B42F663508CE06deE19C04b7C4Dc2FB89
```

### Network Details

- **Network**: Moonbase Alpha (Testnet)
- **Chain ID**: 1287
- **RPC URL**: https://rpc.api.moonbase.moonbeam.network
- **Explorer**: https://moonbase.moonscan.io/

### Deployer Account

- **Address**: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- **Roles**: 
  - DEFAULT_ADMIN on all contracts
  - TEMPLATE_MANAGER_ROLE on ReputationCard

## Templates

### Template 999 - Kusama Living Profile

- **ID**: 999
- **Tier**: 3 (200 points per card)
- **Max Supply**: Unlimited
- **Issuer**: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- **Status**: Active
- **Start Time**: Immediate (0)
- **End Time**: No expiry (0)

## Frontend Configuration

Update your `client/.env` file:

```env
VITE_PROFILE_NFT_ADDRESS=0xe9721a33CB81D26013E0017b12285Cc2c02140E9
VITE_REPUTATION_CARD_ADDRESS=0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2
VITE_KUSAMA_SVG_CONTRACT_ADDRESS=0xF320656B42F663508CE06deE19C04b7C4Dc2FB89
```

## Verification Links

### Moonbase Explorer

- [ProfileNFT](https://moonbase.moonscan.io/address/0xe9721a33CB81D26013E0017b12285Cc2c02140E9)
- [ReputationCard](https://moonbase.moonscan.io/address/0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2)
- [KusamaSVGArt](https://moonbase.moonscan.io/address/0xF320656B42F663508CE06deE19C04b7C4Dc2FB89)

## Testing

### Test Profile Creation

```bash
# In contracts directory
npx hardhat run scripts/test-profile.ts --network moonbaseAlpha
```

### Test Card Claiming

```bash
# In contracts directory
npx hardhat run scripts/test-claim.ts --network moonbaseAlpha
```

### Verify Template 999

```bash
npx hardhat run scripts/verify-template-999.ts --network moonbaseAlpha
```

## Key Features

### New in This Deployment

1. **getCardsDetailForProfile()** - Single call to get all card details
   - Returns: cardIds, templateIds, tiers, issuers
   - No gas cost (view function)
   - Eliminates Supabase dependency

2. **KusamaSVGArt Integration** - Dynamic SVG generation
   - Score-based visual tiers
   - On-chain metadata generation
   - Base64 encoded SVG images

3. **Template 999** - Kusama Living Profile
   - Tier 3 cards (200 points each)
   - Unlimited supply
   - Immediate activation

## Next Steps

1. ✅ Contracts deployed
2. ✅ Template 999 created
3. ✅ KusamaSVGArt deployed
4. ⏳ Update Supabase Edge Function with new addresses
5. ⏳ Test frontend integration
6. ⏳ Issue test cards to verify system

## Troubleshooting

### "Already known" Error

If you get this error during deployment:
```bash
npx hardhat run scripts/deploy-with-gas.ts --network moonbaseAlpha
```

### Check Account Balance

```bash
npx hardhat run scripts/check-balance.ts --network moonbaseAlpha
```

### Verify Template

```bash
npx hardhat run scripts/verify-template-999.ts --network moonbaseAlpha
```

## Support

- Moonbase Faucet: https://faucet.moonbeam.network/
- Moonbeam Discord: https://discord.gg/moonbeam
- Documentation: https://docs.moonbeam.network/
