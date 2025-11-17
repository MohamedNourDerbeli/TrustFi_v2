/**
 * Script to issue Kusama Living Profile card
 * Uses the KusamaSVGArt contract's tokenMetadata function
 * which generates fully on-chain metadata
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../contracts/.env') });

const REPUTATION_CARD_ADDRESS = '0x60349A98a7C743bb3B7FDb5580f77748578B34e3';
const KUSAMA_SVG_ADDRESS = '0xF320656B42F663508CE06deE19C04b7C4Dc2FB89';
const RPC_URL = 'https://rpc.api.moonbase.moonbeam.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not found in .env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const ReputationCardABI = [
  'function issueCardDirect(address recipient, uint256 templateId, string calldata tokenURI_, bytes calldata signature, uint256 nonce) external returns (uint256)',
  'function calculateScoreForProfile(uint256 profileId) external view returns (uint256)',
  'function addressToProfileId(address user) external view returns (uint256)',
];

const KusamaSVGABI = [
  'function tokenMetadata(uint256 tokenId, uint256 score, string memory title) public pure returns (string memory)',
];

async function issueKusamaCard(recipientAddress) {
  console.log('🚀 Issuing Kusama Living Profile Card\n');
  console.log(`Recipient: ${recipientAddress}`);
  console.log(`Issuer: ${wallet.address}\n`);

  const reputationCard = new ethers.Contract(REPUTATION_CARD_ADDRESS, ReputationCardABI, wallet);
  const kusamaSVG = new ethers.Contract(KUSAMA_SVG_ADDRESS, KusamaSVGABI, provider);

  try {
    // Get recipient's profile ID
    const profileId = await reputationCard.addressToProfileId(recipientAddress);
    console.log(`Profile ID: ${profileId}`);

    if (profileId === 0n) {
      console.error('❌ Recipient does not have a profile');
      process.exit(1);
    }

    // Get current reputation score
    const score = await reputationCard.calculateScoreForProfile(profileId);
    console.log(`Current Score: ${score}\n`);

    // Generate on-chain metadata
    // Note: For actual card issue, we'll use a placeholder tokenId (will be replaced after minting)
    const tempTokenId = 999; // Placeholder, actual tokenId assigned by contract
    const metadata = await kusamaSVG.tokenMetadata(tempTokenId, score, 'Kusama Living Profile');
    
    console.log('📄 Generated On-Chain Metadata:');
    console.log(metadata.substring(0, 200) + '...\n');

    // For Kusama Living Profile, we use template 999
    const templateId = 999;
    
    // Create signature (placeholder - in production this would be EIP-712)
    const nonce = Date.now();
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256'],
      [recipientAddress, templateId, nonce]
    );
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log('💫 Issuing card on-chain...');
    
    // For Kusama Living Profile, we use a special tokenURI format
    // The actual metadata will be generated dynamically by calling KusamaSVGArt contract
    const tokenURI = `kusama://profile/${profileId}`;
    
    const tx = await reputationCard.issueCardDirect(
      recipientAddress,
      templateId,
      tokenURI,
      signature,
      nonce
    );

    console.log(`Transaction hash: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...\n');

    const receipt = await tx.wait();
    
    console.log('✅ Card issued successfully!');
    console.log(`Gas used: ${receipt.gasUsed}`);
    console.log(`Block: ${receipt.blockNumber}\n`);

    // Extract card ID from events
    const issuedEvent = receipt.logs.find(log => {
      try {
        const parsed = reputationCard.interface.parseLog(log);
        return parsed.name === 'CardIssued';
      } catch {
        return false;
      }
    });

    if (issuedEvent) {
      const parsed = reputationCard.interface.parseLog(issuedEvent);
      const cardId = parsed.args.cardId;
      console.log(`🎉 Card ID: ${cardId}`);
      console.log(`\n📝 Note: The card's visual will update automatically as the user's score changes!`);
      console.log(`   View it at: http://localhost:5173/dashboard`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
    process.exit(1);
  }
}

// Get recipient address from command line or use default
const recipientAddress = process.argv[2] || wallet.address;

issueKusamaCard(recipientAddress)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
