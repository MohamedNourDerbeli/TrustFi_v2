// pages/TemplateSyncPage.tsx
import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { syncAllTemplatesToDatabase, syncTemplateToDatabase } from '../lib/template-sync';

export function TemplateSyncPage() {
  const publicClient = usePublicClient();
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<string>('');
  const [singleTemplateId, setSingleTemplateId] = useState('1');

  const handleSyncAll = async () => {
    if (!publicClient) {
      setResults('Error: Public client not available. Please connect your wallet.');
      return;
    }

    setSyncing(true);
    setResults('Syncing all templates from blockchain to database...\n\n');

    try {
      const syncResults = await syncAllTemplatesToDatabase(publicClient, 100);
      
      let output = '='.repeat(80) + '\n';
      output += 'TEMPLATE SYNC RESULTS\n';
      output += '='.repeat(80) + '\n\n';
      output += `Total templates scanned: ${syncResults.total}\n`;
      output += `Successfully synced: ${syncResults.synced}\n`;
      output += `Failed: ${syncResults.failed}\n\n`;
      
      output += 'Details:\n';
      output += '-'.repeat(80) + '\n';
      
      for (const result of syncResults.results) {
        if (result.success) {
          output += `✓ Template ${result.templateId}: Synced successfully\n`;
        } else if (result.error?.includes('does not exist')) {
          output += `- Template ${result.templateId}: Does not exist on-chain (skipped)\n`;
        } else {
          output += `✗ Template ${result.templateId}: Failed - ${result.error}\n`;
        }
      }
      
      output += '\n' + '='.repeat(80) + '\n';
      output += syncResults.failed === 0 ? '✓ SYNC COMPLETED SUCCESSFULLY' : '⚠ SYNC COMPLETED WITH ERRORS';
      output += '\n' + '='.repeat(80);
      
      setResults(output);
    } catch (error) {
      setResults(`Error: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingle = async () => {
    if (!publicClient) {
      setResults('Error: Public client not available. Please connect your wallet.');
      return;
    }

    const templateId = BigInt(singleTemplateId);
    setSyncing(true);
    setResults(`Syncing template ${templateId}...\n\n`);

    try {
      const result = await syncTemplateToDatabase(publicClient, templateId);
      
      let output = '='.repeat(80) + '\n';
      output += `TEMPLATE ${templateId} SYNC RESULT\n`;
      output += '='.repeat(80) + '\n\n';
      
      if (result.success) {
        output += `✓ Template ${templateId} synced successfully!\n`;
      } else {
        output += `✗ Failed to sync template ${templateId}\n`;
        output += `Error: ${result.error}\n`;
      }
      
      output += '\n' + '='.repeat(80);
      
      setResults(output);
    } catch (error) {
      setResults(`Error: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Template Sync Utility</h1>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-300 mb-4">
            This utility syncs template data from the blockchain to the Supabase templates_cache table.
            This is useful for:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Backfilling existing templates that were created before the sync feature</li>
            <li>Fixing data inconsistencies between blockchain and database</li>
            <li>Improving query performance by caching template data</li>
            <li>Ensuring the data flow audit passes</li>
          </ul>
        </div>

        {/* Sync All Templates */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sync All Templates</h2>
          <p className="text-gray-300 mb-4">
            Scans template IDs from 1 to 100 and syncs all existing templates to the database.
          </p>
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded font-medium transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync All Templates'}
          </button>
        </div>

        {/* Sync Single Template */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sync Single Template</h2>
          <p className="text-gray-300 mb-4">
            Sync a specific template by ID.
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={singleTemplateId}
              onChange={(e) => setSingleTemplateId(e.target.value)}
              placeholder="Template ID"
              className="px-4 py-2 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSyncSingle}
              disabled={syncing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded font-medium transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync Template'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {syncing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : results ? (
            <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
              {results}
            </pre>
          ) : (
            <p className="text-gray-400">No results yet. Click a sync button to start.</p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Connect your wallet first</li>
            <li>Click "Sync All Templates" to sync all existing templates</li>
            <li>Or enter a specific template ID and click "Sync Template"</li>
            <li>Wait for the sync to complete</li>
            <li>Check the results to verify success</li>
            <li>Run the data flow audit again to verify templates are cached</li>
          </ol>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-6">
          <h3 className="text-yellow-500 font-semibold mb-2">⚠️ Note</h3>
          <p className="text-gray-300">
            This utility requires the service role key to write to templates_cache.
            If you get permission errors, check your Supabase RLS policies.
          </p>
        </div>
      </div>
    </div>
  );
}
