// scripts/listSupabaseTables.ts
// Lists user-defined (non system) tables in the Supabase Postgres instance.
// Requires environment variables:
//   SUPABASE_URL (your project url, e.g. https://xxxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY (service role key – DO NOT expose to browser)
// Run with: npx ts-node scripts/listSupabaseTables.ts
// Or add a package.json script: "list:tables": "ts-node scripts/listSupabaseTables.ts"

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

// Service role key allows RLS bypass – keep it secure.
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Filter out PostgreSQL internal schemas
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_schema, table_name')
    .in('table_schema', ['public']);

  if (error) {
    console.error('Error fetching tables:', error);
    process.exit(1);
  }

  const tables = (data || [])
    .map(t => t.table_name)
    .filter(name => !name.startsWith('_') && name !== 'realtime');

  console.log('\nSupabase public tables:');
  tables.forEach(name => console.log(' -', name));

  const referencedInClient = [
    'profiles',
    'claims_log',
    'verifiable_credentials',
    'collectibles',
    'claim_links'
  ];

  const legacyTables = [
    'templates_cache' // dropped: replaced by on-chain templates; pending migration removal
  ];

  const unused = tables.filter(t => !referencedInClient.includes(t) && !legacyTables.includes(t));

  console.log('\nReferenced in client code:', referencedInClient.join(', '));
  if (legacyTables.length) {
    console.log('\nLegacy tables (scheduled for removal):', legacyTables.join(', '));
  }
  console.log('\nPotentially unused (double-check before dropping):');
  unused.forEach(u => console.log(' -', u));

  if (unused.length) {
    console.log('\nSuggested DROP statements (review carefully):');
    unused.forEach(u => console.log(`DROP TABLE IF EXISTS \"${u}\" CASCADE;`));
  } else {
    console.log('\nNo unused tables detected relative to current client references.');
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
