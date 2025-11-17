import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { logger } from "../lib/logger";
import { LIMITS } from "../lib/constants";
import FloatingLinesBackground from "../components/shared/FloatingLinesBackground";

interface RecentActivity {
  id: string;
  profile_id: bigint;
  template_id: bigint;
  card_id: bigint;
  claim_type: string;
  claimed_at: string;
}

export const HomePage: React.FC = () => {
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
    <div className="relative">
      {/* Decorative background */}
      <FloatingLinesBackground className="z-0 opacity-60" />
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-blue-900 mb-4">
              Connect your wallet to get started
            </p>
            <p className="text-sm text-blue-700">
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
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

      {/* Role-based CTAs */}
      {isConnected && (
        <div className="py-12 px-4 space-y-6">
          {isAdmin && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Admin Portal
              </h3>
              <p className="text-purple-700 mb-4">
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Issuer Portal
              </h3>
              <p className="text-green-700 mb-4">
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
