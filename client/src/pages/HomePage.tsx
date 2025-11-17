import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { logger } from "../lib/logger";
import { LIMITS } from "../lib/constants";
import FloatingLines from "../components/shared/FloatingLines";
import { useTheme } from "../hooks";

interface RecentActivity {
  id: string;
  profile_id: bigint;
  template_id: bigint;
  card_id: bigint;
  claim_type: string;
  claimed_at: string;
}

export const HomePage: React.FC = () => {
  const mode = useTheme();
  const { isConnected, hasProfile, isAdmin, isIssuer, isLoading } = useAuth();
  const location = useLocation();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const lastLoggedStateRef = useRef<string>('');

  // Only log when state actually changes (and only final state)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const currentState = `${isConnected}-${hasProfile}-${isLoading}`;
      
      // Only log when loading is complete to reduce noise
      if (lastLoggedStateRef.current !== currentState && !isLoading) {
        logger.debug('[HomePage] Auth ready:', { isConnected, hasProfile });
        lastLoggedStateRef.current = currentState;
      }
    }
  }, [isConnected, hasProfile, isLoading]);

  // Show message if redirected from protected route
  useEffect(() => {
    const state = location.state as { message?: string };
    if (state?.message) {
      toast.error(state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch recent platform activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('claims_log')
          .select('*')
          .order('claimed_at', { ascending: false })
          .limit(LIMITS.MAX_PLATFORM_ACTIVITY);

        if (error) {
          console.error('Error fetching recent activity:', error);
        } else if (data) {
          setRecentActivity(data as RecentActivity[]);
        }
      } catch (err) {
        console.error('Error fetching recent activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchRecentActivity();
    // supabase is a stable singleton, no need to add to dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Decorative background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <FloatingLines
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={[10, 15, 20]}
          lineDistance={[8, 6, 4]}
          bendRadius={5.0}
          bendStrength={-0.5}
          interactive
          parallax
          linesGradient={mode === 'dark' 
            ? ["#0b1a3a", "#1a0b3a", "#3b1d65", "#045d74"]
            : ["#1e3a8a", "#4c1d95", "#7c3aed", "#06b6d4"]}
          intensity={mode === 'dark' ? 0.55 : 0.7}
          mixBlendMode={mode === 'dark' ? 'screen' : 'multiply'}
        />
        {/* Fade edges for readability */}
        <div className="absolute inset-0" style={{
          background: mode === 'dark'
            ? 'linear-gradient(180deg, rgba(8,14,26,0.6) 0%, rgba(8,14,26,0.35) 40%, rgba(8,14,26,0.85) 100%)'
            : 'linear-gradient(180deg, rgba(8,14,26,0.25) 0%, rgba(8,14,26,0.15) 40%, rgba(8,14,26,0.35) 100%)'
        }} />
      </div>
      {/* Content container */}
      <div className="relative z-10 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Build Your Cross-Chain Reputation
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          TrustFi is a composable reputation system that lets you create a soulbound profile,
          collect reputation cards, and build verifiable credentials across chains.
        </p>
        {!isConnected ? (
          <div className="rounded-xl p-6 max-w-md mx-auto border border-blue-200/60 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-slate-900/30">
            <p className="text-blue-900 dark:text-slate-200 mb-2 font-medium">
              Connect your wallet to get started
            </p>
            <p className="text-sm text-blue-700 dark:text-slate-400">
              Use the "Connect Wallet" button in the navigation bar above
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner size="large" />
          </div>
        ) : !hasProfile ? (
          <Link
            to="/create-profile"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Create My Profile
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Go to Dashboard
          </Link>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-3 gap-8 py-12 px-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/40 shadow-md p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Soulbound Profile
          </h3>
          <p className="text-gray-600">
            Create a unique, non-transferable profile NFT that represents your identity across chains.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/40 shadow-md p-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Reputation Cards
          </h3>
          <p className="text-gray-600">
            Collect verifiable credentials from trusted issuers to build your reputation score.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/40 shadow-md p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Composable System
          </h3>
          <p className="text-gray-600">
            Your reputation is portable and composable across different applications and chains.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <section className="py-14 px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/40 shadow p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 grid place-items-center mb-4 font-semibold">1</div>
            <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
            <p className="text-gray-600">Mint a soulbound Profile NFT to anchor your identity and start building a portable reputation.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/40 shadow p-6">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 grid place-items-center mb-4 font-semibold">2</div>
            <h3 className="text-lg font-semibold mb-2">Collect Reputation Cards</h3>
            <p className="text-gray-600">Receive verifiable credentials from issuers for achievements, on-chain actions, and community contributions.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/40 shadow p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 grid place-items-center mb-4 font-semibold">3</div>
            <h3 className="text-lg font-semibold mb-2">Use Across Apps</h3>
            <p className="text-gray-600">Bring your score and badges anywhere. Gate features, boost trust, and unlock tailored experiences.</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-14 px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Use Cases</h2>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Transforming credentials across industries</p>
        </div>

        {/* Removed cover image for transparent style */}

        <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
          {/* Higher Education */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/50 shadow-md p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">1</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Higher Education</h3>
                <p className="mt-1 text-gray-600 dark:text-slate-400">Issue and verify academic records with on-chain credentials.</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300 list-disc list-inside">
                  <li>Instant verification for employers</li>
                  <li>Reduce transcript overhead</li>
                  <li>Prevent diploma fraud</li>
                  <li>Modern, verifiable digital records</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Corporate HR & Recruiting */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/50 shadow-md p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold">2</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Corporate HR & Recruiting</h3>
                <p className="mt-1 text-gray-600 dark:text-slate-400">Verify candidate credentials instantly while cutting review costs.</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300 list-disc list-inside">
                  <li>Seconds instead of weeks</li>
                  <li>Lower background-check spend</li>
                  <li>Reduce resume fraud</li>
                  <li>Streamlined hiring flows</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Freelance & Gig Economy */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/50 shadow-md p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold">3</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Freelance & Gig Economy</h3>
                <p className="mt-1 text-gray-600 dark:text-slate-400">Carry your reputation from platform to platform.</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300 list-disc list-inside">
                  <li>Portable reputation everywhere</li>
                  <li>Verifiable work history</li>
                  <li>Stand out in competitive markets</li>
                  <li>Platform-independent trust score</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Web3 Communities & DAOs */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/50 shadow-md p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">4</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Web3 Communities & DAOs</h3>
                <p className="mt-1 text-gray-600 dark:text-slate-400">Native on-chain credentials for community participation.</p>
                <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300 list-disc list-inside">
                  <li>Membership credentials</li>
                  <li>Governance participation badges</li>
                  <li>Contribution & achievement tracking</li>
                  <li>Composable reputation across apps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-based CTAs */}
      {isConnected && (
        <div className="py-12 px-4 space-y-6">
          {isAdmin && (
            <div className="rounded-2xl border border-purple-300/50 dark:border-purple-900/40 bg-white/80 dark:bg-slate-900/50 backdrop-blur p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Admin Portal
              </h3>
              <p className="text-purple-700 dark:text-purple-300 mb-4">
                You have admin access. Manage the platform from the admin dashboard.
              </p>
              <Link
                to="/admin"
                className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Go to Admin Dashboard
              </Link>
            </div>
          )}

          {isIssuer && (
            <div className="rounded-2xl border border-emerald-300/50 dark:border-emerald-900/40 bg-white/80 dark:bg-slate-900/50 backdrop-blur p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Issuer Portal
              </h3>
              <p className="text-green-700 dark:text-emerald-300 mb-4">
                You have issuer access. Manage your templates and issue credentials.
              </p>
              <Link
                to="/issuer"
                className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Go to Issuer Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
