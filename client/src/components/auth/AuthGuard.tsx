// components/auth/AuthGuard.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { WalletConnect } from './WalletConnect';

interface AuthGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireProfile = false 
}) => {
  const { isConnected, hasProfile, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not connected, show wallet connection page
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to TrustFi
            </h1>
            <p className="text-gray-600 mb-6">
              Connect your wallet to access your reputation profile
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If profile is required but user doesn't have one, show message
  if (requireProfile && !hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Profile Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to create a profile to access this page.
            </p>
            <a
              href="/create-profile"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Profile
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};
