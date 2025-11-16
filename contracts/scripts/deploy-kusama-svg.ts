import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying KusamaSVGArt contract to ${network.name} (Chain ID: ${network.chainId})...`);
  console.log("Deployer address:", deployerAddress);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Account has 0 balance!");
    console.log("Deployment will fail. Please fund your account first.");
    return;
  }
  
  // Deploy KusamaSVGArt
  const KusamaSVGArt = await ethers.getContractFactory("KusamaSVGArt");
  console.log("Deploying contract...");
  
  const kusamaSVGArt = await KusamaSVGArt.deploy();
  await kusamaSVGArt.waitForDeployment();
  
  const contractAddress = await kusamaSVGArt.getAddress();
  console.log(`✅ KusamaSVGArt deployed to: ${contractAddress}`);
  
  // Verify contract functionality with test inputs
  console.log("\nVerifying contract functionality...");
  
  const testScores = [25, 75, 200, 500, 900];
  
  for (const score of testScores) {
    try {
      // Test generateSVG
      const svg = await kusamaSVGArt.generateSVG(score);
      console.log(`✓ Score ${score}: Generated SVG (${svg.length} chars)`);
      
      // Test tokenMetadata
      const metadata = await kusamaSVGArt.tokenMetadata(1, score, "Kusama Living Profile");
      const base64Data = metadata.split(",")[1];
      const jsonStr = Buffer.from(base64Data, "base64").toString("utf-8");
      const json = JSON.parse(jsonStr);
      
      console.log(`  - Name: ${json.name}`);
      console.log(`  - Attributes: Score=${json.attributes[0].value}`);
      console.log(`  - Image URI length: ${json.image.length} chars`);
    } catch (error: any) {
      console.error(`✗ Score ${score}: Failed - ${error.message}`);
      throw error;
    }
  }
  
  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("Contract Address:", contractAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`KUSAMA_SVG_CONTRACT_ADDRESS="${contractAddress}"`);
  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("---------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
