import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { supabase, type ClaimLogRow } from "../lib/supabase";
import { Search, TrendingUp, Award, Sparkles, Filter, Grid, List, ChevronRight, Copy, Check, Shield } from "lucide-react";
import { CardDisplay } from "../components/shared/CardDisplay";
import { LIMITS } from "../lib/constants";
import { getCredentialsByHolder } from "../lib/kilt/credential-service";
import type { VerifiableCredential } from "../types/kilt";

export const UserDashboard: React.FC = () => {
  const { address, isConnected, hasProfile, userDid } = useAuth();
  const { profile, profileId, score, cards, loading: profileLoading } = useProfile(address);
  const [recentActivity, setRecentActivity] = useState<ClaimLogRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "tier">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [didCopied, setDidCopied] = useState(false);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

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
          .limit(LIMITS.MAX_RECENT_ACTIVITY);

        if (error) console.error('Error fetching activity:', error);
        else if (data) setRecentActivity(data as ClaimLogRow[]);
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchRecentActivity();
  }, [profileId]);

  // Fetch verifiable credentials for user's DID
  useEffect(() => {
    const fetchCredentials = async () => {
      if (!userDid?.uri) {
        setCredentials([]);
        setLoadingCredentials(false);
        return;
      }

      setLoadingCredentials(true);
      setCredentialsError(null);

      try {
        console.log('[UserDashboard] Fetching credentials for DID:', userDid.uri);
        const fetchedCredentials = await getCredentialsByHolder(userDid.uri);
        setCredentials(fetchedCredentials);
        console.log(`[UserDashboard] Loaded ${fetchedCredentials.length} credentials`);
      } catch (err) {
        console.error('[UserDashboard] Error fetching credentials:', err);
        setCredentialsError(err instanceof Error ? err.message : 'Failed to load credentials');
      } finally {
        setLoadingCredentials(false);
      }
    };

    fetchCredentials();
  }, [userDid]);

  // Create a map of card_id to credential for easy lookup
  const credentialsByCardId = new Map<string, VerifiableCredential>();
  credentials.forEach(cred => {
    if (cred.claim.card_id !== undefined && cred.claim.card_id !== null) {
      // Convert card_id to string for consistent mapping
      const cardIdStr = cred.claim.card_id.toString();
      credentialsByCardId.set(cardIdStr, cred);
    }
  });

  const filteredCards = cards
    .filter(card => {
      // Search filter
      if (!card.cardId.toString().includes(searchQuery)) return false;
      
      // Verification filter
      if (filterVerified === "verified") {
        const hasCredential = credentialsByCardId.has(card.cardId.toString());
        return hasCredential;
      } else if (filterVerified === "unverified") {
        const hasCredential = credentialsByCardId.has(card.cardId.toString());
        return !hasCredential;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "tier") return b.tier - a.tier;
      return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
    });

  const tierStats = [1, 2, 3].map(tier => ({
    tier,
    count: cards.filter(c => c.tier === tier).length,
    points: cards.filter(c => c.tier === tier).length * tier
  }));

  // Count verified credentials (non-revoked)
  const verifiedCredentialsCount = credentials.filter(c => !c.revoked).length;

  const copyDidToClipboard = async () => {
    if (userDid?.uri) {
      try {
        await navigator.clipboard.writeText(userDid.uri);
        setDidCopied(true);
        setTimeout(() => setDidCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy DID:', err);
      }
    }
  };

  // Remove full-page loading - show layout immediately

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-6">
              Unlock your personalized dashboard and start collecting cards
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium">
                Use the "Connect Wallet" button in the navigation above
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>Secure • Fast • Easy</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20 transition-all duration-300 hover:shadow-2xl">
          <div className="relative">
            <div
              className="w-full h-48 sm:h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              style={profile?.bannerUrl ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          <div className="px-6 sm:px-8 pb-6 pt-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-24 sm:-mt-28">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-gray-200 overflow-hidden flex-shrink-0 shadow-xl">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
                      <span className="text-5xl text-white font-bold">
                        {profile?.displayName?.[0]?.toUpperCase() || address?.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="min-w-0 sm:mt-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                      {profile?.displayName || `Profile #${profileId?.toString()}`}
                    </h1>
                    {score >= 10 && (
                      <Award className="w-6 h-6 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base font-mono bg-gray-100 inline-block px-3 py-1 rounded-lg">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  
                  {/* DID Display Section */}
                  {userDid ? (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-2 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-semibold text-purple-700">DID:</span>
                        </div>
                        <span className="text-xs font-mono text-gray-700">
                          {userDid.uri.slice(0, 20)}...{userDid.uri.slice(-8)}
                        </span>
                        <button
                          onClick={copyDidToClipboard}
                          className="ml-1 p-1 hover:bg-purple-100 rounded transition-colors"
                          title="Copy DID"
                        >
                          {didCopied ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : hasProfile && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                        <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium text-yellow-700">Creating DID...</span>
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  to="/profile/edit"
                  className="self-start sm:self-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap flex items-center gap-2"
                >
                  <span>Edit Profile</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            {profile?.bio && (
              <p className="text-gray-700 mt-6 line-clamp-2 text-base leading-relaxed">{profile.bio}</p>
            )}
          </div>

          <div className="grid grid-cols-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 text-center py-6 sm:py-8">
            <div className="group cursor-pointer transition-all duration-300 hover:bg-white/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {score}
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Reputation</p>
            </div>
            <div className="group cursor-pointer transition-all duration-300 hover:bg-white/50 border-x border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {cards.length}
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Cards</p>
            </div>
            <div className="group cursor-pointer transition-all duration-300 hover:bg-white/50 border-r border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {loadingCredentials ? '...' : verifiedCredentialsCount}
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Verified</p>
            </div>
            <div className="group cursor-pointer transition-all duration-300 hover:bg-white/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {recentActivity.length}
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Claims</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/*
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to="/discover" className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Discover</p>
                <p className="text-xs text-gray-600">New cards</p>
              </div>
            </div>
          </Link>
          <Link to="/leaderboard" className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Leaderboard</p>
                <p className="text-xs text-gray-600">Rankings</p>
              </div>
            </div>
          </Link>
          <Link to="/marketplace" className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Marketplace</p>
                <p className="text-xs text-gray-600">Trade</p>
              </div>
            </div>
          </Link>
          <Link to="/achievements" className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Achievements</p>
                <p className="text-xs text-gray-600">Badges</p>
              </div>
            </div>
          </Link>
        </div>
            */}
        {/* My Cards */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                My Cards
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {cards.length} total collectibles
                {verifiedCredentialsCount > 0 && (
                  <span className="ml-2 text-green-600 font-semibold">
                    • {verifiedCredentialsCount} verified
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm transition-all"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                >
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Sort By</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSortBy("date")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        sortBy === "date"
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Latest First
                    </button>
                    <button
                      onClick={() => setSortBy("tier")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        sortBy === "tier"
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Highest Tier
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Verification Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterVerified("all")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterVerified === "all"
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      All Cards
                    </button>
                    <button
                      onClick={() => setFilterVerified("verified")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        filterVerified === "verified"
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      Verified Only
                    </button>
                    <button
                      onClick={() => setFilterVerified("unverified")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterVerified === "unverified"
                          ? "bg-gray-600 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Unverified Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credentials Loading Error */}
          {credentialsError && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Credential Verification Unavailable</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Unable to load credential verification status. Cards are still displayed normally.
                </p>
              </div>
            </div>
          )}

          {profileLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl"></div>
                  <div className="mt-2 h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredCards.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredCards.map(card => {
                const cardIdStr = card.cardId.toString();
                const credential = credentialsByCardId.get(cardIdStr);
                return (
                  <CardDisplay 
                    key={cardIdStr} 
                    card={card} 
                    credential={credential}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No cards found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? "Try a different search term" : "Start your collection today!"}
              </p>
              {!searchQuery && (
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Sparkles className="w-5 h-5" />
                  Claim Your First Card
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Score Breakdown
          </h2>
          {profileLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : cards.length > 0 ? (
            <div className="space-y-4">
              {tierStats.map(({ tier, count, points }) => (
                <div key={tier} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                        tier === 1 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                        tier === 2 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        'bg-gradient-to-br from-purple-400 to-purple-600'
                      }`}>
                        T{tier}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Tier {tier} Cards</p>
                        <p className="text-xs text-gray-600">{count} cards collected</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{points} pts</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                        tier === 1 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                        tier === 2 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                        'bg-gradient-to-r from-purple-400 to-purple-600'
                      }`}
                      style={{ width: `${cards.length > 0 ? (count / cards.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total Score</span>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {score}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No cards yet. Start collecting to build your score!</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-green-600" />
              Recent Activity
            </h2>
            <Link
              to={`/profile/${address}`}
              className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loadingActivity ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-72 h-32 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex-shrink-0 w-72 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Card #{activity.card_id}</p>
                        <p className="text-xs text-gray-600">Template #{activity.template_id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      activity.claim_type === 'direct' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {activity.claim_type === 'direct' ? 'Direct' : 'Signature'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {new Date(activity.claimed_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Award className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6">Your card claims will appear here</p>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                Start Collecting
              </Link>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {cards.length > 0 && cards.length < 10 && (
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-1">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Collection Progress</h3>
                  <p className="text-sm text-gray-600">Keep collecting to unlock achievements!</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {cards.length}/10
                  </p>
                  <p className="text-xs text-gray-500">Next milestone</p>
                </div>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(cards.length / 10) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {10 - cards.length} more {10 - cards.length === 1 ? 'card' : 'cards'} to reach your next milestone!
              </p>
            </div>
          </div>
        )}

        {/* Achievement Banner */}
        {cards.length >= 10 && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-xl p-1 animate-in slide-in-from-bottom">
            <div className="bg-white rounded-xl p-6 text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-yellow-500 animate-bounce" />
              <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                Congratulations!
              </h3>
              <p className="text-gray-700 font-medium">
                You've collected {cards.length} cards! You're a true collector!
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
};