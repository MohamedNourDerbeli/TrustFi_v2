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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
        <p className="text-gray-600">
          Customize your profile with avatar, banner, and personal information
        </p>
      </div>

      <ProfileEdit />
    </div>
  );
};
