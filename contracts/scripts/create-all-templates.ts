import { ethers } from "hardhat";

const REPUTATION_CARD_ADDRESS = "0xC03c6513c7434784Ae78C9D4C9c205260fF6c3A5";

async function main() {
  const [issuerSigner] = await ethers.getSigners();
  console.log(`Creating templates using account: ${issuerSigner.address}\n`);

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS, issuerSigner);

  const templates = [
    { id: 2, maxSupply: 50, tier: 3, name: "Advanced Web3 Developer (Gold)" },
    { id: 3, maxSupply: 200, tier: 1, name: "Community Contributor (Bronze)" },
  ];

  for (const template of templates) {
    console.log(`Creating template #${template.id}: ${template.name}`);
    console.log(`  Max Supply: ${template.maxSupply}`);
    console.log(`  Tier: ${template.tier}`);
    
    try {
      const tx = await reputationCard.createTemplate(
        template.id,
        issuerSigner.address,
        template.maxSupply,
        template.tier
      );
      
      await tx.wait();
      console.log(`✅ Template #${template.id} created!\n`);
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }

  console.log("Done!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
