// components/auth/ProtectedRoute.tsx
import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { logger } from '../../lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireIssuer?: boolean;
  requireProfile?: boolean;
  requireNoProfile?: boolean; // For create profile page - redirect if profile exists
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireIssuer = false,
  requireProfile = false,
  requireNoProfile = false,
}) => {
  const { isConnected, hasProfile, isAdmin, isIssuer, isLoading } = useAuth();
  const location = useLocation();
  const lastLoggedStateRef = useRef<string>('');

  // Only log when there's a meaningful state change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isLoading) {
      const currentState = `${location.pathname}-${isConnected}-${hasProfile}-${isAdmin}-${isIssuer}`;
      
      // Only log if state actually changed
      if (lastLoggedStateRef.current !== currentState) {
        logger.debug('[ProtectedRoute] Auth check complete:', {
          pathname: location.pathname,
          isConnected,
          hasProfile,
          isAdmin,
          isIssuer,
        });
        lastLoggedStateRef.current = currentState;
      }
    }
  }, [location.pathname, isConnected, hasProfile, isAdmin, isIssuer, isLoading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Redirect to home if not connected
  if (!isConnected) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user should NOT have a profile (for create profile page)
  if (requireNoProfile && hasProfile) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Check if profile is required
  if (requireProfile && !hasProfile) {
    // Don't show message if user is already on home page
    const message = location.pathname !== '/' ? 'Please create a profile first' : undefined;
    return <Navigate to="/" state={{ from: location, message }} replace />;
  }

  // Check if admin role is required
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" state={{ from: location, message: 'Admin access required' }} replace />;
  }

  // Check if issuer role is required
  if (requireIssuer && !isIssuer) {
    return <Navigate to="/" state={{ from: location, message: 'Issuer access required' }} replace />;
  }

  return <>{children}</>;
};
