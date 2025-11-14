import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer address:", deployerAddress);
  console.log("Deploying contracts...");

  // 1. Deploy ProfileNFT
  const ProfileNFT = await ethers.getContractFactory("ProfileNFT");
  // @ts-ignore
  const profileNFT = await ProfileNFT.deploy(deployerAddress);
  await profileNFT.waitForDeployment();
  const profileNFTAddress = await profileNFT.getAddress();
  console.log(`ProfileNFT deployed to: ${profileNFTAddress}`);

  // 2. Deploy ReputationCard
  const ReputationCard = await ethers.getContractFactory("ReputationCard");
  // @ts-ignore
  const reputationCard = await ReputationCard.deploy(deployerAddress, profileNFTAddress);
  await reputationCard.waitForDeployment();
  const reputationCardAddress = await reputationCard.getAddress();
  console.log(`ReputationCard deployed to: ${reputationCardAddress}`);

  // 3. Configure: Set ReputationCard address in ProfileNFT
  console.log("Configuring contracts...");
  try {
    // @ts-ignore
    const tx = await profileNFT.setReputationContract(reputationCardAddress);
    await tx.wait();
    console.log("ReputationCard contract address set in ProfileNFT.");
  } catch (error) {
    console.error("Error setting reputation contract:", error);
    throw error;
  }

  console.log(`Deployer (${deployerAddress}) has TEMPLATE_MANAGER_ROLE.`);
  
  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("ProfileNFT Address:", profileNFTAddress);
  console.log("ReputationCard Address:", reputationCardAddress);
  console.log("---------------------------");

  // 4. Update client files
  console.log("\nUpdating ABIs and addresses...");
  const clientLibPath = path.join(__dirname, "../../client/src/lib");
  
  // Update contracts.ts
  const contractsContent = `// Contract addresses - can be overridden via .env
export const PROFILE_NFT_CONTRACT_ADDRESS = 
  import.meta.env.VITE_PROFILE_NFT_ADDRESS || "${profileNFTAddress}";

export const REPUTATION_CARD_CONTRACT_ADDRESS = 
  import.meta.env.VITE_REPUTATION_CARD_ADDRESS || "${reputationCardAddress}";
`;
  fs.writeFileSync(path.join(clientLibPath, "contracts.ts"), contractsContent);
  console.log("✓ Updated contracts.ts");

  // Copy ABIs
  const artifactsPath = path.join(__dirname, "../artifacts/contracts");
  
  const profileNFTAbi = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "ProfileNFT.sol/ProfileNFT.json"), "utf8")
  ).abi;
  fs.writeFileSync(
    path.join(clientLibPath, "ProfileNFT.abi.json"),
    JSON.stringify(profileNFTAbi, null, 2)
  );
  console.log("✓ Updated ProfileNFT.abi.json");

  const reputationCardAbi = JSON.parse(
    fs.readFileSync(path.join(artifactsPath, "ReputationCard.sol/ReputationCard.json"), "utf8")
  ).abi;
  fs.writeFileSync(
    path.join(clientLibPath, "ReputationCard.abi.json"),
    JSON.stringify(reputationCardAbi, null, 2)
  );
  console.log("✓ Updated ReputationCard.abi.json");

  console.log("\n✅ Deployment and update complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
