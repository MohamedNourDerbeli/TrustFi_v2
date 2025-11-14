import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { ProfileView } from "../components/user/ProfileView";
import { useAuth } from "../hooks/useAuth";

export const ProfilePage: React.FC = () => {
  const { address: urlAddress } = useParams<{ address: string }>();
  const { address: connectedAddress, isConnected } = useAuth();

  if (!urlAddress) {
    // If no address in URL and user is connected, show their profile
    if (isConnected && connectedAddress) {
      return <Navigate to={`/profile/${connectedAddress}`} replace />;
    }
    // Otherwise redirect to home
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ProfileView address={urlAddress as `0x${string}`} />
    </div>
  );
};
