import { ethers } from "hardhat";
import ReputationCardABI from "../../client/src/lib/ReputationCard.abi.json";

// Contract address - update this with your deployed contract
const REPUTATION_CARD_ADDRESS = process.env.REPUTATION_CARD_CONTRACT_ADDRESS || "0xYourContractAddress";

interface CardInfo {
  cardId: bigint;
  owner: string;
  templateId: bigint;
  tier: number;
  issuer: string;
  tokenURI: string;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("           LISTING ALL REPUTATION CARDS ON-CHAIN");
  console.log("═══════════════════════════════════════════════════════════\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Contract Address: ${REPUTATION_CARD_ADDRESS}\n`);

  // Get contract instance
  const reputationCard = new ethers.Contract(
    REPUTATION_CARD_ADDRESS,
    ReputationCardABI,
    ethers.provider
  );

  try {
    // Get CardIssued events from the beginning
    console.log("Fetching CardIssued events from blockchain...\n");
    
    const filter = reputationCard.filters.CardIssued();
    
    // Get current block
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);
    
    // Start from a recent block (contract was deployed recently)
    // You can adjust this if you know the deployment block
    const startBlock = Math.max(0, currentBlock - 500000); // Last ~500k blocks
    console.log(`Querying from block ${startBlock} to ${currentBlock}...`);
    
    // Query in chunks to avoid "block range too wide" error
    const chunkSize = 1000;
    let allEvents: any[] = [];
    
    for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += chunkSize) {
      const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
      process.stdout.write(`\rQuerying blocks ${fromBlock} to ${toBlock}...`);
      
      const events = await reputationCard.queryFilter(filter, fromBlock, toBlock);
      allEvents = allEvents.concat(events);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(); // New line after progress
    
    const events = allEvents;
    console.log();

    if (events.length === 0) {
      console.log("❌ No cards have been issued yet.\n");
      return;
    }

    console.log(`✅ Found ${events.length} issued card(s)\n`);
    console.log("═══════════════════════════════════════════════════════════\n");

    const cards: CardInfo[] = [];

    // Process each event
    for (const event of events) {
      const args = event.args;
      if (!args) continue;

      const cardId = args.cardId;
      const profileId = args.profileId;
      const issuer = args.issuer;
      const tier = args.tier;

      try {
        // Get card owner
        const owner = await reputationCard.ownerOf(cardId);
        
        // Get token URI
        const tokenURI = await reputationCard.tokenURI(cardId);

        // Get template info by checking events or iterating
        // For now, we'll extract templateId from the card's data
        // Note: The contract doesn't have a direct cardId -> templateId mapping
        // We need to infer it from the CardIssued event context
        
        cards.push({
          cardId,
          owner,
          templateId: 0n, // Will be populated if we can determine it
          tier: Number(tier),
          issuer,
          tokenURI
        });

        console.log(`Card ID: ${cardId}`);
        console.log(`  Owner:      ${owner}`);
        console.log(`  Profile ID: ${profileId}`);
        console.log(`  Issuer:     ${issuer}`);
        console.log(`  Tier:       ${tier}`);
        console.log(`  Token URI:  ${tokenURI.substring(0, 80)}${tokenURI.length > 80 ? '...' : ''}`);
        console.log(`  Block:      ${event.blockNumber}`);
        console.log(`  Tx Hash:    ${event.transactionHash}`);
        console.log("───────────────────────────────────────────────────────────\n");

      } catch (error: any) {
        console.error(`❌ Error fetching details for card ${cardId}:`, error.message);
      }
    }

    // Summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("                        SUMMARY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Total Cards Issued: ${cards.length}`);
    
    // Group by tier
    const tierCounts = cards.reduce((acc, card) => {
      acc[card.tier] = (acc[card.tier] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log("\nCards by Tier:");
    Object.entries(tierCounts).sort().forEach(([tier, count]) => {
      const tierName = tier === "1" ? "Bronze" : tier === "2" ? "Silver" : tier === "3" ? "Gold" : "Unknown";
      console.log(`  Tier ${tier} (${tierName}): ${count} card(s)`);
    });

    // Group by issuer
    const issuerCounts = cards.reduce((acc, card) => {
      acc[card.issuer] = (acc[card.issuer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\nCards by Issuer:");
    Object.entries(issuerCounts).forEach(([issuer, count]) => {
      console.log(`  ${issuer}: ${count} card(s)`);
    });

    console.log("═══════════════════════════════════════════════════════════\n");

  } catch (error: any) {
    console.error("❌ Error querying blockchain:", error.message);
    if (error.code === "CALL_EXCEPTION") {
      console.error("\n⚠️  Make sure the contract address is correct and deployed on this network.");
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
