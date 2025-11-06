const { ethers } = require("hardhat");

async function main() {
  // Simple configuration - just edit these values
  const RECIPIENT = "0x91e1c3ecb63b6be4512dbf367e9a822b06459993"; // Your target address
  const AMOUNT = "100"; // Change this amount (in ETH)

  // Get the first signer (uses Hardhat's default accounts)
  const [signer] = await ethers.getSigners();
  
  console.log(`Sending ${AMOUNT} ETH`);
  console.log(`From: ${signer.address}`);
  console.log(`To: ${RECIPIENT}`);

  // Send transaction
  const tx = await signer.sendTransaction({
    to: RECIPIENT,
    value: ethers.parseEther(AMOUNT)
  });

  console.log(`Transaction: ${tx.hash}`);
  await tx.wait();
  console.log("✅ Done!");
}

main().catch(console.error);