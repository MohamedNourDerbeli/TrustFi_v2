import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  const network = await ethers.provider.getNetwork();
  console.log(`Verifying template 999 on ${network.name} (Chain ID: ${network.chainId})...`);
  console.log("Deployer address:", deployerAddress);
  
  // ReputationCard contract address (Moonbase Alpha)
  const REPUTATION_CARD_ADDRESS = "0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591";
  
  console.log("\nConnecting to ReputationCard contract at:", REPUTATION_CARD_ADDRESS);
  
  // Get contract instance
  const ReputationCard = await ethers.getContractFactory("ReputationCard");
  const reputationCard = ReputationCard.attach(REPUTATION_CARD_ADDRESS);
  
  const templateId = 999;
  
  console.log("\n--- TEMPLATE 999 VERIFICATION ---");
  
  // Get template details
  const template = await reputationCard.templates(templateId);
  
  console.log("\nTemplate Details:");
  console.log("  Template ID:", templateId);
  console.log("  Issuer:", template.issuer);
  console.log("  Max Supply:", template.maxSupply.toString(), template.maxSupply === 0n ? "(unlimited)" : "");
  console.log("  Current Supply:", template.currentSupply.toString());
  console.log("  Tier:", template.tier.toString());
  console.log("  Start Time:", template.startTime.toString(), template.startTime === 0n ? "(immediate)" : "");
  console.log("  End Time:", template.endTime.toString(), template.endTime === 0n ? "(no expiry)" : "");
  console.log("  Is Paused:", template.isPaused);
  
  // Get tier score
  const tierScore = await reputationCard.tierToScore(template.tier);
  console.log("  Tier Score Value:", tierScore.toString(), "points");
  
  // Verify expected values
  console.log("\n--- VERIFICATION RESULTS ---");
  
  const checks = [
    { name: "Template ID is 999", pass: templateId === 999 },
    { name: "Issuer is set", pass: template.issuer !== ethers.ZeroAddress },
    { name: "Max Supply is 0 (unlimited)", pass: template.maxSupply === 0n },
    { name: "Tier is 3", pass: template.tier === 3n },
    { name: "Start Time is 0 (immediate)", pass: template.startTime === 0n },
    { name: "End Time is 0 (no expiry)", pass: template.endTime === 0n },
    { name: "Not paused", pass: !template.isPaused },
    { name: "Tier 3 worth 200 points", pass: tierScore === 200n }
  ];
  
  let allPassed = true;
  for (const check of checks) {
    const status = check.pass ? "✅" : "❌";
    console.log(`${status} ${check.name}`);
    if (!check.pass) allPassed = false;
  }
  
  console.log("\n" + (allPassed ? "✅ All checks passed!" : "❌ Some checks failed!"));
  console.log("----------------------------");
  
  if (allPassed) {
    console.log("\n🎉 Template 999 (Kusama Living Profile) is correctly configured on-chain!");
    console.log("\nNext steps:");
    console.log("  1. Deploy the dynamic-metadata Edge Function (Task 5)");
    console.log("  2. Configure the database template record (Task 7)");
    console.log("  3. Update the CollectiblesPage component (Task 8)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
