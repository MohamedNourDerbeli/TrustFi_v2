const { ethers } = require("hardhat");

async function main() {
  // Simple configuration - just edit these values
  const RECIPIENTS = [
    "0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5",
    "0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb",
    "0x91e1c3ecb63b6be4512dbf367e9a822b06459993"
  ];
  const AMOUNT = "5"; // Amount per recipient (in ETH)

  // Get signers - use account #1 (index 1) which has 10,000 ETH on local network
  // Account #0 is often used for deployments, so we use #1 for sending
  const signers = await ethers.getSigners();
  const signer = signers[1] || signers[0]; // Fallback to first account if only one exists
  
  // Check balance first
  const balance = await ethers.provider.getBalance(signer.address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log(`\n💰 Sender Balance: ${balanceInEth} ETH`);
  console.log(`📤 Sending: ${AMOUNT} ETH to each recipient`);
  console.log(`📍 From: ${signer.address}`);
  console.log(`👥 Recipients: ${RECIPIENTS.length}`);
  
  // Check if sender has enough balance for all recipients
  const amountToSend = ethers.parseEther(AMOUNT);
  const totalAmount = amountToSend * BigInt(RECIPIENTS.length);
  
  // Add some buffer for gas costs
  const gasBuffer = ethers.parseEther("0.1");
  const totalNeeded = totalAmount + gasBuffer;
  
  if (balance < totalNeeded) {
    console.error(`\n❌ Error: Insufficient balance!`);
    console.error(`   Need: ${ethers.formatEther(totalNeeded)} ETH (${AMOUNT} ETH × ${RECIPIENTS.length} + gas)`);
    console.error(`   Have: ${balanceInEth} ETH`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Run on local network: npx hardhat node (accounts have 10,000 ETH)`);
    console.error(`   2. Then in another terminal: npx hardhat run scripts/send.js --network localhost`);
    console.error(`   3. Or reduce AMOUNT in the script`);
    process.exit(1);
  }

  // Send transactions to all recipients
  console.log(`\n⏳ Sending transactions...`);
  const txPromises = [];
  
  for (let i = 0; i < RECIPIENTS.length; i++) {
    const recipient = RECIPIENTS[i];
    console.log(`\n📍 [${i + 1}/${RECIPIENTS.length}] To: ${recipient}`);
    
    const tx = await signer.sendTransaction({
      to: recipient,
      value: amountToSend
    });
    
    console.log(`   📝 Transaction Hash: ${tx.hash}`);
    txPromises.push(tx.wait());
  }

  console.log(`\n⏳ Waiting for all confirmations...`);
  await Promise.all(txPromises);
  
  // Show new balance
  const newBalance = await ethers.provider.getBalance(signer.address);
  const newBalanceInEth = ethers.formatEther(newBalance);
  
  console.log(`\n✅ All transactions confirmed!`);
  console.log(`💰 New Balance: ${newBalanceInEth} ETH`);
  console.log(`📊 Total Sent: ${ethers.formatEther(totalAmount)} ETH (${AMOUNT} ETH × ${RECIPIENTS.length})`);
  console.log(`\n✨ Recipients:`);
  RECIPIENTS.forEach((addr, i) => {
    console.log(`   ${i + 1}. ${addr} - ${AMOUNT} ETH`);
  });
}

main().catch(console.error);