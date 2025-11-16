import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from client/.env
const clientEnvPath = path.resolve(__dirname, '../../client/.env');
dotenv.config({ path: clientEnvPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// Import Supabase client from client folder
const clientSupabasePath = path.resolve(__dirname, '../../client/src/lib/supabase.ts');

// We'll use fetch API directly instead of importing from client
// This avoids TypeScript/module issues
async function supabaseQuery(
  table: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: any,
  query?: string
): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  if (method === 'GET') {
    return await response.json();
  }
  
  return null;
}

// Contract address - update this with your deployed contract
const REPUTATION_CARD_ADDRESS = '0x60BdA778B580262376aAd0Bc8a15AEe374168559'; // TODO: Update with your contract address

// Issuer addresses
const ISSUER_1 = '0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5';
const ISSUER_2 = '0xdda82d845696f6fbf6fe6d4e8084a520ccc27ceb';

interface TemplateData {
  title: string;
  maxSupply: number;
  tier: number;
  startTime: number;
  endTime: number;
  issuer: string;
}

const templates: TemplateData[] = [
  // Issuer 1 templates (13 templates)
  {
    title: 'Discord OG',
    maxSupply: 100,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Twitter Influencer',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Community Helper',
    maxSupply: 200,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Meme Lord',
    maxSupply: 500,
    tier: 1,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'First Transaction',
    maxSupply: 10000,
    tier: 1,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Whale Status',
    maxSupply: 25,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Diamond Hands',
    maxSupply: 100,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Trading Master',
    maxSupply: 150,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Smart Contract Auditor',
    maxSupply: 30,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'DeFi Expert',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Web3 Developer',
    maxSupply: 200,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_1,
  },
  {
    title: 'Hackathon Winner 2024',
    maxSupply: 10,
    tier: 3,
    startTime: 1704067200,
    endTime: 1735689600,
    issuer: ISSUER_1,
  },
  {
    title: 'Launch Day Hero',
    maxSupply: 500,
    tier: 2,
    startTime: 0,
    endTime: 1704153600,
    issuer: ISSUER_1,
  },

  // Issuer 2 templates (12 templates)
  {
    title: 'Holiday 2024 Collector',
    maxSupply: 1000,
    tier: 1,
    startTime: 1701388800,
    endTime: 1704067200,
    issuer: ISSUER_2,
  },
  {
    title: 'KYC Verified',
    maxSupply: 5000,
    tier: 1,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Institutional Partner',
    maxSupply: 20,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Liquidity Provider',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'NFT Collector',
    maxSupply: 300,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Game Champion',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Rare Item Holder',
    maxSupply: 25,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Bug Bounty Hunter',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Content Creator',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Official Ambassador',
    maxSupply: 30,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Governance Delegate',
    maxSupply: 100,
    tier: 2,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
  {
    title: 'Ecosystem Builder',
    maxSupply: 50,
    tier: 3,
    startTime: 0,
    endTime: 0,
    issuer: ISSUER_2,
  },
];

async function syncTemplateToSupabase(
  templateId: number,
  template: TemplateData
): Promise<void> {
  try {
    await supabaseQuery(
      'templates_cache',
      'POST',
      {
        template_id: templateId.toString(),
        issuer: template.issuer.toLowerCase(),
        name: template.title,
        description: `Tier ${template.tier} credential`,
        max_supply: template.maxSupply.toString(),
        current_supply: '0',
        tier: template.tier,
        start_time: template.startTime.toString(),
        end_time: template.endTime.toString(),
        is_paused: false,
      },
      '?on_conflict=template_id'
    );

    console.log(`✅ Synced template ${templateId} to Supabase: ${template.title}`);
  } catch (err: any) {
    console.error(`❌ Error syncing template ${templateId}:`, err.message);
  }
}

async function updateTemplateCounter(nextId: number): Promise<void> {
  try {
    await supabaseQuery(
      'template_counter',
      'POST',
      { id: 1, next_template_id: nextId },
      '?on_conflict=id'
    );

    console.log(`✅ Updated template counter to: ${nextId}`);
  } catch (err: any) {
    console.error('❌ Error updating template counter:', err.message);
  }
}

async function main() {
  console.log('🚀 Starting template deployment...\n');

  // Get the contract
  const ReputationCard = await ethers.getContractAt(
    'ReputationCard',
    REPUTATION_CARD_ADDRESS
  );

  // Get starting template ID from Supabase
  let startingId = 1;
  try {
    const data = await supabaseQuery('template_counter', 'GET', null, '?select=next_template_id&id=eq.1');
    
    if (data && data.length > 0) {
      startingId = data[0].next_template_id;
      console.log(`📊 Starting from template ID: ${startingId}\n`);
    }
  } catch (err) {
    console.log('📊 No template counter found, starting from ID 1\n');
  }

  let currentId = startingId;
  let successCount = 0;
  let failCount = 0;

  // Deploy each template
  for (const template of templates) {
    try {
      console.log(`\n📝 Deploying template ${currentId}: ${template.title}`);
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
        template.endTime
      );

      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Template ${currentId} deployed on-chain`);

      // Sync to Supabase
      await syncTemplateToSupabase(currentId, template);

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

  // Update the counter for next template
  await updateTemplateCounter(currentId);

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
