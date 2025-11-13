import { ethers } from "hardhat";

const PROFILE_NFT_ADDRESS = "0xAb1255206298cBCE5D14D98aC890B1760F04214c";
const USER_ADDRESS = "0x6cf8d3d7741daef75a9efdd87d72534933723145"; // The address from MetaMask

async function main() {
  console.log("Checking profile for address:", USER_ADDRESS);
  console.log("ProfileNFT contract:", PROFILE_NFT_ADDRESS);
  console.log("");

  const profileNFT = await ethers.getContractAt("ProfileNFT", PROFILE_NFT_ADDRESS);
  
  const profileId = await profileNFT.addressToProfileId(USER_ADDRESS);
  
  console.log("Profile ID:", profileId.toString());
  
  if (profileId === 0n) {
    console.log("\n❌ NO PROFILE FOUND!");
    console.log("\nThis is why the claim is failing.");
    console.log("The ReputationCard contract tries to look up the profile using:");
    console.log("  IProfileNFT(profileNFTContract).addressToProfileId(userAddress)");
    console.log("And it returns 0, which causes the transaction to revert.");
    console.log("\n✅ SOLUTION:");
    console.log("1. Go to the Create Profile page in your app");
    console.log("2. Create a new profile with your MetaMask wallet");
    console.log("3. Then try claiming the collectible again");
  } else {
    console.log("\n✅ Profile exists!");
    console.log("Profile ID:", profileId.toString());
    
    // Check if they own the NFT
    try {
      const owner = await profileNFT.ownerOf(profileId);
      console.log("Profile owner:", owner);
      
      if (owner.toLowerCase() === USER_ADDRESS.toLowerCase()) {
        console.log("✅ User owns this profile NFT");
      } else {
        console.log("❌ Profile NFT is owned by a different address!");
      }
    } catch (e) {
      console.log("❌ Could not verify ownership");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
