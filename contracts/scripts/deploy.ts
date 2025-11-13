import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer address:", deployerAddress);
  console.log("Deploying final contracts...");

  // 1. Deploy ProfileNFT
  const ProfileNFT = await ethers.getContractFactory("ProfileNFT");
  // @ts-ignore - Hardhat typing issue with deploy arguments
  const profileNFT = await ProfileNFT.deploy(deployerAddress);
  await profileNFT.waitForDeployment();
  const profileNFTAddress = await profileNFT.getAddress();
  console.log(`ProfileNFT deployed to: ${profileNFTAddress}`);

  // 2. Deploy ReputationCard, linking it to the ProfileNFT contract
  const ReputationCard = await ethers.getContractFactory("ReputationCard");
  // @ts-ignore - Hardhat typing issue with deploy arguments
  const reputationCard = await ReputationCard.deploy(deployerAddress, profileNFTAddress);
  await reputationCard.waitForDeployment();
  const reputationCardAddress = await reputationCard.getAddress();
  console.log(`ReputationCard deployed to: ${reputationCardAddress}`);

  // 3. Configure roles: Set the ReputationCard contract as the SCORE_PROVIDER in ProfileNFT
  console.log("Configuring roles...");
  try {
    // @ts-ignore - Contract method exists but types not generated
    const tx = await profileNFT.setScoreProvider(reputationCardAddress);
    await tx.wait();
    console.log("ReputationCard contract set as the official SCORE_PROVIDER_ROLE.");
  } catch (error) {
    console.error("Error setting score provider:", error);
    throw error;
  }

  // 4. Grant TEMPLATE_MANAGER_ROLE to the deployer (already has it from constructor, but confirming)
  console.log(`Deployer (${deployerAddress}) has TEMPLATE_MANAGER_ROLE (granted in constructor).`);
  
  console.log("\n--- DEPLOYMENT & CONFIGURATION COMPLETE ---");
  console.log("ProfileNFT Address:", profileNFTAddress);
  console.log("ReputationCard Address:", reputationCardAddress);
  console.log("-------------------------------------------");

  // 5. Update contract addresses in client
  console.log("\nUpdating contract addresses and ABIs...");
  const clientLibPath = path.join(__dirname, "../../client/src/lib");
  
  // Update contracts.ts
  const contractsContent = `// Contract addresses deployed on localhost
export const PROFILE_NFT_CONTRACT_ADDRESS = "${profileNFTAddress}" as const;
export const REPUTATION_CARD_CONTRACT_ADDRESS = "${reputationCardAddress}" as const;
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

  // Update generate-signature function with new address
  const supabaseFunctionPath = path.join(__dirname, "../../client/supabase/functions/generate-signature/index.ts");
  try {
    let functionContent = fs.readFileSync(supabaseFunctionPath, "utf8");
    functionContent = functionContent.replace(
      /verifyingContract: '0x[a-fA-F0-9]{40}'/,
      `verifyingContract: '${reputationCardAddress}'`
    );
    fs.writeFileSync(supabaseFunctionPath, functionContent);
    console.log("✓ Updated generate-signature function address");
  } catch (e) {
    console.log("⚠ Could not update generate-signature function (file may not exist)");
  }

  console.log("\n✅ All files updated successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
