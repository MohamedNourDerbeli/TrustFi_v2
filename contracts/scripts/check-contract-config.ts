import { ethers } from "hardhat";

const REPUTATION_CARD_ADDRESS = "0x4BfAe884ED15192caE5CA84A46E568Ff0C2fba1D";

async function main() {
  console.log("Checking ReputationCard configuration...\n");

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  // Get the ProfileNFT address stored in the contract
  const profileNFTAddress = await reputationCard.profileNFTContract();
  console.log("ProfileNFT address in ReputationCard:", profileNFTAddress);
  console.log("Expected ProfileNFT address:", "0xAb1255206298cBCE5D14D98aC890B1760F04214c");
  
  if (profileNFTAddress.toLowerCase() !== "0xAb1255206298cBCE5D14D98aC890B1760F04214c".toLowerCase()) {
    console.log("\n❌ MISMATCH! The ReputationCard contract has a different ProfileNFT address.");
    console.log("This is why the transaction is failing.");
    console.log("\nSolution: Redeploy both contracts together.");
  } else {
    console.log("\n✅ Addresses match!");
  }

  // Check template #1
  console.log("\nChecking Template #1...");
  const template = await reputationCard.templates(1);
  console.log("Template #1:");
  console.log("  Issuer:", template.issuer);
  console.log("  Max Supply:", template.maxSupply.toString());
  console.log("  Current Supply:", template.currentSupply.toString());
  console.log("  Tier:", template.tier);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
