# Kusama Hub Deployment Guide

## Quick Start

```bash
# 1. Check your account balance
npx hardhat run scripts/check-balance.ts --network kusama

# 2. Fund your account (see "Funding Your Account" section below)

# 3. Deploy the contract
npx hardhat run scripts/deploy-kusama-svg.ts --network kusama

# 4. Test the deployed contract
npx hardhat run scripts/test-kusama-svg.ts --network kusama
```

## Prerequisites

Before deploying the KusamaSVGArt contract to Kusama Hub, ensure you have:

1. **Funded Account**: The deployer account must have KSM (Kusama tokens) on Kusama Asset Hub
   - Current deployer address: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
   - Network: Kusama Asset Hub (Chain ID: 420420418)
   - RPC URL: https://kusama-asset-hub-eth-rpc.polkadot.io

2. **Private Key**: Set in `.env` file as `PRIVATE_KEY`

## Funding Your Account

To get KSM tokens on Kusama Asset Hub:

1. **Option 1: Bridge from Kusama Relay Chain**
   - Get KSM from a faucet or exchange
   - Use the Polkadot.js Apps to bridge KSM to Asset Hub
   - Visit: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fkusama-asset-hub-rpc.polkadot.io#/accounts

2. **Option 2: Use a Faucet** (if available for testnet)
   - Check Kusama community channels for faucet availability

3. **Option 3: Transfer from Another Account**
   - If you have KSM on another account, transfer to the deployer address

## Deployment Steps

Once your account is funded:

### 1. Verify Account Balance

```bash
npx hardhat run scripts/check-balance.ts --network kusama
```

### 2. Deploy Contract

```bash
npx hardhat run scripts/deploy-kusama-svg.ts --network kusama
```

### 3. Verify Deployment

The script will:
- Deploy the KusamaSVGArt contract
- Test the contract with various score inputs (0, 29, 30, 69, 70, 100)
- Display the deployed contract address
- Verify that metadata generation works correctly

### 4. Save Contract Address

After successful deployment, add the contract address to your `.env` file:

```
KUSAMA_SVG_CONTRACT_ADDRESS="<deployed_address>"
```

## Troubleshooting

### Error: "Failed to instantiate contract: CodeRejected"

This error can occur if:
- The account has insufficient balance (0 ETH)
- The contract bytecode is too large
- The network has specific restrictions

**Solution**: Ensure your account is funded with KSM tokens.

### Error: "Insufficient funds"

Your account needs KSM to pay for gas fees. Bridge or transfer KSM to your deployer address.

### Network Connection Issues

If you experience RPC connection issues:
- Try an alternative RPC endpoint
- Check network status at https://polkadot.js.org/apps/

## Contract Verification

After deployment, you can verify the contract on a block explorer:
- Kusama Asset Hub Explorer: https://assethub-kusama.subscan.io/

## Next Steps

After successful deployment:
1. Document the contract address in `.env`
2. Update the Edge Function configuration with the contract address
3. Create template 999 on-chain (Task 4)
4. Deploy the dynamic-metadata Edge Function (Task 5)
