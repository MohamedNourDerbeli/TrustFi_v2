import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = 'https://kuqfccqirhwaqjkiglmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTemplate999() {
  console.log('Adding Template 999 (Kusama Living Profile) to Supabase...\n');

  const template = {
    template_id: '999',
    issuer: '0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5',
    name: 'Kusama Living Profile',
    description: 'A dynamic NFT collectible that evolves with your reputation score. The visual representation changes as you earn more reputation points through community contributions and achievements.',
    max_supply: '0', // Unlimited
    current_supply: '0',
    tier: 3, // Highest tier (200 points)
    start_time: '0', // Immediate
    end_time: '0', // No expiry
    is_paused: false
  };

  console.log('Template Details:');
  console.log('  Template ID:', template.template_id);
  console.log('  Name:', template.name);
  console.log('  Issuer:', template.issuer);
  console.log('  Tier:', template.tier, '(200 points)');
  console.log('  Max Supply:', template.max_supply, '(unlimited)');
  console.log('  Start Time:', template.start_time, '(immediate)');
  console.log('  End Time:', template.end_time, '(no expiry)');
  console.log('  Is Paused:', template.is_paused);
  console.log();

  // Check if template already exists
  const { data: existing, error: checkError } = await supabase
    .from('templates_cache')
    .select('*')
    .eq('template_id', template.template_id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Error checking for existing template:', checkError);
    process.exit(1);
  }

  if (existing) {
    console.log('⚠️  Template 999 already exists in database!');
    console.log('\nExisting template:');
    console.log('  Name:', existing.name);
    console.log('  Description:', existing.description);
    console.log('  Current Supply:', existing.current_supply);
    console.log('  Created At:', existing.created_at);
    console.log('\n✅ Template is already configured in Supabase!');
    return;
  }

  // Insert template
  const { data, error } = await supabase
    .from('templates_cache')
    .insert([template])
    .select();

  if (error) {
    console.error('❌ Error inserting template:', error);
    process.exit(1);
  }

  console.log('✅ Template 999 successfully added to Supabase!');
  console.log('\nInserted data:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n🎉 You can now see this template in your application!');
  console.log('\nNext steps:');
  console.log('  1. Deploy the dynamic-metadata Edge Function (Task 5)');
  console.log('  2. Update the CollectiblesPage component (Task 8)');
  console.log('  3. Test claiming the collectible in the UI');
}

addTemplate999().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
