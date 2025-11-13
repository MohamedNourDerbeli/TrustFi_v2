const hre = require("hardhat");

async function main() {
  // The address you want to grant ISSUER_ROLE to
  const userAddress = process.env.USER_ADDRESS || "0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb";
  
  console.log(`Target user address: ${userAddress}`);

  // Replace with your deployed ReputationCard address
  const REPUTATION_CARD_ADDRESS = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

  const ReputationCard = await hre.ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);
  
  // Get the ISSUER_ROLE hash
  const issuerRole = await ReputationCard.ISSUER_ROLE();
  
  console.log(`Granting ISSUER_ROLE to ${userAddress}...`);
  
  const tx = await ReputationCard.grantRole(issuerRole, userAddress);
  await tx.wait();
  
  console.log(`✅ ISSUER_ROLE granted to ${userAddress}`);
  console.log(`Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
