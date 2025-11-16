import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = 'https://kuqfccqirhwaqjkiglmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTemplate999() {
  console.log('Verifying Template 999 collectible in Supabase...\n');

  // Fetch the specific collectible
  const { data, error } = await supabase
    .from('collectibles')
    .select('*')
    .eq('template_id', 999)
    .single();

  if (error) {
    console.error('❌ Error fetching collectible:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  if (!data) {
    console.log('❌ Template 999 collectible not found in database!');
    console.log('\nPlease run: node client/scripts/insert-template-999.mjs');
    process.exit(1);
  }

  console.log('✅ Template 999 collectible found in Supabase!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                  COLLECTIBLE DETAILS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('ID:              ', data.id);
  console.log('Template ID:     ', data.template_id);
  console.log('Title:           ', data.title);
  console.log('Description:     ', data.description);
  console.log('Image URL:       ', data.image_url);
  console.log('Banner URL:      ', data.banner_url);
  console.log('Token URI Prefix:', data.token_uri);
  console.log('Claim Type:      ', data.claim_type);
  console.log('Requirements:    ', JSON.stringify(data.requirements, null, 2));
  console.log('Created By:      ', data.created_by);
  console.log('Is Active:       ', data.is_active);
  console.log('Created At:      ', data.created_at);
  console.log('Updated At:      ', data.updated_at);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Verify all required fields match requirements
  const validations = [
    {
      name: 'Template ID is 999',
      pass: data.template_id === 999,
      value: data.template_id
    },
    {
      name: 'Title is "Kusama Living Profile"',
      pass: data.title === 'Kusama Living Profile',
      value: data.title
    },
    {
      name: 'Created by TrustFi Core Team',
      pass: data.created_by.toLowerCase() === '0x91ed606b65d33e3446d9450ad15115f6a1e0e7f5',
      value: data.created_by
    },
    {
      name: 'Claim type is "signature"',
      pass: data.claim_type === 'signature',
      value: data.claim_type
    },
    {
      name: 'Token URI points to dynamic-metadata function',
      pass: data.token_uri.includes('dynamic-metadata'),
      value: data.token_uri
    },
    {
      name: 'Is active',
      pass: data.is_active === true,
      value: data.is_active
    },
    {
      name: 'Requires profile',
      pass: data.requirements?.requiresProfile === true,
      value: data.requirements?.requiresProfile
    }
  ];

  console.log('VALIDATION RESULTS:');
  console.log('───────────────────────────────────────────────────────────');
  let allPassed = true;
  validations.forEach(v => {
    const status = v.pass ? '✅' : '❌';
    console.log(`${status} ${v.name}`);
    if (!v.pass) {
      console.log(`   Expected: true, Got: ${v.value}`);
      allPassed = false;
    }
  });
  console.log('───────────────────────────────────────────────────────────\n');

  if (allPassed) {
    console.log('🎉 All validations passed! Template 999 is correctly configured.');
    console.log('\nThe collectible should now be visible in your application at:');
    console.log('  - Collectibles page (for users to claim)');
    console.log('  - Manage Collectibles page (for the issuer)');
  } else {
    console.log('⚠️  Some validations failed. Please review the configuration.');
    process.exit(1);
  }

  // Fetch all active collectibles to show context
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('              ALL ACTIVE COLLECTIBLES');
  console.log('═══════════════════════════════════════════════════════════');
  const { data: allCollectibles, error: allError } = await supabase
    .from('collectibles')
    .select('template_id, title, claim_type, is_active, created_by')
    .eq('is_active', true)
    .order('template_id', { ascending: true });

  if (allError) {
    console.error('Error fetching all collectibles:', allError);
  } else if (allCollectibles && allCollectibles.length > 0) {
    console.table(allCollectibles);
  } else {
    console.log('No active collectibles found.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

verifyTemplate999().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
