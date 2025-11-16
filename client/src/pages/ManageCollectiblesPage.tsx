// pages/ManageCollectiblesPage.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCollectibles } from '../hooks/useCollectibles';
import { CreateCollectible } from '../components/issuer/CreateCollectible';
import { supabase } from '../lib/supabase';
import { Plus, ArrowLeft, Package, Sparkles, TrendingUp, Eye, EyeOff } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading collectibles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Collectibles</h3>
              <p className="text-red-600 mb-6">{error.message}</p>
              <button
                onClick={refreshCollectibles}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setShowCreateForm(false)}
            className="mb-6 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Collectibles
          </button>
        </div>
        <CreateCollectible />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Collectibles</h1>
              </div>
              <p className="text-gray-600 ml-15">
                Create and manage user-facing collectibles for your templates
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create Collectible
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Package className="w-5 h-5 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900">{myCollectibles.length}</p>
              </div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Eye className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">
                  {myCollectibles.filter(c => c.isActive).length}
                </p>
              </div>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <EyeOff className="w-5 h-5 text-gray-600" />
                <p className="text-2xl font-bold text-gray-900">
                  {myCollectibles.filter(c => !c.isActive).length}
                </p>
              </div>
              <p className="text-sm text-gray-600">Inactive</p>
            </div>
          </div>
        </div>

        {myCollectibles.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No collectibles yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first collectible to make your templates discoverable to users
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Create Your First Collectible
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCollectibles.map((collectible) => (
            <div
              key={collectible.id}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              {/* Banner */}
              <div className="relative w-full h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                {collectible.bannerUrl ? (
                  <img
                    src={collectible.bannerUrl}
                    alt={collectible.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white/50" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                      collectible.isActive
                        ? 'bg-green-500/90 text-white'
                        : 'bg-gray-500/90 text-white'
                    }`}
                  >
                    {collectible.isActive ? (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Image */}
              <div className="flex justify-center -mt-12 px-6">
                <div className="relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden">
                    <img
                      src={collectible.imageUrl}
                      alt={collectible.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  {collectible.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2 text-center">
                  {collectible.description}
                </p>

                <div className="space-y-2 mb-4 text-sm bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Template ID:
                    </span>
                    <span className="text-gray-900 font-mono font-semibold">
                      #{collectible.templateId.toString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tier:</span>
                    <span className={`font-bold ${
                      collectible.tier === 1 ? 'text-green-600' :
                      collectible.tier === 2 ? 'text-blue-600' :
                      'text-purple-600'
                    }`}>
                      Tier {collectible.tier || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Claim Type:</span>
                    <span className="text-gray-900 font-medium">
                      {collectible.claimType === 'signature' ? '🔗 Link' : '⚡ Direct'}
                    </span>
                  </div>
                  {collectible.maxSupply && collectible.maxSupply > 0n && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Supply:</span>
                      <span className="text-gray-900 font-semibold">
                        {collectible.currentSupply?.toString() || '0'} /{' '}
                        {collectible.maxSupply.toString()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggleActive(collectible.id, collectible.isActive)}
                  disabled={updatingId === collectible.id}
                  className={`w-full px-4 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                    collectible.isActive
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updatingId === collectible.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Updating...
                    </>
                  ) : collectible.isActive ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
