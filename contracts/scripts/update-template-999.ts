// scripts/update-template-999.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Updating Template 999 parameters...\n");

  const REPUTATION_CARD_ADDRESS = process.env.REPUTATION_CARD_ADDRESS || "0x031dd3F0A6c6CC32C37426DEd81De794bb9dC28A";

  const [deployer] = await ethers.getSigners();
  console.log("📍 Updating from address:", deployer.address);

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  // Check current template
  const template = await reputationCard.templates(999);
  console.log("\n📋 Current Template 999 State:");
  console.log("─".repeat(50));
  console.log("   Issuer:", template.issuer);
  console.log("   Max Supply:", template.maxSupply.toString());
  console.log("   Current Supply:", template.currentSupply.toString());
  console.log("   Tier:", template.tier.toString());
  console.log("   Start Time:", template.startTime.toString());
  console.log("   End Time:", template.endTime.toString());
  console.log("   Is Paused:", template.isPaused);

  console.log("\n🔄 Updating template with:");
  console.log("   Max Supply: 0 (unlimited)");
  console.log("   Start Time: 0 (immediate)");
  console.log("   End Time: 0 (no expiry)");

  const tx = await reputationCard.updateTemplate(
    999,  // templateId
    0,    // maxSupply (unlimited)
    0,    // startTime (immediate)
    0     // endTime (no expiry)
  );

  console.log("\n📝 Transaction hash:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Template updated in block:", receipt?.blockNumber);

  // Verify update
  const updatedTemplate = await reputationCard.templates(999);
  console.log("\n✅ Updated Template 999:");
  console.log("─".repeat(50));
  console.log("   Max Supply:", updatedTemplate.maxSupply.toString());
  console.log("   Start Time:", updatedTemplate.startTime.toString());
  console.log("   End Time:", updatedTemplate.endTime.toString());
  console.log("\n✨ Template 999 is now ready for unlimited claims!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
