// scripts/check-template-999.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking Template 999 (Kusama Living Profile)...\n");

  // Get contract addresses from environment
  const REPUTATION_CARD_ADDRESS = process.env.REPUTATION_CARD_ADDRESS || "0x60BdA778B580262376aAd0Bc8a15AEe374168559";
  const PROFILE_NFT_ADDRESS = process.env.PROFILE_NFT_ADDRESS || "0x312349142940f3FDfC33588a6cdeADC7aDE35f40";

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("📍 Checking from address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");

  // Get contracts
  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);
  const profileNFT = await ethers.getContractAt("ProfileNFT", PROFILE_NFT_ADDRESS);

  // Check if template 999 exists
  console.log("📋 Template 999 Details:");
  console.log("─".repeat(50));
  
  try {
    const template = await reputationCard.templates(999);
    
    console.log("✅ Template exists!");
    console.log("   Issuer:", template.issuer);
    console.log("   Tier:", template.tier.toString());
    console.log("   Is Paused:", template.isPaused);
    console.log("   Current Supply:", template.currentSupply.toString());
    console.log("   Max Supply:", template.maxSupply.toString());
    console.log("   Start Time:", template.startTime.toString(), template.startTime > 0n ? `(${new Date(Number(template.startTime) * 1000).toLocaleString()})` : "(No start time)");
    console.log("   End Time:", template.endTime.toString(), template.endTime > 0n ? `(${new Date(Number(template.endTime) * 1000).toLocaleString()})` : "(No end time)");
    console.log("   Token URI:", template.tokenUri);
    
    // Check if issuer matches deployer
    console.log("\n🔑 Issuer Check:");
    console.log("─".repeat(50));
    if (template.issuer.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ You ARE the issuer for this template");
    } else {
      console.log("❌ You are NOT the issuer for this template");
      console.log("   Template issuer:", template.issuer);
      console.log("   Your address:", deployer.address);
    }

    // Check tier score
    console.log("\n⭐ Tier Configuration:");
    console.log("─".repeat(50));
    const tierScore = await reputationCard.tierToScore(template.tier);
    console.log("   Tier", template.tier.toString(), "score:", tierScore.toString());
    if (tierScore === 0n) {
      console.log("   ❌ WARNING: Tier score is 0 (invalid)");
    } else {
      console.log("   ✅ Tier score is valid");
    }

    // Check if template is claimable
    console.log("\n🎯 Claimability:");
    console.log("─".repeat(50));
    const now = Math.floor(Date.now() / 1000);
    
    if (template.isPaused) {
      console.log("❌ Template is PAUSED");
    } else {
      console.log("✅ Template is NOT paused");
    }
    
    if (template.maxSupply > 0n && template.currentSupply >= template.maxSupply) {
      console.log("❌ Max supply reached");
    } else {
      console.log("✅ Supply available:", template.maxSupply > 0n ? `${template.currentSupply}/${template.maxSupply}` : "Unlimited");
    }
    
    if (template.startTime > 0n && now < Number(template.startTime)) {
      console.log("❌ Not started yet");
    } else {
      console.log("✅ Start time OK");
    }
    
    if (template.endTime > 0n && now > Number(template.endTime)) {
      console.log("❌ Already ended");
    } else {
      console.log("✅ End time OK");
    }

    // Check user profile
    console.log("\n👤 User Profile Check:");
    console.log("─".repeat(50));
    // User from failed transaction - normalize the address
    const userAddressRaw = "0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5";
    let userAddress: string;
    try {
      userAddress = ethers.getAddress(userAddressRaw);
    } catch (e) {
      // If checksum fails, just use lowercase
      userAddress = userAddressRaw.toLowerCase();
    }
    
    try {
      const profileId = await profileNFT.addressToProfileId(userAddress);
      
      if (profileId === 0n) {
        console.log("❌ User has NO profile");
        console.log("   Address:", userAddress);
      } else {
        console.log("✅ User has profile");
        console.log("   Profile ID:", profileId.toString());
        console.log("   Address:", userAddress);
        
        // Check if already claimed
        const hasClaimed = await reputationCard.hasProfileClaimed(999, profileId);
        if (hasClaimed) {
          console.log("❌ User has ALREADY claimed this template");
        } else {
          console.log("✅ User has NOT claimed yet");
        }
      }
    } catch (err: any) {
      console.log("❌ Error checking profile:", err.message);
    }

    // Check signer in contract
    console.log("\n🔐 Contract Signer:");
    console.log("─".repeat(50));
    // Note: If your contract has a public signer variable, check it
    // const contractSigner = await reputationCard.signer();
    // console.log("   Contract signer:", contractSigner);

  } catch (error: any) {
    console.log("❌ Template 999 does NOT exist or error reading it");
    console.log("   Error:", error.message);
    
    console.log("\n💡 You need to create template 999 first!");
    console.log("   Run: npx hardhat run scripts/create-kusama-template.ts --network moonbase");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
