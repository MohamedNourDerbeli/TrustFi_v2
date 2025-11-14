import React from "react";
import { useAuth } from "../hooks/useAuth";
import { DiscoverCollectibles } from "../components/user/DiscoverCollectibles";
import { Link } from "react-router-dom";

export const DiscoverPage: React.FC = () => {
  const { isConnected, hasProfile } = useAuth();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to discover available collectibles
          </p>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Create Your Profile First
          </h2>
          <p className="text-gray-600 mb-6">
            You need to create a profile before you can claim collectibles
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Discover Collectibles
        </h1>
        <p className="text-gray-600">
          Browse and claim available reputation cards to build your credentials
        </p>
      </div>

      <DiscoverCollectibles />
    </div>
  );
};
