import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = 'https://kuqfccqirhwaqjkiglmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertTemplate999() {
  console.log('Inserting Template 999 (Kusama Living Profile) into Supabase collectibles table...\n');

  // Template 999 collectible record
  const collectible = {
    template_id: 999,
    title: 'Kusama Living Profile',
    description: 'A dynamic NFT collectible that reflects your real-time on-chain reputation score, powered by Kusama EVM. The visual representation evolves as you earn more reputation through community contributions and achievements.',
    image_url: 'https://kuqfccqirhwaqjkiglmf.supabase.co/storage/v1/object/public/collectibles/kusama-living-profile-placeholder.png',
    banner_url: 'https://kuqfccqirhwaqjkiglmf.supabase.co/storage/v1/object/public/collectibles/kusama-living-profile-banner.png',
    token_uri: 'https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata/',
    claim_type: 'signature',
    requirements: {
      requiresProfile: true,
      description: 'You must have a TrustFi profile to claim this dynamic collectible'
    },
    created_by: '0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5', // TrustFi Core Team
    is_active: true
  };

  console.log('Collectible Details:');
  console.log('  Template ID:', collectible.template_id);
  console.log('  Title:', collectible.title);
  console.log('  Claim Type:', collectible.claim_type);
  console.log('  Token URI Prefix:', collectible.token_uri);
  console.log('  Created By:', collectible.created_by);
  console.log('  Is Active:', collectible.is_active);
  console.log();

  // Check if collectible already exists
  const { data: existing, error: checkError } = await supabase
    .from('collectibles')
    .select('*')
    .eq('template_id', collectible.template_id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Error checking for existing collectible:', checkError);
    process.exit(1);
  }

  if (existing) {
    console.log('⚠️  Template 999 collectible already exists in database!');
    console.log('\nExisting collectible:');
    console.log('  ID:', existing.id);
    console.log('  Title:', existing.title);
    console.log('  Token URI:', existing.token_uri);
    console.log('  Is Active:', existing.is_active);
    console.log('  Created At:', existing.created_at);
    console.log('\n✅ Collectible is already configured in Supabase!');
    return existing;
  }

  // Insert collectible
  const { data, error } = await supabase
    .from('collectibles')
    .insert([collectible])
    .select();

  if (error) {
    console.error('❌ Error inserting collectible:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log('✅ Template 999 collectible successfully added to Supabase!');
  console.log('\nInserted data:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n🎉 The Kusama Living Profile is now available in your application!');
  console.log('\nNext steps:');
  console.log('  1. Verify the collectible appears in the UI');
  console.log('  2. Test claiming the collectible with a profile');
  console.log('  3. Verify dynamic metadata updates with reputation changes');
  
  return data[0];
}

insertTemplate999().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
