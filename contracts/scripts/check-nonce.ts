import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  
  console.log("Checking account:", address);
  
  // Get current nonce
  const nonce = await deployer.getNonce();
  console.log("Current nonce:", nonce);
  
  // Get pending nonce
  const pendingNonce = await deployer.getNonce("pending");
  console.log("Pending nonce:", pendingNonce);
  
  // Get balance
  const balance = await ethers.provider.getBalance(address);
  console.log("Balance:", ethers.formatEther(balance), "DEV");
  
  if (nonce !== pendingNonce) {
    console.log("\n⚠️  Warning: There are pending transactions!");
    console.log("Pending transactions:", pendingNonce - nonce);
    console.log("\nOptions:");
    console.log("1. Wait for pending transactions to complete");
    console.log("2. Speed up the transaction with higher gas");
    console.log("3. Cancel the transaction by sending 0 ETH to yourself with same nonce");
  } else {
    console.log("\n✅ No pending transactions");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
