const hre = require("hardhat");

async function main() {
  // Get the default signer (first account from Hardhat node)
  const [sender] = await hre.ethers.getSigners();
  
  // Your address to fund - can be passed as environment variable or use default
  const recipientAddress = "0x6cf8d3d7741daef75a9efdd87d72534933723145";
  
  // Amount to send (10 ETH)
  const amountInEther = "1";
  const amountInWei = hre.ethers.parseEther(amountInEther);
  
  console.log(`Funding account ${recipientAddress}...`);
  console.log(`Sender: ${sender.address}`);
  console.log(`Amount: ${amountInEther} ETH`);
  
  // Send the transaction
  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amountInWei
  });
  
  console.log(`Transaction hash: ${tx.hash}`);
  
  // Wait for confirmation
  await tx.wait();
  
  console.log(`✅ Successfully sent ${amountInEther} ETH to ${recipientAddress}`);
  
  // Check the new balance
  const balance = await hre.ethers.provider.getBalance(recipientAddress);
  console.log(`New balance: ${hre.ethers.formatEther(balance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
