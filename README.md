# 🚀 TrustFi Reputation Platform

A decentralized reputation system built on Ethereum that allows users to create profiles and earn verifiable reputation cards from authorized issuers.

## ✨ Features

### 🎯 **Core Functionality**
- **User Profiles**: Create and manage decentralized identity profiles
- **Reputation Cards**: Earn verifiable credentials from authorized issuers
- **Admin Panel**: Comprehensive issuer management and system oversight
- **Multi-Wallet Support**: MetaMask and Talisman wallet integration

### 🛡️ **Admin Features**
- **Issuer Management**: Add/remove authorized credential issuers
- **System Statistics**: Monitor platform activity and usage
- **Access Control**: Secure admin authentication via contract ownership
- **Real-time Updates**: Live transaction feedback and status updates

## 🏗️ **Architecture**

### **Smart Contracts**
- **ProfileNFT**: Manages user profiles as NFTs
- **ReputationCard**: Handles credential issuance and verification

### **Frontend**
- **React + TypeScript**: Modern, type-safe frontend
- **TailwindCSS**: Clean, responsive design
- **Ethers.js**: Ethereum blockchain interaction

## 🚀 **Quick Start**

### **Prerequisites**
```bash
Node.js >= 18
npm or yarn
MetaMask browser extension
```

### **1. Clone & Install**
```bash
git clone <repository-url>
cd TrustFi_v2
npm install
cd client && npm install
```

### **2. Start Local Blockchain**
```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

### **3. Deploy Contracts**
```bash
# Terminal 2: Deploy contracts
npx hardhat run scripts/fresh-deploy.js --network localhost
```

### **4. Start Frontend**
```bash
# Terminal 3: Start React app
cd client
npm run dev
```

### **5. Setup MetaMask**
1. **Add Hardhat Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Admin Account:**
   - Private Key: `0x6527d94cfbcd7d52564ee5c59cfcfd5582d43b090721780c7d8d39c2d2b91be3`
   - Address: `0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5`

## 🎮 **Usage**

### **For Users**
1. Connect your wallet
2. Create a profile
3. Earn reputation cards from authorized issuers
4. View and manage your credentials

### **For Admins**
1. Connect with admin account
2. Navigate to Admin panel
3. Manage authorized issuers
4. Monitor system statistics

## 📁 **Clean Project Structure**

```
TrustFi_v2/
├── 📄 README.md                    # Main project documentation
├── 📄 FINAL_SETUP_SUMMARY.md       # Detailed setup guide
├── 🔧 scripts/fresh-deploy.js      # Production deployment
├── 📁 contracts/                   # Smart contracts
│   ├── ProfileNFT.sol
│   └── ReputationCard.sol
├── 📁 client/                      # React frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── services/              # Blockchain services
│   │   ├── hooks/                 # Custom React hooks
│   │   └── config/                # Configuration files
│   └── package.json
├── 📁 ignition/                    # Hardhat Ignition modules
├── 📁 typechain-types/             # Generated TypeScript types
├── 📁 artifacts/contracts/         # Contract ABIs
└── ⚙️  Configuration files          # hardhat.config.ts, package.json, etc.
```

## 🛠️ **Development**

### **Available Scripts**

```bash
# Smart Contract Development
npx hardhat compile              # Compile contracts
npx hardhat test                 # Run tests
npx hardhat node                 # Start local node

# Deployment
npx hardhat run scripts/fresh-deploy.js --network localhost

# Frontend Development
cd client
npm run dev                      # Start dev server
npm run build                    # Build for production
npm run preview                  # Preview production build
```

### **Contract Addresses (Local)**
- **ProfileNFT**: `0xedaaAa2393De28d15cacCBa6933B1b24215a8699`
- **ReputationCard**: `0x61cd4010d3bA7456755651D130e013F3EEf6bFdf`

## 🔧 **Troubleshooting**

### **Common Issues**

**"Access Denied" in Admin Panel:**
- Ensure you're using the correct admin account
- Verify MetaMask is on Hardhat Local network (Chain ID: 31337)
- Redeploy contracts if needed

**Contract Not Found:**
```bash
# Restart Hardhat node and redeploy
npx hardhat node
npx hardhat run scripts/fresh-deploy.js --network localhost
```

**MetaMask Issues:**
- Reset account in MetaMask settings
- Clear browser cache
- Ensure correct network selection

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details

## 🎯 **Roadmap**

- [ ] Multi-chain deployment
- [ ] Enhanced reputation scoring
- [ ] Mobile app development
- [ ] Integration with external identity providers
- [ ] Advanced analytics dashboard

---

**✨ Project is now clean, organized, and production-ready!**

**Built with ❤️ using React, TypeScript, Hardhat, and Ethereum**