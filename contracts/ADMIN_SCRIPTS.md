# Admin Scripts Reference

Quick reference for common admin tasks with the TrustFi reputation card system.

## Setup

Ensure your `.env` file contains:
```env
REPUTATION_CARD_CONTRACT_ADDRESS=0xYourContractAddress
PROFILE_NFT_CONTRACT_ADDRESS=0xYourProfileContractAddress
KUSAMA_SVG_CONTRACT_ADDRESS=0xYourKusamaSVGAddress
PRIVATE_KEY=your_private_key
```

## Common Tasks

### 1. List All Issued Cards

**Quick list:**
```bash
npx hardhat run scripts/list-all-cards.ts --network moonbase
```

**Detailed list with filters:**
```bash
# Show all cards and templates
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --templates

# Filter by tier
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --tier=3

# Export to JSON
npx hardhat run scripts/list-cards-detailed.ts --network moonbase --json > cards.json
```

### 2. Check Account Balance

```bash
npx hardhat run scripts/check-balance.ts --network moonbase
```

### 3. Create Template

```bash
# Create template 999 (Kusama Living Profile)
npx hardhat run scripts/create-template-999.ts --network moonbase
```

### 4. Verify Template

```bash
npx hardhat run scripts/verify-template-999.ts --network moonbase
```

### 5. Deploy Contracts

```bash
# Deploy main contracts
npx hardhat run scripts/deploy.ts --network moonbase

# Deploy Kusama SVG Art contract
npx hardhat run scripts/deploy-kusama-svg.ts --network moonbase
```

### 6. Test Kusama SVG

```bash
npx hardhat run scripts/test-kusama-svg.ts --network moonbase
```

## Script Locations

All scripts are located in `contracts/scripts/`:

- `list-all-cards.ts` - Basic card listing
- `list-cards-detailed.ts` - Advanced card listing with filters
- `check-balance.ts` - Check wallet balance
- `create-template-999.ts` - Create Kusama Living Profile template
- `verify-template-999.ts` - Verify template 999 configuration
- `deploy.ts` - Deploy main contracts
- `deploy-kusama-svg.ts` - Deploy Kusama SVG Art contract
- `test-kusama-svg.ts` - Test SVG generation

## Networks

Available networks (configured in `hardhat.config.ts`):
- `moonbase` - Moonbase Alpha testnet
- `moonbeam` - Moonbeam mainnet
- `localhost` - Local Hardhat network

## Documentation

For detailed information about listing cards, see:
- `scripts/LIST_CARDS_README.md` - Comprehensive guide for card listing scripts

For deployment information, see:
- `KUSAMA_DEPLOYMENT.md` - Kusama SVG Art deployment guide
