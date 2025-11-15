import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { CreateProfile } from "../components/user/CreateProfile";
import { supabase, type ClaimLogRow } from "../lib/supabase";

export const UserDashboard: React.FC = () => {
  const { address, isConnected, hasProfile, isLoading, refreshProfile } = useAuth();
  const { profile, profileId, score, cards, loading: profileLoading, refreshProfile: refreshProfileData } = useProfile(address);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ClaimLogRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Minimal debug logging - only log on mount and when hasProfile changes
  useEffect(() => {
    console.log('[UserDashboard] hasProfile:', hasProfile, 'profileId:', profileId?.toString());
  }, [hasProfile, profileId]);

  // Fetch recent activity for the user
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!profileId) {
        setLoadingActivity(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('claims_log')
          .select('*')
          .eq('profile_id', profileId.toString())
          .order('claimed_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching recent activity:', error);
        } else if (data) {
          setRecentActivity(data as ClaimLogRow[]);
        }
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access your dashboard
          </p>
          <p className="text-sm text-gray-500">
            Use the "Connect Wallet" button in the navigation bar above
          </p>
        </div>
      </div>
    );
  }

  if (!hasProfile && !showCreateProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <p className="text-sm font-mono text-yellow-800">
              DEBUG: hasProfile={hasProfile.toString()}, isLoading={isLoading.toString()}, 
              profileId={profileId?.toString() || 'null'}, address={address}
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Create Your Profile
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have a profile yet. Create one to start building your reputation!
          </p>
          <button
            onClick={() => setShowCreateProfile(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Profile Now
          </button>
        </div>
      </div>
    );
  }

  if (!hasProfile && showCreateProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setShowCreateProfile(false)}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <CreateProfile />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600">
          Manage your profile, view your reputation, and discover new credentials
        </p>
        
        {/* Debug: Show if profile data is missing */}
        {profileId && !profile && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-2">
              ⚠️ Profile exists on-chain (ID: {profileId.toString()}) but metadata is missing from database.
            </p>
            <button
              onClick={async () => {
                if (!address || !profileId) return;
                const { error } = await supabase
                  .from('profiles')
                  .upsert({
                    wallet: address.toLowerCase(),
                    profile_id: profileId.toString(),
                    token_uri: '',
                    display_name: `User ${profileId.toString()}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'wallet' });
                
                if (error) {
                  console.error('Error creating profile metadata:', error);
                  alert('Error: ' + error.message);
                } else {
                  console.log('Profile metadata created, clearing cache and refreshing...');
                  // Clear cache and refresh both auth and profile data
                  await Promise.all([
                    refreshProfile(),
                    refreshProfileData()
                  ]);
                  alert('Profile metadata created! Page will reload.');
                  // Force a full page reload to ensure all caches are cleared
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              Create Profile Metadata
            </button>
          </div>
        )}
      </div>

      {/* Profile Summary Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          {/* Banner */}
          <div
            className="w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600"
            style={
              profile?.bannerUrl
                ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          />
          
          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden -mt-12 flex-shrink-0">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                    <span className="text-2xl text-white font-bold">
                      {profile?.displayName?.[0]?.toUpperCase() || address?.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Address */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">
                  {profile?.displayName || `Profile #${profileId?.toString()}`}
                </h2>
                <p className="text-gray-600 text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                {profile?.bio && (
                  <p className="text-gray-700 mt-2 line-clamp-2">{profile.bio}</p>
                )}
              </div>

              {/* Edit Button */}
              <Link
                to="/profile/edit"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Edit Profile
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{score.toString()}</p>
                <p className="text-sm text-gray-600 mt-1">Reputation Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{cards.length}</p>
                <p className="text-sm text-gray-600 mt-1">Cards Collected</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{recentActivity.length}</p>
                <p className="text-sm text-gray-600 mt-1">Recent Claims</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/discover"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Discover Collectibles
              </Link>
              <Link
                to={`/profile/${address}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Full Profile
              </Link>
            </div>
          </div>

          {/* Score Visualization */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Score Breakdown
            </h3>
            {profileLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : cards.length > 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((tier) => {
                  const tierCards = cards.filter(card => card.tier === tier);
                  const tierScore = tierCards.length * tier;
                  return (
                    <div key={tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          tier === 1 ? 'bg-green-500' : tier === 2 ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-700">Tier {tier}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">{tierCards.length} cards</span>
                        <span className="text-xs text-gray-600 ml-2">({tierScore} pts)</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total Score</span>
                    <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {score.toString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                No cards yet. Start collecting to build your score!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Link
            to={`/profile/${address}`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Cards →
          </Link>
        </div>

        {loadingActivity ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 text-sm">Loading activity...</p>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Claimed Card #{activity.card_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Template #{activity.template_id} • {activity.claim_type === 'direct' ? 'Direct Issuance' : 'Signature Claim'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.claimed_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.claimed_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">No activity yet</p>
            <Link
              to="/discover"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Claim Your First Card
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
