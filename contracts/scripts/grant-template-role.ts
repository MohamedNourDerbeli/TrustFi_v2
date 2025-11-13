import { ethers } from "hardhat";

// --- CONFIGURATION ---
const REPUTATION_CARD_ADDRESS = "0x74Ba1C03cBfCCa0A3B0e2f5558140307FaEa9725"; // ReputationCard on Moonbase Alpha
const ISSUER_WALLET_ADDRESS = "0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb"; // The Issuer wallet address

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Granting roles using the Owner account:", deployer.address);

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  // Get the keccak256 hash of the role string
  const templateManagerRole = ethers.keccak256(ethers.toUtf8Bytes("TEMPLATE_MANAGER_ROLE"));

  console.log(`Granting TEMPLATE_MANAGER_ROLE to: ${ISSUER_WALLET_ADDRESS}`);
  
  const tx = await reputationCard.grantRole(templateManagerRole, ISSUER_WALLET_ADDRESS);
  await tx.wait();

  console.log("✅ Transaction confirmed!");
  console.log(`Address ${ISSUER_WALLET_ADDRESS} now has the TEMPLATE_MANAGER_ROLE.`);
  console.log("\nThis wallet can now create collectible templates on-chain.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
