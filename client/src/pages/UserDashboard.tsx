import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { supabase, type ClaimLogRow } from "../lib/supabase";
import { Search, TrendingUp, Award, Sparkles, Filter, Grid, List, ChevronRight } from "lucide-react";

export const UserDashboard: React.FC = () => {
  const { address, isConnected, isLoading } = useAuth();
  const { profile, profileId, score, cards, loading: profileLoading } = useProfile(address);
  const [recentActivity, setRecentActivity] = useState<ClaimLogRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "tier">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

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
          .limit(10);

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

  const filteredCards = cards
    .filter(card => card.cardId.toString().includes(searchQuery))
    .sort((a, b) => {
      if (sortBy === "tier") return b.tier - a.tier;
      return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
    });

  const tierStats = [1, 2, 3].map(tier => ({
    tier,
    count: cards.filter(c => c.tier === tier).length,
    points: cards.filter(c => c.tier === tier).length * tier
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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

          <div className="grid grid-cols-3 border-t border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 text-center py-6 sm:py-8">
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
            <div className="group cursor-pointer transition-all duration-300 hover:bg-white/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {recentActivity.length}
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Recent Claims</p>
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
              <p className="text-sm text-gray-600 mt-1">{cards.length} total collectibles</p>
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
              <div className="flex flex-wrap gap-3">
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
          )}

          {profileLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl"></div>
                  <div className="mt-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCards.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredCards.map(card => (
                <div
                  key={card.cardId.toString()}
                  className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:scale-105 cursor-pointer"
                >
                  <div className={`relative w-full h-48 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-3xl overflow-hidden ${
                    card.tier === 1 ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' :
                    card.tier === 2 ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600' :
                    'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
                  }`}>
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                      backgroundSize: '50px 50px'
                    }}></div>
                    <div className="relative">
                      <div className="text-5xl font-black drop-shadow-lg">#{card.cardId.toString()}</div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold">
                        T{card.tier}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">Template #{card.templateId.toString()}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        card.tier === 1 ? 'bg-green-100 text-green-700' :
                        card.tier === 2 ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {card.tier} pts
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(card.claimedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
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