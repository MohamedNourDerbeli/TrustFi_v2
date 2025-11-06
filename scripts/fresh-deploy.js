const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Fresh Contract Deployment (Nonce Reset)");
  console.log("==========================================\n");

  try {
    // Use your account for deployment
    const privateKey = "0x6527d94cfbcd7d52564ee5c59cfcfd5582d43b090721780c7d8d39c2d2b91be3";
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Get current nonce and reset if needed
    const address = "0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5";
    const currentNonce = await provider.getTransactionCount(address);
    console.log(`Current nonce for ${address}: ${currentNonce}`);
    
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`Deploying with account: ${wallet.address}`);
    console.log(`Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH\n`);

    // Deploy ProfileNFT first with explicit nonce
    console.log("1️⃣ Deploying ProfileNFT...");
    const ProfileNFT = await ethers.getContractFactory("ProfileNFT", wallet);
    const profileNFT = await ProfileNFT.deploy({
      nonce: currentNonce
    });
    await profileNFT.waitForDeployment();
    
    const profileNFTAddress = await profileNFT.getAddress();
    console.log(`   ✅ ProfileNFT deployed at: ${profileNFTAddress}`);
    
    // Test ProfileNFT
    const totalProfiles = await profileNFT.totalProfiles();
    console.log(`   ✅ ProfileNFT test call successful - Total profiles: ${totalProfiles}\n`);

    // Deploy ReputationCard with next nonce
    console.log("2️⃣ Deploying ReputationCard...");
    const ReputationCard = await ethers.getContractFactory("ReputationCard", wallet);
    const reputationCard = await ReputationCard.deploy(profileNFTAddress, {
      nonce: currentNonce + 1
    });
    await reputationCard.waitForDeployment();
    
    const reputationCardAddress = await reputationCard.getAddress();
    console.log(`   ✅ ReputationCard deployed at: ${reputationCardAddress}`);
    
    // Test ReputationCard
    const owner = await reputationCard.owner();
    const totalCards = await reputationCard.totalCards();
    const isAuthorized = await reputationCard.isAuthorizedIssuer(wallet.address);
    
    console.log(`   ✅ ReputationCard test calls successful:`);
    console.log(`      Owner: ${owner}`);
    console.log(`      Total Cards: ${totalCards}`);
    console.log(`      Is Authorized: ${isAuthorized}`);
    console.log(`      Owner matches deployer: ${owner.toLowerCase() === wallet.address.toLowerCase()}\n`);

    // Update client config
    console.log("3️⃣ Updating Client Configuration...");
    const configPath = path.join(__dirname, "../client/src/config/contracts.ts");
    
    const configContent = `// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Hardhat local network
  31337: {
    ProfileNFT: "${profileNFTAddress}",
    ReputationCard: "${reputationCardAddress}"
  },
  // Moonbase Alpha Testnet
  1287: {
    ProfileNFT: "0xB96f6215AF24a5488348cAF7ab708195834EE182", // Update this after deployment
    ReputationCard: "0x0000000000000000000000000000000000000000" // Update this after deployment
  },
  // Add other networks when deploying to mainnet/testnets
  // 1: { // Ethereum Mainnet
  //   ProfileNFT: "0x...",
  //   ReputationCard: "0x..."
  // },
  // 11155111: { // Sepolia Testnet
  //   ProfileNFT: "0x...",
  //   ReputationCard: "0x..."
  // }
} as const;

// Network configurations
export const NETWORKS = {
  31337: {
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
  },
  1287: {
    name: "Moonbase Alpha",
    rpcUrl: "https://rpc.api.moonbase.moonbeam.network",
    chainId: 1287,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;
`;

    fs.writeFileSync(configPath, configContent);
    console.log("   ✅ Client configuration updated\n");

    // Final verification with a small delay to ensure transactions are mined
    console.log("4️⃣ Final Verification...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    try {
      const finalOwner = await reputationCard.owner();
      const finalTotalCards = await reputationCard.totalCards();
      
      console.log(`   ✅ Final verification successful:`);
      console.log(`      Owner: ${finalOwner}`);
      console.log(`      Total Cards: ${finalTotalCards}\n`);

      console.log("🎉 Fresh Deployment Complete!");
      console.log("==============================");
      console.log("Contract Addresses:");
      console.log(`  ProfileNFT: ${profileNFTAddress}`);
      console.log(`  ReputationCard: ${reputationCardAddress}`);
      console.log("");
      console.log("Admin Account:");
      console.log(`  Address: ${wallet.address}`);
      console.log(`  Private Key: ${privateKey}`);
      console.log("");
      console.log("✅ Now try the TrustFi app - the admin panel should work!");
      console.log("");
      console.log("📋 Next Steps:");
      console.log("1. Make sure MetaMask is connected to Hardhat Local (Chain ID: 31337)");
      console.log("2. Import your account using the private key above");
      console.log("3. Start the client: cd client && npm run dev");
      console.log("4. Navigate to Admin panel in the TrustFi app");

    } catch (verificationError) {
      console.log(`   ⚠️  Verification failed: ${verificationError.message}`);
      console.log("   But deployment addresses are updated in config.");
    }

  } catch (error) {
    console.log("❌ Fresh deployment failed:");
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'NONCE_EXPIRED') {
      console.log("\n🔧 Nonce issue detected. Try restarting Hardhat node:");
      console.log("   1. Stop current Hardhat node (Ctrl+C)");
      console.log("   2. Start fresh: npx hardhat node");
      console.log("   3. Run this script again");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });