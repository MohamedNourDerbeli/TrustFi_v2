const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Complete TrustFi Deployment");
  console.log("================================\n");

  // Get deployer account - use specific private key from .env
  const privateKey = process.env.PRIVATE_KEY;
  let deployer;
  
  if (privateKey) {
    deployer = new ethers.Wallet(privateKey, ethers.provider);
    console.log(`Using custom account from .env`);
  } else {
    [deployer] = await ethers.getSigners();
    console.log(`Using default Hardhat account`);
  }
  
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);
  
  if (balance === 0n) {
    console.log("❌ Account has no funds. Please fund the account first.");
    return;
  }

  try {
    // ============================================
    // STEP 1: Deploy Contracts
    // ============================================
    console.log("📦 STEP 1: Deploying Contracts");
    console.log("   ─────────────────────────────\n");
    
    // Deploy ProfileNFT
    console.log("   Deploying ProfileNFT...");
    const ProfileNFT = await ethers.getContractFactory("ProfileNFT");
    const profileNFT = await ProfileNFT.deploy();
    await profileNFT.waitForDeployment();
    const profileNFTAddress = await profileNFT.getAddress();
    console.log(`   ✅ ProfileNFT: ${profileNFTAddress}\n`);

    // Deploy ReputationCard
    console.log("   Deploying ReputationCard...");
    const ReputationCard = await ethers.getContractFactory("ReputationCard");
    const reputationCard = await ReputationCard.deploy(profileNFTAddress);
    await reputationCard.waitForDeployment();
    const reputationCardAddress = await reputationCard.getAddress();
    console.log(`   ✅ ReputationCard: ${reputationCardAddress}\n`);

    // ============================================
    // STEP 2: Authorize ReputationCard
    // ============================================
    console.log("🔐 STEP 2: Authorizing Contracts");
    console.log("   ──────────────────────────────\n");
    
    console.log("   Authorizing ReputationCard to update reputation scores...");
    const authTx = await profileNFT.authorizeContract(reputationCardAddress);
    await authTx.wait();
    console.log("   ✅ ReputationCard authorized\n");

    // ============================================
    // STEP 3: Update Contract Addresses
    // ============================================
    console.log("📝 STEP 3: Updating Contract Addresses");
    console.log("   ────────────────────────────────────\n");
    
    const configPath = path.join(__dirname, '../client/src/config/contracts.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId.toString();
    
    console.log(`   Network: ${network.name} (Chain ID: ${chainId})`);
    
    // Update addresses based on chain ID
    if (chainId === "31337") {
      // Local network
      const regex = /["']31337["']:\s*\{[^}]*\}/s;
      const replacement = `"31337": {
    ProfileNFT: "${profileNFTAddress}",
    ReputationCard: "${reputationCardAddress}",
  }`;
      configContent = configContent.replace(regex, replacement);
    } else if (chainId === "1287") {
      // Moonbase Alpha
      const regex = /["']1287["']:\s*\{[^}]*\}/s;
      const replacement = `"1287": {
    ProfileNFT: "${profileNFTAddress}",
    ReputationCard: "${reputationCardAddress}",
  }`;
      configContent = configContent.replace(regex, replacement);
    }
    
    fs.writeFileSync(configPath, configContent);
    console.log(`   ✅ Updated contracts.ts\n`);

    // ============================================
    // STEP 4: Update ABIs
    // ============================================
    console.log("📋 STEP 4: Updating ABIs");
    console.log("   ──────────────────────\n");
    
    // Get artifact paths
    const profileArtifactPath = path.join(__dirname, '../artifacts/contracts/ProfileNFT.sol/ProfileNFT.json');
    const reputationArtifactPath = path.join(__dirname, '../artifacts/contracts/ReputationCard.sol/ReputationCard.json');
    
    // Read artifacts
    const profileArtifact = JSON.parse(fs.readFileSync(profileArtifactPath, 'utf8'));
    const reputationArtifact = JSON.parse(fs.readFileSync(reputationArtifactPath, 'utf8'));
    
    // Update ProfileNFT ABI
    const profileAbiPath = path.join(__dirname, '../client/src/config/ProfileNFT.abi.ts');
    const profileAbiContent = `// Auto-generated ABI - Do not edit manually
// Generated: ${new Date().toISOString()}

export const ProfileNFT_ABI = ${JSON.stringify(profileArtifact.abi, null, 2)} as const;
`;
    fs.writeFileSync(profileAbiPath, profileAbiContent);
    console.log("   ✅ Updated ProfileNFT.abi.ts");
    
    // Update ReputationCard ABI
    const reputationAbiPath = path.join(__dirname, '../client/src/config/ReputationCard.abi.ts');
    const reputationAbiContent = `// Auto-generated ABI - Do not edit manually
// Generated: ${new Date().toISOString()}

export const ReputationCard_ABI = ${JSON.stringify(reputationArtifact.abi, null, 2)} as const;
`;
    fs.writeFileSync(reputationAbiPath, reputationAbiContent);
    console.log("   ✅ Updated ReputationCard.abi.ts\n");

    // ============================================
    // STEP 5: Verify Deployment
    // ============================================
    console.log("✅ STEP 5: Verification");
    console.log("   ────────────────────\n");
    
    // Test ProfileNFT
    const owner = await profileNFT.owner();
    const isAuthorized = await profileNFT.isAuthorizedContract(reputationCardAddress);
    console.log("   ProfileNFT:");
    console.log(`      Owner: ${owner}`);
    console.log(`      ReputationCard authorized: ${isAuthorized ? '✅' : '❌'}`);
    
    // Test ReputationCard
    const repOwner = await reputationCard.owner();
    const isIssuer = await reputationCard.isAuthorizedIssuer(deployer.address);
    console.log("\n   ReputationCard:");
    console.log(`      Owner: ${repOwner}`);
    console.log(`      Deployer is authorized issuer: ${isIssuer ? '✅' : '❌'}`);

    // ============================================
    // Summary
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50) + "\n");
    
    console.log("📋 Contract Addresses:");
    console.log(`   ProfileNFT:      ${profileNFTAddress}`);
    console.log(`   ReputationCard:  ${reputationCardAddress}\n`);
    
    console.log("👤 Owner Account:");
    console.log(`   Address: ${deployer.address}\n`);
    
    console.log("✅ What was done:");
    console.log("   • Deployed ProfileNFT contract");
    console.log("   • Deployed ReputationCard contract");
    console.log("   • Authorized ReputationCard in ProfileNFT");
    console.log("   • Updated contract addresses in client/src/config/contracts.ts");
    console.log("   • Updated ABIs in client/src/config/*.abi.ts\n");
    
    console.log("🚀 Next Steps:");
    console.log("   1. Start your client: cd client && npm run dev");
    console.log("   2. Connect your wallet");
    console.log("   3. Create profiles and issue reputation cards!\n");
    
    return {
      profileNFT: profileNFTAddress,
      reputationCard: reputationCardAddress,
      owner: deployer.address
    };
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
