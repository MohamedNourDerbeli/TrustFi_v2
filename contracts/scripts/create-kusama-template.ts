// scripts/create-kusama-template.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Creating Kusama Living Profile Template (999)...\n");

  const REPUTATION_CARD_ADDRESS = process.env.REPUTATION_CARD_ADDRESS || "0x60BdA778B580262376aAd0Bc8a15AEe374168559";
  const DYNAMIC_METADATA_BASE_URI = process.env.DYNAMIC_METADATA_BASE_URI || "https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId=";

  const [deployer] = await ethers.getSigners();
  console.log("📍 Creating from address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  // Check if template already exists
  try {
    const existingTemplate = await reputationCard.templates(999);
    if (existingTemplate.issuer !== ethers.ZeroAddress) {
      console.log("⚠️  Template 999 already exists!");
      console.log("   Issuer:", existingTemplate.issuer);
      console.log("   Tier:", existingTemplate.tier.toString());
      console.log("   Is Paused:", existingTemplate.isPaused);
      
      // Ask if user wants to update
      console.log("\n💡 If you want to update the issuer, use:");
      console.log("   await reputationCard.updateTemplateIssuer(999, newIssuerAddress);");
      return;
    }
  } catch (error) {
    // Template doesn't exist, continue
  }

  console.log("📋 Template Configuration:");
  console.log("─".repeat(50));
  console.log("   Template ID: 999");
  console.log("   Issuer:", deployer.address);
  console.log("   Tier: 3 (Gold)");
  console.log("   Max Supply: 0 (Unlimited)");
  console.log("   Token URI:", DYNAMIC_METADATA_BASE_URI);
  console.log("   Start Time: 0 (Immediate)");
  console.log("   End Time: 0 (No expiry)");

  console.log("\n⏳ Creating template...");

  const tx = await reputationCard.createTemplate(
    999, // templateId
    deployer.address, // issuer (you)
    0, // maxSupply (unlimited)
    3, // tier (Gold)
    0, // startTime (immediate)
    0  // endTime (no expiry)
  );

  console.log("📝 Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Template created in block:", receipt?.blockNumber);

  // Verify creation
  const template = await reputationCard.templates(999);
  console.log("\n✅ Template 999 Created Successfully!");
  console.log("─".repeat(50));
  console.log("   Issuer:", template.issuer);
  console.log("   Tier:", template.tier.toString());
  console.log("   Max Supply:", template.maxSupply.toString());
  console.log("   Token URI:", template.tokenUri);

  console.log("\n📝 Next Steps:");
  console.log("─".repeat(50));
  console.log("1. Set ISSUER_PRIVATE_KEY in Supabase secrets");
  console.log("   - Must be the private key for:", deployer.address);
  console.log("2. Set REPUTATION_CARD_CONTRACT_ADDRESS in Supabase");
  console.log("   - Value:", REPUTATION_CARD_ADDRESS);
  console.log("3. Deploy the Edge Function:");
  console.log("   cd client && supabase functions deploy generate-signature");
  console.log("4. Try claiming the Kusama Living Profile!");

  console.log("\n" + "=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
