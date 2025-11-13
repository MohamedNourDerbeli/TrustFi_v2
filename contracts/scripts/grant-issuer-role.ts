import { ethers } from "hardhat";

// --- CONFIGURATION ---
const REPUTATION_CARD_ADDRESS = "0x086ADa1202aE6E8Cf96Ad5E01C02a084DbdD4bbD";
// This should be the wallet address that will be used by the Supabase Edge Function
// Get this from your .env file (the address corresponding to ISSUER_PRIVATE_KEY)
const ISSUER_WALLET_ADDRESS = "0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb"; // <-- UPDATE THIS

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Granting ISSUER_ROLE using admin account:", deployer.address);

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  // Get the ISSUER_ROLE from the contract
  const issuerRole = await reputationCard.ISSUER_ROLE();
  
  console.log(`Granting ISSUER_ROLE to: ${ISSUER_WALLET_ADDRESS}`);
  
  const tx = await reputationCard.grantRole(issuerRole, ISSUER_WALLET_ADDRESS);
  await tx.wait();

  console.log("✅ Transaction confirmed!");
  console.log(`Address ${ISSUER_WALLET_ADDRESS} now has the ISSUER_ROLE.`);
  console.log("\nThis wallet can now issue reputation cards via the Supabase Edge Function.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
