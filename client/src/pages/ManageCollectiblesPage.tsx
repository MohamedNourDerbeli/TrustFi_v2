// pages/ManageCollectiblesPage.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCollectibles } from '../hooks/useCollectibles';
import { CreateCollectible } from '../components/issuer/CreateCollectible';
import { supabase } from '../lib/supabase';

export function ManageCollectiblesPage() {
  const { address } = useAccount();
  const { collectibles, loading, error, refreshCollectibles } = useCollectibles();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter collectibles created by current user
  const myCollectibles = collectibles.filter(
    c => c.createdBy.toLowerCase() === address?.toLowerCase()
  );

  const handleToggleActive = async (id: string, currentState: boolean) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('collectibles')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;

      await refreshCollectibles();
    } catch (err) {
      console.error('Error toggling collectible:', err);
      alert('Failed to update collectible');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Collectibles</h3>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={refreshCollectibles}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setShowCreateForm(false)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Collectibles
          </button>
        </div>
        <CreateCollectible />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Collectibles</h1>
          <p className="text-gray-600">
            Create and manage user-facing collectibles for your templates
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + Create Collectible
        </button>
      </div>

      {myCollectibles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-gray-500 text-lg mb-2">No collectibles yet</p>
          <p className="text-gray-400 text-sm mb-6">
            Create your first collectible to make your templates discoverable to users
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create Your First Collectible
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCollectibles.map((collectible) => (
            <div
              key={collectible.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              {/* Banner */}
              {collectible.bannerUrl && (
                <div className="w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600">
                  <img
                    src={collectible.bannerUrl}
                    alt={collectible.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Image */}
              <div className="flex justify-center -mt-12 px-6">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                  <img
                    src={collectible.imageUrl}
                    alt={collectible.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="p-6 pt-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{collectible.title}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      collectible.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {collectible.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {collectible.description}
                </p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Template ID:</span>
                    <span className="text-gray-900 font-mono">
                      #{collectible.templateId.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tier:</span>
                    <span className="text-gray-900 font-medium">
                      {collectible.tier || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Claim Type:</span>
                    <span className="text-gray-900">
                      {collectible.claimType === 'signature' ? '🔗 Link' : '⚡ Direct'}
                    </span>
                  </div>
                  {collectible.maxSupply && collectible.maxSupply > 0n && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Supply:</span>
                      <span className="text-gray-900">
                        {collectible.currentSupply?.toString() || '0'} /{' '}
                        {collectible.maxSupply.toString()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggleActive(collectible.id, collectible.isActive)}
                  disabled={updatingId === collectible.id}
                  className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                    collectible.isActive
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updatingId === collectible.id
                    ? 'Updating...'
                    : collectible.isActive
                    ? 'Deactivate'
                    : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
