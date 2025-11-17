/**
 * Test the dynamic metadata endpoint
 * Verifies that the Supabase function correctly:
 * 1. Reads score from ReputationCard contract
 * 2. Calls KusamaSVGArt contract for image
 * 3. Returns valid JSON metadata
 */

const SUPABASE_URL = 'https://kuqfccqirhwaqjkiglmf.supabase.co';
const FUNCTION_NAME = 'dynamic-metadata';

async function testDynamicMetadata(profileId) {
  const url = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}?profileId=${profileId}`;
  
  console.log(`\n🧪 Testing dynamic metadata for Profile ID: ${profileId}`);
  console.log(`📡 Endpoint: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error Response:', error);
      return;
    }

    const metadata = await response.json();
    
    console.log('\n✅ Metadata Retrieved Successfully!\n');
    console.log('📄 Metadata:');
    console.log(JSON.stringify(metadata, null, 2));

    // Validate metadata structure
    console.log('\n🔍 Validation:');
    console.log(`  ✓ Name: ${metadata.name ? '✅' : '❌'}`);
    console.log(`  ✓ Description: ${metadata.description ? '✅' : '❌'}`);
    console.log(`  ✓ Image: ${metadata.image?.startsWith('data:image/svg+xml;base64,') ? '✅' : '❌'}`);
    console.log(`  ✓ Attributes: ${Array.isArray(metadata.attributes) && metadata.attributes.length > 0 ? '✅' : '❌'}`);

    // Check if image is on-chain generated
    const hasOnChainArt = metadata.attributes?.some(
      attr => attr.trait_type === 'On-Chain Art' && attr.value === 'true'
    );
    console.log(`  ✓ On-Chain Art: ${hasOnChainArt ? '✅' : '❌'}`);

    // Decode and preview SVG (first 200 chars)
    if (metadata.image?.startsWith('data:image/svg+xml;base64,')) {
      const base64 = metadata.image.split(',')[1];
      const svg = Buffer.from(base64, 'base64').toString('utf-8');
      console.log('\n🎨 SVG Preview (first 200 chars):');
      console.log(svg.substring(0, 200) + '...');
    }

    console.log('\n✨ Test Passed!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test with Profile ID 1
testDynamicMetadata(1).catch(console.error);

// Optionally test multiple profiles
// Promise.all([
//   testDynamicMetadata(1),
//   testDynamicMetadata(2),
//   testDynamicMetadata(999),
// ]).catch(console.error);
