# ✅ Local Development Setup Complete

**Date:** November 9, 2025  
**Network:** Hardhat Local (Chain ID: 31337)  
**Status:** Ready for Development

---

## 🎉 What Was Fixed

### Issue: Insufficient Balance Error
**Problem:** The send.js script was trying to use a custom account with 0 ETH balance on the local network.

**Root Cause:** 
- Hardhat config was using PRIVATE_KEY from .env for localhost
- That account had no funds on the local network
- Hardhat's default accounts have 10,000 ETH each

**Solution:**
1. ✅ Updated `hardhat.config.ts` to use Hardhat's default funded accounts for localhost
2. ✅ Modified `send.js` to use account #1 (which has 10,000 ETH)
3. ✅ Updated `deploy-complete.js` to properly use the funded custom account

---

## 📦 Deployed Contracts (Local)

| Contract | Address | Owner |
|----------|---------|-------|
| **ProfileNFT** | `0x27b42C848603D3Fe63996Cc9261B0B88beFDbB36` | ✅ 0x91eD...E7f5 |
| **ReputationCard** | `0x4D356eB5DB3de7204e5e5a466FAAAC46e953206A` | ✅ 0x91eD...E7f5 |

### Verification Status
- ✅ ProfileNFT owner: Correct
- ✅ ReputationCard owner: Correct
- ✅ ReputationCard authorized in ProfileNFT
- ✅ Deployer is authorized issuer

---

## 💰 Account Balances

### Hardhat Default Accounts (Pre-funded)
- **Account #0:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` - 10,000 ETH
- **Account #1:** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` - ~9,985 ETH (used for funding)
- **Account #2-19:** Each has 10,000 ETH

### Custom Accounts (Funded via send.js)
- **Admin:** `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5` - 5 ETH ✅
- **User 1:** `0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb` - 5 ETH ✅
- **User 2:** `0x91e1c3ecb63b6be4512dbf367e9a822b06459993` - 5 ETH ✅

---

## 🚀 How to Use

### Start Everything (One Command)
```bash
make run
```

This will:
1. Kill any existing Hardhat node
2. Start a fresh Hardhat node
3. Fund custom accounts with 5 ETH each
4. Deploy all contracts
5. Start the Vite dev server

### Individual Commands

```bash
# Start Hardhat node only
make start-node

# Fund accounts only
make fund-account

# Deploy contracts only
make deploy

# Start client only
make start-client

# Stop everything
make stop-all
```

---

## 🔗 Access Points

### Local Services
- **Hardhat Node:** http://127.0.0.1:8545
- **Client App:** http://localhost:5173
- **Alternative Port:** http://localhost:5174 (if 5173 is busy)

### Admin Account
- **Address:** `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`
- **Private Key:** In `.env` file
- **Balance:** 5 ETH (on local network)

---

## 🧪 Testing the Setup

### 1. Connect Wallet
1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Add Hardhat Local network to MetaMask:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

### 2. Import Test Account
Import the admin account into MetaMask:
- Private Key: (from your `.env` file)
- You should see 5 ETH balance

### 3. Create Profile
1. Click "Create Profile"
2. Fill in details
3. Confirm transaction
4. Profile should be created successfully

### 4. Issue Reputation Card
1. Go to Issuer page
2. Enter profile ID
3. Issue a reputation card
4. Verify it appears on the profile

---

## 📝 Configuration Changes Made

### hardhat.config.ts
```typescript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
    // Don't specify accounts - use Hardhat's default funded accounts
  },
  // ... other networks
}
```

### scripts/send.js
- Now uses account #1 (pre-funded with 10,000 ETH)
- Sends 5 ETH to each recipient
- Includes gas buffer in balance check
- Better error messages

### scripts/deploy-complete.js
- Detects localhost network (chainId 31337)
- Uses funded custom account for deployment
- Properly connects deployer to contract factories
- Correct ownership verification

---

## 🔍 Verification Commands

### Check Contract Ownership
```bash
make verify
```

### Check Account Balances
```bash
npx hardhat console --network localhost
```

Then in console:
```javascript
const balance = await ethers.provider.getBalance("0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5");
console.log(ethers.formatEther(balance), "ETH");
```

### Test Contract Interaction
```bash
npx hardhat console --network localhost
```

Then:
```javascript
const profileNFT = await ethers.getContractAt("ProfileNFT", "0x27b42C848603D3Fe63996Cc9261B0B88beFDbB36");
const owner = await profileNFT.owner();
console.log("Owner:", owner);
```

---

## 🐛 Troubleshooting

### Issue: "Insufficient balance" error
**Solution:** Run `make fund-account` to fund the custom accounts

### Issue: "Contract not deployed" error
**Solution:** Run `make deploy` to deploy contracts

### Issue: Hardhat node not responding
**Solution:** Run `make restart-node` to restart the node

### Issue: Client won't start
**Solution:** 
```bash
cd client
npm install
npm run dev
```

### Issue: Wrong network in MetaMask
**Solution:** Make sure you're connected to "Hardhat Local" (Chain ID: 31337)

---

## 📊 What's Working

- ✅ Hardhat local node running
- ✅ Custom accounts funded with 5 ETH each
- ✅ ProfileNFT deployed and configured
- ✅ ReputationCard deployed and authorized
- ✅ Contract addresses updated in frontend
- ✅ ABIs generated and updated
- ✅ Ownership verification passing
- ✅ Client application running

---

## 🎯 Next Steps

### For Development
1. ✅ Setup complete - start building features
2. Test profile creation flow
3. Test reputation card issuance
4. Test XCM identity verification (demo mode)
5. Add more test accounts if needed

### For Production
1. Deploy to Moonbase Alpha testnet
2. Test with real testnet tokens
3. Verify all contracts on block explorer
4. Set up relayer infrastructure
5. Integrate real parachain endpoints

---

## 💡 Tips

### Quick Reset
If you need to start fresh:
```bash
make stop-all
make run
```

### Add More Test Accounts
Edit `scripts/send.js` and add more addresses to the RECIPIENTS array.

### Change Funding Amount
Edit `scripts/send.js` and change the AMOUNT variable (currently 5 ETH).

### Use Different Deployer
Edit `.env` and change the PRIVATE_KEY to a different account.

---

## 🔐 Security Notes

### Local Development Only
- These configurations are for LOCAL DEVELOPMENT ONLY
- Never use these private keys on mainnet
- Never commit `.env` file to git
- Use different accounts for production

### Hardhat Accounts
- Hardhat's default accounts are PUBLIC
- Everyone knows these private keys
- Only use for local testing
- Never send real funds to these addresses

---

**Everything is ready! Run `make run` to start developing! 🚀**

---

*Last Updated: November 9, 2025*  
*Version: 1.0.0 (Local Setup)*
