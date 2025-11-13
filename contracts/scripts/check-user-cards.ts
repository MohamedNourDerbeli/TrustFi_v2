import { ethers } from "hardhat";

const REPUTATION_CARD_ADDRESS = "0x23DD5EeC3259A02B82ae9680D74D3596B6749aac";
const USER_ADDRESS = "0x6cf8d3d7741daef75a9efdd87d72534933723145";

async function main() {
  console.log("Checking cards for user:", USER_ADDRESS);
  
  const reputationCard = await ethers.getContractAt("ReputationCard", REPUTATION_CARD_ADDRESS);
  
  // Get CardIssued events for this user's profile
  const filter = reputationCard.filters.CardIssued(3n); // Profile ID 3
  const events = await reputationCard.queryFilter(filter, -1000);
  
  console.log(`\nFound ${events.length} cards for Profile ID 3:`);
  
  for (const event of events) {
    console.log("\n---");
    console.log("Card ID:", event.args.cardId.toString());
    console.log("Issuer:", event.args.issuer);
    console.log("Tier:", event.args.tier);
    
    try {
      const uri = await reputationCard.tokenURI(event.args.cardId);
      console.log("Token URI:", uri);
    } catch (e) {
      console.log("Could not fetch URI");
    }
  }
  
  console.log("\n✅ The user has", events.length, "reputation card(s)!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
