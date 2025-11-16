import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  const network = await ethers.provider.getNetwork();
  console.log(`Creating template 999 on ${network.name} (Chain ID: ${network.chainId})...`);
  console.log("Deployer address:", deployerAddress);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Account has 0 balance!");
    console.log("Transaction will fail. Please fund your account first.");
    return;
  }
  
  // ReputationCard contract address (Moonbase Alpha)
  const REPUTATION_CARD_ADDRESS = "0x8a58D43E1E70D6DBa811a452de7Acb30aCf06591";
  
  console.log("\nConnecting to ReputationCard contract at:", REPUTATION_CARD_ADDRESS);
  
  // Get contract instance
  const ReputationCard = await ethers.getContractFactory("ReputationCard");
  const reputationCard = ReputationCard.attach(REPUTATION_CARD_ADDRESS);
  
  // Template parameters
  const templateId = 999;
  const issuer = deployerAddress; // Using deployer as issuer
  const maxSupply = 0; // Unlimited
  const tier = 3; // Highest tier (200 points)
  const startTime = 0; // Immediate
  const endTime = 0; // No expiry
  
  console.log("\nTemplate Parameters:");
  console.log("  Template ID:", templateId);
  console.log("  Issuer:", issuer);
  console.log("  Max Supply:", maxSupply, "(unlimited)");
  console.log("  Tier:", tier);
  console.log("  Start Time:", startTime, "(immediate)");
  console.log("  End Time:", endTime, "(no expiry)");
  
  // Check if deployer has TEMPLATE_MANAGER_ROLE
  const TEMPLATE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TEMPLATE_MANAGER_ROLE"));
  const hasRole = await reputationCard.hasRole(TEMPLATE_MANAGER_ROLE, deployerAddress);
  
  console.log("\nChecking permissions...");
  console.log("  TEMPLATE_MANAGER_ROLE:", TEMPLATE_MANAGER_ROLE);
  console.log("  Has role:", hasRole);
  
  if (!hasRole) {
    console.log("\n❌ ERROR: Deployer does not have TEMPLATE_MANAGER_ROLE");
    console.log("The deployer account needs to be granted TEMPLATE_MANAGER_ROLE by the contract admin.");
    console.log("\nTo grant the role, the admin needs to call:");
    console.log(`  grantRole(${TEMPLATE_MANAGER_ROLE}, ${deployerAddress})`);
    return;
  }
  
  // Check if template already exists
  try {
    const existingTemplate = await reputationCard.templates(templateId);
    if (existingTemplate.issuer !== ethers.ZeroAddress) {
      console.log("\n⚠️  Template 999 already exists!");
      console.log("Existing template details:");
      console.log("  Issuer:", existingTemplate.issuer);
      console.log("  Max Supply:", existingTemplate.maxSupply.toString());
      console.log("  Current Supply:", existingTemplate.currentSupply.toString());
      console.log("  Tier:", existingTemplate.tier);
      console.log("  Is Paused:", existingTemplate.isPaused);
      return;
    }
  } catch (error) {
    // Template doesn't exist, continue
  }
  
  console.log("\nCreating template...");
  
  try {
    const tx = await reputationCard.createTemplate(
      templateId,
      issuer,
      maxSupply,
      tier,
      startTime,
      endTime
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);
    
    // Verify template was created
    console.log("\nVerifying template creation...");
    const template = await reputationCard.templates(templateId);
    
    console.log("\n--- TEMPLATE 999 CREATED ---");
    console.log("Template ID:", templateId);
    console.log("Issuer:", template.issuer);
    console.log("Max Supply:", template.maxSupply.toString());
    console.log("Current Supply:", template.currentSupply.toString());
    console.log("Tier:", template.tier);
    console.log("Start Time:", template.startTime.toString());
    console.log("End Time:", template.endTime.toString());
    console.log("Is Paused:", template.isPaused);
    console.log("----------------------------");
    
  } catch (error: any) {
    console.error("\n❌ Failed to create template:");
    console.error(error.message);
    
    if (error.message.includes("TEMPLATE_MANAGER_ROLE")) {
      console.log("\n⚠️  The deployer account does not have TEMPLATE_MANAGER_ROLE");
      console.log("Please ensure the account has the required role to create templates.");
    }
    
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
