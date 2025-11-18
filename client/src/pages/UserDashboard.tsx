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
import { motion } from "motion/react";

export const UserDashboard: React.FC = () => {
  const { address, isConnected, hasProfile, userDid, isAdmin, isIssuer, grantDevAdmin, grantDevIssuer, clearDevRoles } = useAuth();
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // default cards per page

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

  // Create a map of card_id to credential for easy lookup (only linked credentials)
  const credentialsByCardId = new Map<string, VerifiableCredential>();
  const unmappedCredentials: VerifiableCredential[] = [];
  credentials.forEach(cred => {
    const rawCardId = (cred.claim as any).card_id;
    if (rawCardId === undefined || rawCardId === null || rawCardId === '' || rawCardId === '0') {
      unmappedCredentials.push(cred);
      return;
    }
    try {
      const cardIdStr = rawCardId.toString().trim();
      credentialsByCardId.set(cardIdStr, cred);
    } catch (e) {
      console.error('[UserDashboard] Failed to process credential card_id', rawCardId, e);
      unmappedCredentials.push(cred);
    }
  });
  if (unmappedCredentials.length > 0) {
    console.warn(`[UserDashboard] ${unmappedCredentials.length} credential(s) have no linked card_id and will not show as verified.`);
    unmappedCredentials.forEach(c => console.debug('[UserDashboard] Unmapped credential ID:', c.credentialId, 'claim contents:', c.claim));
  }

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

  // Reset page when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filterVerified, cards.length]);

  const totalCards = filteredCards.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCards = filteredCards.slice(startIndex, endIndex);

  const tierStats = [1, 2, 3].map(tier => ({
    tier,
    count: cards.filter(c => c.tier === tier).length,
    points: cards.filter(c => c.tier === tier).length * tier
  }));

  // Count verified credentials that are linked to existing cards (non-revoked & mapped)
  const verifiedCredentialsCount = credentials.filter(c => !c.revoked && (c.claim as any).card_id && credentialsByCardId.has((c.claim as any).card_id.toString().trim())).length;

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
      <div className="min-h-screen tf-app-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="tf-glass rounded-2xl shadow-xl p-8 text-center border tf-border">
            <div className="w-20 h-20 mx-auto mb-6 tf-gradient-accent rounded-full flex items-center justify-center">
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
            <div className="rounded-xl p-4 mb-6 tf-glass-alt">
              <p className="text-sm font-medium" style={{color:'var(--tf-text)'}}>
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
    <div className="min-h-screen tf-app-bg">
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 sm:px-6 lg:px-8">
        {/* Collection Hero */}
        {/* Hackathon Role Utility (dev/test only) */}
        {import.meta.env.VITE_ENABLE_HACKATHON_ROLE_BUTTONS === 'true' && (
          <div className="mt-4 mb-8 tf-glass-alt rounded-2xl border tf-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200 tracking-wide">Hackathon Role Sandbox</h3>
              {(isAdmin || isIssuer) && (
                <button onClick={clearDevRoles} className="text-xs px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-medium transitional">
                  Reset Roles
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Temporary front-end override for judges. Grants role flags locally so protected routes can be explored. Does not alter on-chain permissions.
            </p>
            <div className="flex flex-wrap gap-2">
              {!isIssuer && (
                <button
                  onClick={grantDevIssuer}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow hover:shadow-lg active:scale-[0.97]"
                >
                  Become Issuer (Local)
                </button>
              )}
              {!isAdmin && (
                <button
                  onClick={grantDevAdmin}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow hover:shadow-lg active:scale-[0.97]"
                >
                  Become Admin (Local)
                </button>
              )}
              {(isAdmin || isIssuer) && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-600/20 text-green-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Active: {isAdmin ? 'Admin' : 'Issuer'} role
                </span>
              )}
            </div>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="tf-collection-hero mt-6"
        >
          <div className="hero-bg" style={profile?.bannerUrl ? { backgroundImage:`url(${profile.bannerUrl})` } : { background:'linear-gradient(120deg,#0f172a,#1e3a8a)' }} />
          <div className="tf-collection-gradient"></div>
          <div className="tf-collection-overlay">
            <div className="tf-collection-header-row">
              <div className="tf-collection-avatar">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white font-bold text-2xl" style={{background:'var(--tf-gradient-accent)'}}>
                    {profile?.displayName?.[0]?.toUpperCase() || address?.slice(2,4).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 min-w-0">
                <div className="tf-collection-name">
                  <span>{profile?.displayName || `Profile #${profileId?.toString()}`}</span>
                  {score >= 10 && <Award className="w-6 h-6 text-yellow-400" />}
                </div>
                <div className="tf-collection-badges">
                  <span className="tf-badge font-mono">{address?.slice(0,6)}...{address?.slice(-4)}</span>
                  {userDid && (
                    <button onClick={copyDidToClipboard} className="tf-badge font-mono">
                      DID {userDid.uri.slice(0,12)}...{userDid.uri.slice(-6)}{" "}
                      {didCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                  {!userDid && hasProfile && <span className="tf-badge">Creating DID...</span>}
                  {profile?.bio && <span className="tf-badge" title={profile.bio}>Bio</span>}
                  <Link to="/profile/edit" className="tf-badge" style={{background:'var(--tf-gradient-accent)'}}>
                    Edit
                  </Link>
                </div>
              </div>
            </div>
            <div className="tf-collection-stats">
              <div className="tf-collection-stat">
                <span className="tf-collection-stat-label">REPUTATION</span>
                <span className="tf-collection-stat-value">{score}</span>
              </div>
              <div className="tf-collection-stat">
                <span className="tf-collection-stat-label">CARDS</span>
                <span className="tf-collection-stat-value">{cards.length}</span>
              </div>
              <div className="tf-collection-stat">
                <span className="tf-collection-stat-label">VERIFIED</span>
                <span className="tf-collection-stat-value">{loadingCredentials ? '...' : verifiedCredentialsCount}</span>
              </div>
              <div className="tf-collection-stat">
                <span className="tf-collection-stat-label">CLAIMS</span>
                <span className="tf-collection-stat-value">{recentActivity.length}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-14 pt-12">
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
            className="tf-toolbar flex flex-wrap gap-4"
          >
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--tf-text-muted)'}} />
              <input
                type="text"
                placeholder="Search by ID or trait"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tf-input"
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => setSortBy('date')} className={`tf-chip ${sortBy==='date' ? 'active' : ''}`}>Latest</button>
              <button onClick={() => setSortBy('tier')} className={`tf-chip ${sortBy==='tier' ? 'active' : ''}`}>Tier</button>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setFilterVerified('all')} className={`tf-chip ${filterVerified==='all' ? 'active' : ''}`}>All</button>
              <button onClick={() => setFilterVerified('verified')} className={`tf-chip ${filterVerified==='verified' ? 'active' : ''}`}>Verified</button>
              <button onClick={() => setFilterVerified('unverified')} className={`tf-chip ${filterVerified==='unverified' ? 'active' : ''}`}>Unverified</button>
            </div>
          </motion.div>

        {/* Quick Actions hidden until UX finalized */}
        {/* My Cards */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
          className="tf-glass rounded-3xl border tf-border p-6 shadow-2xl lg:p-8"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Sparkles className="h-6 w-6 text-purple-500" />
                My Cards
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {cards.length} total collectibles
                {verifiedCredentialsCount > 0 && (
                  <span className="ml-2 font-semibold text-green-500">
                    • {verifiedCredentialsCount} verified
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-xl border border-white/10 bg-white/20 p-2 text-slate-600 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 dark:text-slate-200`}
                aria-label="Toggle filters"
              >
                <Filter className="h-5 w-5" />
              </button>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/30 p-1 dark:border-white/5 dark:bg-slate-800/60">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg px-3 py-2 transition ${viewMode === "grid" ? "bg-white/90 text-slate-900 shadow" : "text-slate-500 hover:bg-white/30 dark:text-slate-300"}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-3 py-2 transition ${viewMode === "list" ? "bg-white/90 text-slate-900 shadow" : "text-slate-500 hover:bg-white/30 dark:text-slate-300"}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mb-6 rounded-2xl border border-white/10 bg-white/70 p-4 shadow-inner dark:bg-slate-950/60"
            >
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-600 dark:text-slate-300">Sort By</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSortBy("date")}
                      className={`px-4 py-2 text-sm font-medium transition-all ${
                        sortBy === "date"
                          ? "rounded-lg bg-purple-600 text-white shadow-lg"
                          : "rounded-lg bg-white/80 text-gray-700 hover:bg-white"
                      }`}
                    >
                      Latest First
                    </button>
                    <button
                      onClick={() => setSortBy("tier")}
                      className={`px-4 py-2 text-sm font-medium transition-all ${
                        sortBy === "tier"
                          ? "rounded-lg bg-purple-600 text-white shadow-lg"
                          : "rounded-lg bg-white/80 text-gray-700 hover:bg-white"
                      }`}
                    >
                      Highest Tier
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-600 dark:text-slate-300">Verification Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterVerified("all")}
                      className={`px-4 py-2 text-sm font-medium transition-all ${
                        filterVerified === "all"
                          ? "rounded-lg bg-purple-600 text-white shadow-lg"
                          : "rounded-lg bg-white/80 text-gray-700 hover:bg-white"
                      }`}
                    >
                      All Cards
                    </button>
                    <button
                      onClick={() => setFilterVerified("verified")}
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-all ${
                        filterVerified === "verified"
                          ? "rounded-lg bg-green-600 text-white shadow-lg"
                          : "rounded-lg bg-white/80 text-gray-700 hover:bg-white"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      Verified Only
                    </button>
                    <button
                      onClick={() => setFilterVerified("unverified")}
                      className={`px-4 py-2 text-sm font-medium transition-all ${
                        filterVerified === "unverified"
                          ? "rounded-lg bg-slate-700 text-white shadow-lg"
                          : "rounded-lg bg-white/80 text-gray-700 hover:bg-white"
                      }`}
                    >
                      Unverified Only
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Credentials Loading Error */}
          {credentialsError && (
            <div className="mb-6 p-4 tf-glass-alt rounded-xl border tf-border flex items-start gap-3">
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
            <div className="grid justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl"></div>
                  <div className="mt-2 h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredCards.length > 0 ? (
            <>
              {viewMode === "list" && (
                <div className="hidden sm:grid grid-cols-[minmax(0,2.6fr)_repeat(4,minmax(0,1fr))] gap-4 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>Item</span>
                  <span>Tier</span>
                  <span>Points</span>
                  <span>Status</span>
                  <span>Claimed</span>
                </div>
              )}
              <div className={viewMode === "grid" ? "grid justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "flex flex-col gap-3"}>
                {paginatedCards.map(card => {
                  const cardIdStr = card.cardId.toString();
                  const credential = credentialsByCardId.get(cardIdStr);
                  return (
                    <CardDisplay 
                      key={cardIdStr} 
                      card={card} 
                      credential={credential}
                      compact={viewMode === "list"}
                    />
                  );
                })}
              </div>
              {/* Pagination Controls */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Showing</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-2 py-1 bg-white"
                  >
                    {[6, 9, 12, 24].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>per page • {totalCards} total</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                  >Prev</button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isActive = page === currentPage;
                    if (totalPages > 7) {
                      const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      if (!show) {
                        if (page === 2 && currentPage > 3) return <span key={page} className="px-2 text-gray-400">…</span>;
                        if (page === totalPages - 1 && currentPage < totalPages - 2) return <span key={page} className="px-2 text-gray-400">…</span>;
                        return null;
                      }
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-medium border ${isActive ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                      >{page}</button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                  >Next</button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 tf-glass-alt rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No cards found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? "Try a different search term" : "Start your collection today!"}
              </p>
              {!searchQuery && (
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 px-8 py-4 tf-gradient-accent text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Sparkles className="w-5 h-5" />
                  Claim Your First Card
                </Link>
              )}
              {credentials.length > 0 && verifiedCredentialsCount === 0 && filterVerified === 'verified' && (
                <div className="mb-6 p-4 tf-glass-alt border tf-border rounded-xl max-w-lg mx-auto text-left">
                  <p className="text-sm font-semibold text-yellow-800">You have credentials, but none are linked to current cards.</p>
                  <p className="text-xs text-yellow-700 mt-1">This usually means the credential's card_id was not stored or the card was issued to a different profile. Issue a new card after ensuring credential storage passes the cardId, or refresh if you just minted.</p>
                </div>
              )}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.18 }}
          className="grid gap-10 lg:grid-cols-2"
        >
          <div className="tf-glass rounded-2xl border tf-border p-6 shadow-xl">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Score Breakdown
            </h2>
            {profileLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-200"></div>
                    <div className="h-8 flex-1 rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>
            ) : cards.length > 0 ? (
              <div className="space-y-4">
                {tierStats.map(({ tier, count, points }) => (
                  <div key={tier} className="group">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white shadow-lg ${
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
                    <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
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
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-4">
                  <span className="text-lg font-bold text-gray-900">Total Score</span>
                  <span className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                    {score}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Award className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No cards yet. Start collecting to build your score!</p>
              </div>
            )}
          </div>

          <div className="tf-glass rounded-2xl border tf-border p-6 shadow-xl">
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
                  className="flex-shrink-0 w-72 p-5 tf-glass-alt rounded-xl border tf-border hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
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
              <div className="w-20 h-20 mx-auto mb-4 tf-glass-alt rounded-full flex items-center justify-center">
                <Award className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6">Your card claims will appear here</p>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-6 py-3 tf-gradient-success text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                Start Collecting
              </Link>
            </div>
          )}
        </div>
        </motion.section>

        {/* Progress Indicator */}
        {cards.length > 0 && cards.length < 10 && (
          <div className="tf-gradient-accent rounded-2xl shadow-xl p-1">
            <div className="tf-glass rounded-xl p-6">
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
                  className="absolute inset-y-0 left-0 tf-gradient-accent rounded-full transition-all duration-1000 ease-out"
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
          <div className="tf-gradient-warning rounded-2xl shadow-xl p-1 animate-in slide-in-from-bottom">
            <div className="tf-glass rounded-xl p-6 text-center">
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