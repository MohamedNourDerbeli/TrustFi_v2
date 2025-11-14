import { ethers } from "hardhat";

// --- CONFIGURATION ---
const REPUTATION_CARD_ADDRESS = "0xC03c6513c7434784Ae78C9D4C9c205260fF6c3A5"; // ReputationCard on Moonbase Alpha
const ISSUER_WALLET_ADDRESS = "0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb"; // The Issuer wallet address

// --- TEMPLATE DETAILS ---
const TEMPLATE_ID = 1; // The unique ID for our new collectible
const MAX_SUPPLY = 100; // Only 100 of these can ever be minted
const TIER = 2; // This will be a "Silver" tier card

async function main() {
  // For now, we'll use the deployer as the issuer since we granted them TEMPLATE_MANAGER_ROLE
  // In production, you'd use a separate issuer wallet
  const [issuerSigner] = await ethers.getSigners();

  console.log(`Creating template using account: ${issuerSigner.address}`);

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS, issuerSigner);

  console.log(`Creating on-chain template with ID ${TEMPLATE_ID}...`);
  console.log(`  - Issuer: ${issuerSigner.address}`);
  console.log(`  - Max Supply: ${MAX_SUPPLY}`);
  console.log(`  - Tier: ${TIER}`);
  
  const tx = await reputationCard.createTemplate(
    TEMPLATE_ID,
    issuerSigner.address, // The issuer is the signer itself
    MAX_SUPPLY,
    TIER
  );
  
  await tx.wait();

  console.log("✅ Transaction confirmed!");
  console.log(`Template ${TEMPLATE_ID} has been created on-chain.`);
  console.log("\nNext steps:");
  console.log("1. Add template metadata to Supabase collectible_templates table");
  console.log("2. Create generate-signature Supabase function");
  console.log("3. Update CollectiblesPage to use signature-based claiming");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
