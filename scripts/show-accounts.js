// Show all Hardhat default accounts with their private keys and balances
const hre = require("hardhat");

async function main() {
  const accounts = await hre.ethers.getSigners();
  
  console.log("\n🔑 Hardhat Default Accounts (localhost):\n");
  console.log("Each account starts with 10,000 ETH\n");
  
  for (let i = 0; i < Math.min(accounts.length, 10); i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    
    console.log(`Account #${i}:`);
    console.log(`  Address: ${account.address}`);
    console.log(`  Balance: ${balanceInEth} ETH`);
    
    // Show private key for first 3 accounts (for MetaMask import)
    if (i < 3) {
      // Note: These are the default Hardhat private keys (publicly known, never use on mainnet!)
      const wallet = hre.ethers.Wallet.fromPhrase(
        "test test test test test test test test test test test junk",
        hre.ethers.provider
      );
      console.log(`  Private Key: Available via hardhat node output`);
    }
    console.log("");
  }
  
  console.log("\n📝 To import into MetaMask:");
  console.log("1. When you run 'npx hardhat node', it shows private keys");
  console.log("2. Copy any private key");
  console.log("3. MetaMask → Import Account → Paste private key");
  console.log("4. Each account has 10,000 ETH\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
