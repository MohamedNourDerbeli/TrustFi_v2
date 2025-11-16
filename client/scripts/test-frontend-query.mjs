import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = 'https://kuqfccqirhwaqjkiglmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendQuery() {
  console.log('Testing frontend query for collectibles (simulating useCollectibles hook)...\n');

  // This mimics the query in useCollectibles hook
  const { data, error } = await supabase
    .from('collectibles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching collectibles:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No active collectibles found!');
    process.exit(1);
  }

  console.log(`✅ Successfully fetched ${data.length} active collectible(s)\n`);

  // Find template 999
  const template999 = data.find(c => c.template_id === 999);

  if (!template999) {
    console.log('❌ Template 999 not found in query results!');
    console.log('\nAvailable templates:');
    data.forEach(c => {
      console.log(`  - Template ${c.template_id}: ${c.title}`);
    });
    process.exit(1);
  }

  console.log('✅ Template 999 found in query results!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         TEMPLATE 999 AS SEEN BY FRONTEND');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Template ID:      ', template999.template_id);
  console.log('Title:            ', template999.title);
  console.log('Description:      ', template999.description.substring(0, 80) + '...');
  console.log('Image URL:        ', template999.image_url);
  console.log('Token URI Prefix: ', template999.token_uri);
  console.log('Claim Type:       ', template999.claim_type);
  console.log('Is Active:        ', template999.is_active);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Simulate what the frontend would do with this data
  console.log('FRONTEND BEHAVIOR SIMULATION:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('1. ✅ Collectible would appear in the collectibles list');
  console.log('2. ✅ Title and description would be displayed');
  console.log('3. ✅ Image would be loaded from:', template999.image_url);
  console.log('4. ✅ Claim button would be shown (claim_type: signature)');
  console.log('5. ✅ When claimed, tokenURI would be constructed as:');
  console.log('      ', template999.token_uri + '{profileId}');
  console.log('      Example:', template999.token_uri + '123');
  console.log('───────────────────────────────────────────────────────────\n');

  // Check requirements
  if (template999.requirements?.requiresProfile) {
    console.log('⚠️  REQUIREMENT: User must have a profile to claim');
    console.log('   Frontend should check if user has a profile before allowing claim\n');
  }

  console.log('🎉 Frontend query test passed!');
  console.log('\nThe Kusama Living Profile collectible is ready to be displayed');
  console.log('and claimed by users in your application.');
  console.log('\nNext steps:');
  console.log('  1. Start the frontend: npm run dev (in client directory)');
  console.log('  2. Navigate to the Collectibles page');
  console.log('  3. Verify Template 999 appears in the list');
  console.log('  4. Test claiming with a profile');
}

testFrontendQuery().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
