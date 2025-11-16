import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("Checking balance for:", deployerAddress);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  
  // Get balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Account has 0 balance!");
    console.log("You need to fund this account before deploying contracts.");
    console.log("\nFor Kusama Hub, you need KSM tokens.");
    console.log("See KUSAMA_DEPLOYMENT.md for funding instructions.");
  } else {
    console.log("\n✅ Account is funded and ready for deployment!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
