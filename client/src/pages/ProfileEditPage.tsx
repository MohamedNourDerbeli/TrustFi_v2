import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProfileEdit } from "../components/user/ProfileEdit";

export const ProfileEditPage: React.FC = () => {
  const { isConnected, hasProfile, address } = useAuth();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  if (!hasProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProfileEdit />;
};
