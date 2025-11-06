const { ethers } = require("hardhat");

async function main() {
  console.log("👤 Profile Debug Script");
  console.log("=======================\n");

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const [signer] = await ethers.getSigners();
  
  // Get contract addresses from config
  const chainId = 31337; // Hardhat local
  const profileNFTAddress = "0xedaaAa2393De28d15cacCBa6933B1b24215a8699"; // Current deployed address
  
  const profileNFTABI = [
    "function getProfile(uint256 tokenId) view returns (tuple(string name, string bio, uint256 reputationScore, uint256 createdAt, bool isActive))",
    "function getProfileByOwner(address owner) view returns (uint256 tokenId, tuple(string name, string bio, uint256 reputationScore, uint256 createdAt, bool isActive) profile)",
    "function totalProfiles() view returns (uint256)"
  ];

  const contract = new ethers.Contract(profileNFTAddress, profileNFTABI, signer);

  try {
    // Check total profiles
    const totalProfilesBigInt = await contract.totalProfiles();
    const totalProfiles = Number(totalProfilesBigInt);
    console.log(`Total profiles: ${totalProfiles}\n`);

    // Check profiles 1 and 2
    for (let i = 1; i <= Math.min(totalProfiles, 3); i++) {
      try {
        const profile = await contract.getProfile(i);
        const createdAtSeconds = Number(profile.createdAt);
        const createdAtDate = new Date(createdAtSeconds * 1000);
        const nowSeconds = Math.floor(Date.now() / 1000);
        const ageInDays = Math.floor((nowSeconds - createdAtSeconds) / (24 * 60 * 60));
        
        console.log(`Profile #${i}:`);
        console.log(`  Name: ${profile.name}`);
        console.log(`  Created At (timestamp): ${createdAtSeconds}`);
        console.log(`  Created At (date): ${createdAtDate.toISOString()}`);
        console.log(`  Age in days: ${ageInDays}`);
        console.log(`  Is Active: ${profile.isActive}\n`);
      } catch (error) {
        console.log(`Profile #${i}: Not found or error - ${error.message}\n`);
      }
    }

    // Current time for reference
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Current timestamp: ${Math.floor(Date.now() / 1000)}`);

  } catch (error) {
    console.error("Error:", error.message);
    console.log("\n💡 Make sure:");
    console.log("1. Hardhat node is running");
    console.log("2. Contracts are deployed");
    console.log("3. Profile NFT address is correct");
  }
}

main().catch(console.error);