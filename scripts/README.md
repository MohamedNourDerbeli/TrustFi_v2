# TrustFi Scripts

This folder contains utility scripts for the TrustFi project.

## Available Scripts

### 1. `fresh-deploy.js`
Deploys fresh contracts to the local Hardhat network and updates the client configuration.

```bash
npm run deploy:fresh
```

### 2. `send-tokens.js`
Sends ETH tokens to a specified address.

#### Usage Options:

**Option 1: Command Line Arguments**
```bash
# Using npm script (recommended)
npm run send-tokens <recipient-address> <amount-in-eth>

# Using hardhat directly
npx hardhat run scripts/send-tokens.js --network localhost -- <recipient-address> <amount-in-eth>
```

**Option 2: Edit Script Configuration**
1. Open `scripts/send-tokens.js`
2. Update the `recipientAddress` and `amountETH` values in the config object
3. Run: `npm run send-tokens`

#### Examples:

```bash
# Send 2.5 ETH to an address
npm run send-tokens 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87 2.5

# Send 0.1 ETH to an address
npm run send-tokens 0x8ba1f109551bD432803012645Hac136c0532925a 0.1
```

#### Features:
- ✅ Validates recipient address format
- ✅ Checks sender balance before transfer
- ✅ Shows before/after balances
- ✅ Provides detailed transaction information
- ✅ Error handling with helpful tips

#### Requirements:
- Hardhat node must be running (`npm run node`)
- Sender account must have sufficient ETH balance
- Valid recipient address

#### Default Configuration:
- **Network**: Hardhat Local (http://127.0.0.1:8545)
- **Sender**: Uses the same private key as deployment script
- **Default Amount**: 1.0 ETH (if not specified)

## Getting Started

1. **Start Hardhat Node**:
   ```bash
   npm run node
   ```

2. **Deploy Contracts** (if needed):
   ```bash
   npm run deploy:fresh
   ```

3. **Send Tokens**:
   ```bash
   npm run send-tokens <recipient-address> <amount>
   ```

## Security Notes

⚠️ **Important**: The scripts use a hardcoded private key for development purposes only. Never use this private key on mainnet or with real funds.

The default private key corresponds to:
- **Address**: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- **Private Key**: `0x6527d94cfbcd7d52564ee5c59cfcfd5582d43b090721780c7d8d39c2d2b91be3`

This is one of the default Hardhat accounts and should only be used for local development.