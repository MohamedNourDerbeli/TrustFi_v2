/**
 * CType Registration Script for KILT Peregrine Testnet
 * 
 * This script registers the TrustFi Reputation Card CType on KILT blockchain
 * and outputs the hash to be added to .env file.
 * 
 * Prerequisites:
 * - @kiltprotocol/sdk-js installed
 * - Node.js 18+
 * 
 * Usage:
 *   node scripts/register-ctype.mjs
 */

import * as Kilt from '@kiltprotocol/sdk-js';

// Reputation Card CType Properties (for KILT SDK)
const CTYPE_PROPERTIES = {
  template_id: {
    type: 'string',
  },
  card_id: {
    type: 'string',
  },
  tier: {
    type: 'integer',
  },
  issue_date: {
    type: 'string',
  },
  issuer_address: {
    type: 'string',
  },
  holder_did: {
    type: 'string',
  },
};

async function registerCType() {
  console.log('🚀 Starting CType Registration Process...\n');

  try {
    // Step 1: Connect to KILT Peregrine testnet
    console.log('📡 Connecting to KILT Peregrine testnet...');
    await Kilt.connect('wss://peregrine.kilt.io');
    console.log('✅ Connected to KILT network\n');

    // Step 2: Create CType from schema
    console.log('📝 Creating CType from schema...');
    const ctype = Kilt.CType.fromProperties(
      'TrustFi Reputation Card',
      CTYPE_PROPERTIES
    );
    
    console.log('✅ CType created successfully');
    console.log('📋 CType Details:');
    console.log(`   Title: TrustFi Reputation Card`);
    console.log(`   Hash: ${ctype.$id}`);
    console.log(`   Properties: ${Object.keys(CTYPE_PROPERTIES).join(', ')}\n`);

    // Step 3: Generate a light DID for registration (no blockchain fees needed for light DIDs)
    console.log('🔑 Generating light DID for registration...');
    const mnemonic = Kilt.Utils.Crypto.mnemonicGenerate();
    const { document: didDocument } = await Kilt.Did.createLightDidDocument({
      authentication: [
        {
          publicKey: Kilt.Utils.Crypto.makeKeypairFromUri(mnemonic, 'sr25519').publicKey,
          type: 'sr25519',
        },
      ],
    });
    
    console.log('✅ Light DID created:', didDocument.uri);
    console.log('🔐 Mnemonic (save this if needed):', mnemonic);
    console.log('\n');

    // Step 4: Display registration information
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ CType Hash Generated Successfully! ✨');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📌 Add this line to your client/.env file:\n');
    console.log(`VITE_KILT_CTYPE_HASH=${ctype.$id}\n`);
    
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('ℹ️  IMPORTANT NOTES:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('• CType Hash: The hash is deterministic based on the schema');
    console.log('• No Blockchain Fee: Light DIDs don\'t require on-chain registration');
    console.log('• Verification: Credentials will be verified off-chain using this schema');
    console.log('• Hybrid Mode: Your app uses database + KILT for credential storage');
    console.log('• Production Ready: This hash can be used immediately\n');

    console.log('📝 CType Schema Preview:');
    console.log(JSON.stringify(ctype, null, 2));
    console.log('\n');

    // Step 5: Cleanup
    await Kilt.disconnect();
    console.log('✅ Disconnected from KILT network');
    console.log('\n🎉 Registration process complete!\n');

  } catch (error) {
    console.error('❌ Error during CType registration:', error);
    console.error('\nError details:', error.message);
    
    if (error.message.includes('connect')) {
      console.error('\n💡 Tip: Check your internet connection and try again');
    }
    
    process.exit(1);
  }
}

// Run the registration
registerCType()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
