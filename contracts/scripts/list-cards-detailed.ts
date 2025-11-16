import { ethers } from "hardhat";
import ReputationCardABI from "../../client/src/lib/ReputationCard.abi.json";

// Contract address - update this with your deployed contract
const REPUTATION_CARD_ADDRESS = process.env.REPUTATION_CARD_CONTRACT_ADDRESS || "0xYourContractAddress";

interface TemplateInfo {
  issuer: string;
  maxSupply: bigint;
  currentSupply: bigint;
  tier: number;
  startTime: bigint;
  endTime: bigint;
  isPaused: boolean;
}

interface CardDetails {
  cardId: bigint;
  owner: string;
  profileId: bigint;
  templateId: bigint;
  tier: number;
  issuer: string;
  tokenURI: string;
  blockNumber: number;
  txHash: string;
  timestamp?: number;
}

async function getTemplateInfo(contract: any, templateId: bigint): Promise<TemplateInfo | null> {
  try {
    const template = await contract.templates(templateId);
    return {
      issuer: template.issuer,
      maxSupply: template.maxSupply,
      currentSupply: template.currentSupply,
      tier: Number(template.tier),
      startTime: template.startTime,
      endTime: template.endTime,
      isPaused: template.isPaused
    };
  } catch (error) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filterOwner = args.find(arg => arg.startsWith("--owner="))?.split("=")[1];
  const filterTemplate = args.find(arg => arg.startsWith("--template="))?.split("=")[1];
  const filterTier = args.find(arg => arg.startsWith("--tier="))?.split("=")[1];
  const showTemplates = args.includes("--templates");
  const exportJson = args.includes("--json");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("      DETAILED REPUTATION CARDS LISTING (ON-CHAIN)");
  console.log("═══════════════════════════════════════════════════════════\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Contract Address: ${REPUTATION_CARD_ADDRESS}`);
  
  if (filterOwner) console.log(`Filter by Owner: ${filterOwner}`);
  if (filterTemplate) console.log(`Filter by Template: ${filterTemplate}`);
  if (filterTier) console.log(`Filter by Tier: ${filterTier}`);
  console.log();

  // Get contract instance
  const reputationCard = new ethers.Contract(
    REPUTATION_CARD_ADDRESS,
    ReputationCardABI,
    ethers.provider
  );

  try {
    // Get current block for chunked queries
    const currentBlock = await ethers.provider.getBlockNumber();
    const chunkSize = 1000;
    
    // Helper function to query events in chunks
    async function queryEventsInChunks(filter: any): Promise<any[]> {
      let allEvents: any[] = [];
      for (let fromBlock = 0; fromBlock <= currentBlock; fromBlock += chunkSize) {
        const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
        const events = await reputationCard.queryFilter(filter, fromBlock, toBlock);
        allEvents = allEvents.concat(events);
      }
      return allEvents;
    }
    
    // Fetch all templates if requested
    if (showTemplates) {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("                    AVAILABLE TEMPLATES");
      console.log("═══════════════════════════════════════════════════════════\n");

      const templateCreatedFilter = reputationCard.filters.TemplateCreated();
      const templateEvents = await queryEventsInChunks(templateCreatedFilter);

      if (templateEvents.length === 0) {
        console.log("No templates found.\n");
      } else {
        for (const event of templateEvents) {
          const args = event.args;
          if (!args) continue;

          const templateId = args.templateId;
          const templateInfo = await getTemplateInfo(reputationCard, templateId);

          if (templateInfo) {
            console.log(`Template ID: ${templateId}`);
            console.log(`  Issuer:         ${templateInfo.issuer}`);
            console.log(`  Tier:           ${templateInfo.tier}`);
            console.log(`  Max Supply:     ${templateInfo.maxSupply}`);
            console.log(`  Current Supply: ${templateInfo.currentSupply}`);
            console.log(`  Is Paused:      ${templateInfo.isPaused}`);
            console.log(`  Start Time:     ${templateInfo.startTime === 0n ? 'Immediate' : new Date(Number(templateInfo.startTime) * 1000).toISOString()}`);
            console.log(`  End Time:       ${templateInfo.endTime === 0n ? 'No expiry' : new Date(Number(templateInfo.endTime) * 1000).toISOString()}`);
            console.log("───────────────────────────────────────────────────────────\n");
          }
        }
      }
    }

    // Fetch all issued cards
    console.log("═══════════════════════════════════════════════════════════");
    console.log("                      ISSUED CARDS");
    console.log("═══════════════════════════════════════════════════════════\n");
    console.log("Fetching CardIssued events from blockchain...\n");
    
    const filter = reputationCard.filters.CardIssued();
    const events = await queryEventsInChunks(filter);

    if (events.length === 0) {
      console.log("❌ No cards have been issued yet.\n");
      return;
    }

    console.log(`✅ Found ${events.length} issued card(s)\n`);
    console.log("═══════════════════════════════════════════════════════════\n");

    const cards: CardDetails[] = [];

    // Process each event
    for (const event of events) {
      const args = event.args;
      if (!args) continue;

      const cardId = args.cardId;
      const profileId = args.profileId;
      const issuer = args.issuer;
      const tier = Number(args.tier);

      try {
        // Get card owner
        const owner = await reputationCard.ownerOf(cardId);
        
        // Apply filters
        if (filterOwner && owner.toLowerCase() !== filterOwner.toLowerCase()) continue;
        if (filterTier && tier !== parseInt(filterTier)) continue;

        // Get token URI
        const tokenURI = await reputationCard.tokenURI(cardId);

        // Get block timestamp
        const block = await ethers.provider.getBlock(event.blockNumber);
        const timestamp = block?.timestamp;

        // Try to determine template ID from claims_log or by checking templates
        // For now, we'll mark it as unknown unless we can determine it
        let templateId = 0n;
        
        // Check if this matches any template by issuer and tier
        const templateCreatedFilter = reputationCard.filters.TemplateCreated();
        
        // Query in chunks up to the event block
        let templateEvents: any[] = [];
        for (let fromBlock = 0; fromBlock <= event.blockNumber; fromBlock += chunkSize) {
          const toBlock = Math.min(fromBlock + chunkSize - 1, event.blockNumber);
          const events = await reputationCard.queryFilter(templateCreatedFilter, fromBlock, toBlock);
          templateEvents = templateEvents.concat(events);
        }
        
        for (const tEvent of templateEvents) {
          const tArgs = tEvent.args;
          if (tArgs && tArgs.issuer.toLowerCase() === issuer.toLowerCase() && Number(tArgs.tier) === tier) {
            templateId = tArgs.templateId;
            break;
          }
        }

        if (filterTemplate && templateId.toString() !== filterTemplate) continue;

        const cardDetails: CardDetails = {
          cardId,
          owner,
          profileId,
          templateId,
          tier,
          issuer,
          tokenURI,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash,
          timestamp
        };

        cards.push(cardDetails);

        if (!exportJson) {
          console.log(`Card ID: ${cardId}`);
          console.log(`  Owner:       ${owner}`);
          console.log(`  Profile ID:  ${profileId}`);
          console.log(`  Template ID: ${templateId === 0n ? 'Unknown' : templateId}`);
          console.log(`  Issuer:      ${issuer}`);
          console.log(`  Tier:        ${tier} (${tier === 1 ? 'Bronze' : tier === 2 ? 'Silver' : tier === 3 ? 'Gold' : 'Unknown'})`);
          console.log(`  Token URI:   ${tokenURI.substring(0, 80)}${tokenURI.length > 80 ? '...' : ''}`);
          console.log(`  Block:       ${event.blockNumber}`);
          console.log(`  Timestamp:   ${timestamp ? new Date(timestamp * 1000).toISOString() : 'Unknown'}`);
          console.log(`  Tx Hash:     ${event.transactionHash}`);
          console.log("───────────────────────────────────────────────────────────\n");
        }

      } catch (error: any) {
        console.error(`❌ Error fetching details for card ${cardId}:`, error.message);
      }
    }

    if (exportJson) {
      // Export as JSON
      console.log(JSON.stringify(cards, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));
    } else {
      // Summary
      console.log("═══════════════════════════════════════════════════════════");
      console.log("                        SUMMARY");
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`Total Cards (after filters): ${cards.length}`);
      
      if (cards.length > 0) {
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

        // Group by template
        const templateCounts = cards.reduce((acc, card) => {
          const key = card.templateId === 0n ? 'Unknown' : card.templateId.toString();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log("\nCards by Template:");
        Object.entries(templateCounts).sort().forEach(([templateId, count]) => {
          console.log(`  Template ${templateId}: ${count} card(s)`);
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

        // Unique owners
        const uniqueOwners = new Set(cards.map(c => c.owner));
        console.log(`\nUnique Card Holders: ${uniqueOwners.size}`);
      }

      console.log("═══════════════════════════════════════════════════════════\n");
    }

  } catch (error: any) {
    console.error("❌ Error querying blockchain:", error.message);
    if (error.code === "CALL_EXCEPTION") {
      console.error("\n⚠️  Make sure the contract address is correct and deployed on this network.");
    }
    process.exitCode = 1;
  }
}

console.log(`
Usage: npx hardhat run scripts/list-cards-detailed.ts --network <network>

Options:
  --owner=<address>     Filter by card owner address
  --template=<id>       Filter by template ID
  --tier=<1|2|3>        Filter by tier (1=Bronze, 2=Silver, 3=Gold)
  --templates           Show all available templates
  --json                Export results as JSON

Examples:
  npx hardhat run scripts/list-cards-detailed.ts --network moonbase
  npx hardhat run scripts/list-cards-detailed.ts --network moonbase --templates
  npx hardhat run scripts/list-cards-detailed.ts --network moonbase --tier=3
  npx hardhat run scripts/list-cards-detailed.ts --network moonbase --owner=0x123...
  npx hardhat run scripts/list-cards-detailed.ts --network moonbase --json > cards.json
`);

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
