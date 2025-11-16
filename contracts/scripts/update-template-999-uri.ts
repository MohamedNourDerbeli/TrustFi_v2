// scripts/update-template-999-uri.ts
import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Updating Template 999 Token URI...\n");

  const REPUTATION_CARD_ADDRESS = "0x58ae575f894417eEa9AB42f9BFc66FC95406DdC2";
  
  // This should be the base URI for dynamic metadata
  // For Kusama Living Profile, it should point to a dynamic metadata endpoint
  const DYNAMIC_METADATA_URI = "ipfs://QmYourMetadataHash/"; // Or use a URL-based URI

  const [deployer] = await ethers.getSigners();
  console.log("📍 Updating from address:", deployer.address);

  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);

  // Check current template
  const template = await reputationCard.templates(999);
  console.log("📋 Current Template 999:");
  console.log("   Token URI:", template.tokenUri || "(empty)");

  console.log("\n⏳ Updating token URI...");
  
  // Update the template URI
  // Note: You may need to add an updateTemplateURI function to your contract
  // For now, we'll just show what needs to be done
  
  console.log("\n⚠️  Template URI is currently undefined!");
  console.log("\n💡 Solution: You need to update the template with a valid token URI");
  console.log("\nOptions:");
  console.log("1. Use IPFS URI: ipfs://QmYourMetadataHash/");
  console.log("2. Use HTTP URI: https://your-domain.com/metadata/");
  console.log("3. Use Supabase function: https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId=");

  console.log("\n📝 To fix this, you need to:");
  console.log("1. Add an updateTemplateURI function to your ReputationCard contract");
  console.log("2. Or recreate the template with the correct URI");
  console.log("\nExample contract function:");
  console.log(`
    function updateTemplateURI(uint256 templateId, string calldata newURI) external {
      require(msg.sender == templates[templateId].issuer, "Only issuer");
      templates[templateId].tokenUri = newURI;
    }
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
