import { ethers } from "hardhat";

const REPUTATION_CARD_ADDRESS = "0xC03c6513c7434784Ae78C9D4C9c205260fF6c3A5";

async function main() {
  console.log("📋 Checking templates on contract:", REPUTATION_CARD_ADDRESS);
  console.log();

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  const tierNames: { [key: number]: string } = {
    1: "Bronze",
    2: "Silver",
    3: "Gold"
  };

  for (let i = 1; i <= 5; i++) {
    try {
      const template = await reputationCard.templates(i);
      
      if (template.issuer === ethers.ZeroAddress) {
        console.log(`Template #${i}: ❌ Does not exist`);
      } else {
        console.log(`Template #${i}: ✅ EXISTS`);
        console.log(`  Issuer: ${template.issuer}`);
        console.log(`  Max Supply: ${template.maxSupply.toString()}`);
        console.log(`  Current Supply: ${template.currentSupply.toString()}`);
        console.log(`  Tier: ${template.tier} (${tierNames[Number(template.tier)] || 'Unknown'})`);
        console.log(`  Available: ${(template.maxSupply - template.currentSupply).toString()}`);
        console.log();
      }
    } catch (error) {
      console.log(`Template #${i}: ❌ Error checking`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
