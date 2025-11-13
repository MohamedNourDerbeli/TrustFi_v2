import { ethers } from "hardhat";

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
  // @ts-ignore - Contract method exists but types not generated
  const tx = await profileNFT.setScoreProvider(reputationCardAddress);
  await tx.wait();
  console.log("ReputationCard contract set as the official SCORE_PROVIDER_ROLE.");

  // 4. Grant ISSUER_ROLE to the deployer for testing purposes
  // @ts-ignore - Contract method exists but types not generated
  const issuerRole = await reputationCard.ISSUER_ROLE();
  // @ts-ignore - Contract method exists but types not generated
  const tx2 = await reputationCard.grantRole(issuerRole, deployerAddress);
  await tx2.wait();
  console.log(`Deployer (${deployerAddress}) has been granted ISSUER_ROLE.`);
  
  console.log("\n--- DEPLOYMENT & CONFIGURATION COMPLETE ---");
  console.log("ProfileNFT Address:", profileNFTAddress);
  console.log("ReputationCard Address:", reputationCardAddress);
  console.log("-------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
