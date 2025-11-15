// pages/CreateProfilePage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CreateProfile } from '../components/user/CreateProfile';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export const CreateProfilePage: React.FC = () => {
  const { isConnected, hasProfile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not connected
  useEffect(() => {
    if (!loading && !isConnected) {
      navigate('/', { replace: true });
    }
  }, [isConnected, loading, navigate]);

  // Redirect to dashboard if already has profile
  useEffect(() => {
    if (!loading && hasProfile) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isConnected) {
    return null; // Will redirect
  }

  return <CreateProfile />;
};
