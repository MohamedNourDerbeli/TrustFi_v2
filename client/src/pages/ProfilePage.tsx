import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProfilePage: React.FC = () => {
  const { isConnected } = useAuth();

  // Redirect to dashboard if connected, otherwise to home
  if (isConnected) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/" replace />;
};
