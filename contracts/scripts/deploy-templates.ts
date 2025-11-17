import { ethers } from 'hardhat';

// Contract address
const REPUTATION_CARD_ADDRESS = '0x60349A98a7C743bb3B7FDb5580f77748578B34e3';

// Issuer addresses
const ISSUER_1 = '0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5';
const ISSUER_2 = '0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb';

interface TemplateData {
  name: string;
  description: string;
  maxSupply: number;
  tier: number;
  startTime: number;
  endTime: number;
  issuer: string;
}

const templates: TemplateData[] = [
  // Issuer 1 templates (13 templates)
  {
    name: 'Discord OG',
    description: 'Original Discord community member',
    maxSupply: 100,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Twitter Influencer',
    description: 'Social media influencer spreading the word',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Community Helper',
    description: 'Active community supporter and helper',
    maxSupply: 200,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Meme Lord',
    description: 'Master of community memes and culture',
    maxSupply: 500,
    tier: 1,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'First Transaction',
    description: 'Early platform adopter',
    maxSupply: 10000,
    tier: 1,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Whale Status',
    description: 'Significant platform participant',
    maxSupply: 25,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Diamond Hands',
    description: 'Long-term holder and believer',
    maxSupply: 100,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Trading Master',
    description: 'Expert trader with proven track record',
    maxSupply: 150,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Smart Contract Auditor',
    description: 'Verified smart contract security expert',
    maxSupply: 30,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'DeFi Expert',
    description: 'Decentralized finance specialist',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Web3 Developer',
    description: 'Blockchain application developer',
    maxSupply: 200,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    name: 'Launch Day Hero',
    description: 'Participated in platform launch',
    maxSupply: 500,
    tier: 2,
    startTime: 0,
    endTime: 1704153600,
    issuer: ISSUER_1,
  },

  // Issuer 2 templates (12 templates)
  {
    name: 'Holiday 2024 Collector',
    description: 'Special holiday season participant',
    maxSupply: 1000,
    tier: 1,
    startTime: 1701388800,
    endTime: 1704067200,
    issuer: ISSUER_2,
  },
  {
    name: 'KYC Verified',
    description: 'Completed identity verification',
    maxSupply: 5000,
    tier: 1,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Institutional Partner',
    description: 'Verified institutional partnership',
    maxSupply: 20,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Liquidity Provider',
    description: 'Active liquidity contributor',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'NFT Collector',
    description: 'Passionate NFT enthusiast',
    maxSupply: 300,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Game Champion',
    description: 'Top performer in platform games',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Rare Item Holder',
    description: 'Owner of rare collectible items',
    maxSupply: 25,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Bug Bounty Hunter',
    description: 'Contributed to platform security',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Content Creator',
    description: 'Quality content contributor',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Official Ambassador',
    description: 'Verified platform ambassador',
    maxSupply: 30,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Governance Delegate',
    description: 'Trusted governance participant',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    name: 'Ecosystem Builder',
    description: 'Key ecosystem contributor',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
];

async function main() {
  console.log('🚀 Starting template deployment...\n');

  // Get the contract
  const ReputationCard = await ethers.getContractAt(
    'ReputationCard',
    REPUTATION_CARD_ADDRESS
  );

  let currentId = 1;
  let successCount = 0;
  let failCount = 0;

  // Deploy each template
  for (const template of templates) {
    try {
      console.log(`\n📝 Deploying template ${currentId}: ${template.name}`);
      console.log(`   Issuer: ${template.issuer}`);
      console.log(`   Max Supply: ${template.maxSupply}`);
      console.log(`   Tier: ${template.tier}`);

      // Create template on-chain
      const tx = await ReputationCard.createTemplate(
        currentId,
        template.issuer,
        template.maxSupply,
        template.tier,
        template.startTime,
        template.endTime,
        template.name,
        template.description
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Template ${currentId} deployed on-chain`);

      successCount++;
      currentId++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`   ❌ Failed to deploy template ${currentId}:`, error.message);
      failCount++;
      currentId++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Deployment Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully deployed: ${successCount} templates`);
  console.log(`❌ Failed: ${failCount} templates`);
  console.log(`📍 Next template ID: ${currentId}`);
  console.log(`\n👤 Issuer 1 (${ISSUER_1}): 13 templates`);
  console.log(`👤 Issuer 2 (${ISSUER_2}): 12 templates`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
