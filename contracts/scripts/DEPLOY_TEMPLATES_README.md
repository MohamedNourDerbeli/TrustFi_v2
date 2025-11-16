# Deploy Templates Script

This script deploys 25 templates to the blockchain and syncs them to Supabase.

## Templates Distribution

- **Issuer 1** (`0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5`): 13 templates
- **Issuer 2** (`0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb`): 12 templates

## Prerequisites

1. Make sure both issuers have the `TEMPLATE_MANAGER_ROLE` on the contract
2. Update the contract address in `deploy-templates.ts`
3. Make sure your `.env` file has Supabase credentials

## Setup

1. Update the contract address in `deploy-templates.ts`:
```typescript
const REPUTATION_CARD_ADDRESS = '0xYourContractAddress';
```

3. Make sure your `client/.env` has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run the Script

```bash
npx hardhat run scripts/deploy-templates.ts --network <your-network>
```

For example:
```bash
# Local network
npx hardhat run scripts/deploy-templates.ts --network localhost

# Testnet
npx hardhat run scripts/deploy-templates.ts --network sepolia

# Mainnet
npx hardhat run scripts/deploy-templates.ts --network mainnet
```

## What the Script Does

1. ✅ Reads the current template counter from Supabase
2. ✅ Deploys 25 templates on-chain (13 to Issuer 1, 12 to Issuer 2)
3. ✅ Syncs each template to `templates_cache` table in Supabase
4. ✅ Updates the template counter for the next deployment
5. ✅ Provides a detailed summary of the deployment

## Templates Included

### Issuer 1 Templates (13):
1. Discord OG (Tier 3, Supply: 100)
2. Twitter Influencer (Tier 3, Supply: 50)
3. Community Helper (Tier 2, Supply: 200)
4. Meme Lord (Tier 1, Supply: 500)
5. First Transaction (Tier 1, Supply: 10000)
6. Whale Status (Tier 3, Supply: 25)
7. Diamond Hands (Tier 3, Supply: 100)
8. Trading Master (Tier 2, Supply: 150)
9. Smart Contract Auditor (Tier 3, Supply: 30)
10. DeFi Expert (Tier 2, Supply: 100)
11. Web3 Developer (Tier 2, Supply: 200)
12. Hackathon Winner 2024 (Tier 3, Supply: 10, Time-limited)
13. Launch Day Hero (Tier 2, Supply: 500, Time-limited)

### Issuer 2 Templates (12):
1. Holiday 2024 Collector (Tier 1, Supply: 1000, Time-limited)
2. KYC Verified (Tier 1, Supply: 5000)
3. Institutional Partner (Tier 3, Supply: 20)
4. Liquidity Provider (Tier 2, Supply: 100)
5. NFT Collector (Tier 2, Supply: 300)
6. Game Champion (Tier 3, Supply: 50)
7. Rare Item Holder (Tier 3, Supply: 25)
8. Bug Bounty Hunter (Tier 3, Supply: 50)
9. Content Creator (Tier 2, Supply: 100)
10. Official Ambassador (Tier 3, Supply: 30)
11. Governance Delegate (Tier 2, Supply: 100)
12. Ecosystem Builder (Tier 3, Supply: 50)

## Troubleshooting

### "Unauthorized" or "AccessControl" Error
- Make sure the deployer wallet has admin rights on the contract
- Or make sure both issuer addresses have `TEMPLATE_MANAGER_ROLE`

### "Template exists" Error
- The script will skip existing templates and continue
- Check the starting template ID in the logs

### Supabase Sync Fails
- Check your Supabase credentials in `.env`
- Make sure RLS policies allow INSERT/UPDATE on `templates_cache`
- The script will continue even if Supabase sync fails

### Gas Issues
- Adjust gas price in hardhat config
- Deploy in batches if needed (modify the templates array)

## Customization

You can modify the `templates` array in `deploy-templates.ts` to:
- Add more templates
- Change template properties
- Adjust issuer distribution
- Modify time windows

## Notes

- The script includes a 1-second delay between deployments to avoid rate limiting
- All templates start with `current_supply: 0`
- Templates are marked as `is_paused: false` by default
- Time-limited templates use Unix timestamps
