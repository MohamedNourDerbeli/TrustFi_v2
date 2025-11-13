import { ethers } from "hardhat";

const PROFILE_NFT_ADDRESS = "0x22bAA86361451Aec9485D1dE31f05a9674353FC1";
const REPUTATION_CARD_ADDRESS = "0x23DD5EeC3259A02B82ae9680D74D3596B6749aac";

// EIP-712 Domain
const EIP712_DOMAIN = {
  name: 'TrustFi ReputationCard',
  version: '1',
  chainId: 1287,
  verifyingContract: REPUTATION_CARD_ADDRESS
};

const EIP712_TYPES = {
  Claim: [
    { name: 'user', type: 'address' },
    { name: 'templateId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' }
  ]
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  console.log("\n=== STEP 1: Check Profile ===");

  const profileNFT = await ethers.getContractAt("ProfileNFT", PROFILE_NFT_ADDRESS);
  const profileId = await profileNFT.addressToProfileId(deployer.address);
  
  console.log("Profile ID for", deployer.address, ":", profileId.toString());
  
  if (profileId === 0n) {
    console.log("❌ No profile found! Creating one...");
    const tx = await profileNFT.createProfile("ipfs://test");
    await tx.wait();
    const newProfileId = await profileNFT.addressToProfileId(deployer.address);
    console.log("✅ Profile created with ID:", newProfileId.toString());
  } else {
    console.log("✅ Profile exists");
  }

  console.log("\n=== STEP 2: Check Template ===");
  
  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);
  const template = await reputationCard.templates(1);
  
  console.log("Template #1:");
  console.log("  Issuer:", template.issuer);
  console.log("  Max Supply:", template.maxSupply.toString());
  console.log("  Current Supply:", template.currentSupply.toString());
  console.log("  Tier:", template.tier);
  
  if (template.issuer === ethers.ZeroAddress) {
    console.log("❌ Template does not exist!");
    return;
  }
  console.log("✅ Template exists");

  console.log("\n=== STEP 3: Generate Signature ===");
  
  const userAddress = deployer.address;
  const templateId = 1;
  const nonce = Date.now();
  
  const messageToSign = {
    user: userAddress,
    templateId: templateId,
    nonce: nonce
  };
  
  console.log("Message to sign:", messageToSign);
  
  const signature = await deployer.signTypedData(
    EIP712_DOMAIN,
    EIP712_TYPES,
    messageToSign
  );
  
  console.log("Signature:", signature);
  console.log("✅ Signature generated");

  console.log("\n=== STEP 4: Attempt Claim ===");
  
  const tokenURI = "ipfs://QmTest123";
  
  console.log("Calling claimWithSignature with:");
  console.log("  _user:", userAddress);
  console.log("  _profileOwner:", userAddress);
  console.log("  _templateId:", templateId);
  console.log("  _nonce:", nonce);
  console.log("  _tokenURI:", tokenURI);
  console.log("  _signature:", signature);
  
  try {
    const tx = await reputationCard.claimWithSignature(
      userAddress,
      userAddress,
      templateId,
      nonce,
      tokenURI,
      signature
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check if card was minted
    const newSupply = await reputationCard.templates(1);
    console.log("New supply:", newSupply.currentSupply.toString());
    
  } catch (error: any) {
    console.log("❌ Transaction failed!");
    console.log("Error:", error.message);
    
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Try to decode the revert reason
    try {
      const reason = error.reason || error.message;
      console.log("Revert reason:", reason);
    } catch (e) {
      console.log("Could not decode revert reason");
    }
  }

  console.log("\n=== STEP 5: Check ProfileNFT can receive NFTs ===");
  
  try {
    const supportsInterface = await profileNFT.supportsInterface("0x150b7a02"); // IERC721Receiver
    console.log("ProfileNFT supports IERC721Receiver:", supportsInterface);
    
    if (!supportsInterface) {
      console.log("❌ ProfileNFT does NOT support IERC721Receiver!");
      console.log("This is why minting fails!");
    } else {
      console.log("✅ ProfileNFT supports IERC721Receiver");
    }
  } catch (e) {
    console.log("Could not check interface support");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
