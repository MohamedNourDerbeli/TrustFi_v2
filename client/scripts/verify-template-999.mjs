import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = 'https://kuqfccqirhwaqjkiglmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1cWZjY3Fpcmh3YXFqa2lnbG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjYzNzksImV4cCI6MjA3ODcwMjM3OX0.KbzTe9bn-btFmMM2wVfxA9ScoeJ3aghY6scd4Er4pkU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTemplate999() {
  console.log('Verifying Template 999 in Supabase...\n');

  const { data, error } = await supabase
    .from('templates_cache')
    .select('*')
    .eq('template_id', '999')
    .single();

  if (error) {
    console.error('❌ Error fetching template:', error);
    process.exit(1);
  }

  if (!data) {
    console.log('❌ Template 999 not found in database!');
    process.exit(1);
  }

  console.log('✅ Template 999 found in Supabase!');
  console.log('\n--- TEMPLATE DETAILS ---');
  console.log('Template ID:', data.template_id);
  console.log('Name:', data.name);
  console.log('Description:', data.description);
  console.log('Issuer:', data.issuer);
  console.log('Tier:', data.tier, '(200 points)');
  console.log('Max Supply:', data.max_supply, '(unlimited)');
  console.log('Current Supply:', data.current_supply);
  console.log('Start Time:', data.start_time, '(immediate)');
  console.log('End Time:', data.end_time, '(no expiry)');
  console.log('Is Paused:', data.is_paused);
  console.log('Created At:', data.created_at);
  console.log('Updated At:', data.updated_at);
  console.log('------------------------\n');

  // Fetch all templates to show context
  const { data: allTemplates, error: allError } = await supabase
    .from('templates_cache')
    .select('template_id, name, tier, current_supply, max_supply')
    .order('template_id', { ascending: true });

  if (allError) {
    console.error('Error fetching all templates:', allError);
  } else {
    console.log('All templates in database:');
    console.table(allTemplates);
  }

  console.log('\n🎉 Template 999 is ready to use in your application!');
}

verifyTemplate999().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
