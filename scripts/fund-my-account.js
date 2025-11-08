// Send ETH from a default Hardhat account to your custom account
const hre = require("hardhat");

async function main() {
  // Your current account from .env
  const yourAddress = "0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5";
  
  // Amount to send (in ETH)
  const amountToSend = "5000"; // 5000 ETH
  
  console.log("\n💰 Funding Your Account\n");
  
  // Use a default Hardhat account directly (not from config)
  const funderPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const funder = new hre.ethers.Wallet(funderPrivateKey, hre.ethers.provider);
  
  console.log(`From: ${funder.address}`);
  console.log(`To: ${yourAddress}`);
  console.log(`Amount: ${amountToSend} ETH\n`);
  
  // Check balances before
  const yourBalanceBefore = await hre.ethers.provider.getBalance(yourAddress);
  const funderBalanceBefore = await hre.ethers.provider.getBalance(funder.address);
  
  console.log("📊 Balances Before:");
  console.log(`  Your account: ${hre.ethers.formatEther(yourBalanceBefore)} ETH`);
  console.log(`  Funder account: ${hre.ethers.formatEther(funderBalanceBefore)} ETH\n`);
  
  // Send ETH
  console.log("🚀 Sending transaction...");
  const tx = await funder.sendTransaction({
    to: yourAddress,
    value: hre.ethers.parseEther(amountToSend)
  });
  
  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("✅ Transaction confirmed!\n");
  
  // Check balances after
  const yourBalanceAfter = await hre.ethers.provider.getBalance(yourAddress);
  const funderBalanceAfter = await hre.ethers.provider.getBalance(funder.address);
  
  console.log("📊 Balances After:");
  console.log(`  Your account: ${hre.ethers.formatEther(yourBalanceAfter)} ETH`);
  console.log(`  Funder account: ${hre.ethers.formatEther(funderBalanceAfter)} ETH\n`);
  
  console.log("🎉 Done! Refresh MetaMask to see your new balance.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
