import { type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnectButton from '@/components/WalletConnectButton';

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
  requireAdmin?: boolean;
  requireIssuer?: boolean;
}

export default function ProtectedRoute({
  children,
  requireProfile = false,
  requireAdmin = false,
  requireIssuer = false,
}: ProtectedRouteProps) {
  const { connected, userProfile, isLoadingProfile, isInitializing } = useWallet();
  const [, setLocation] = useLocation();

  // Wait for wallet initialization (checking for existing connection)
  if (isInitializing || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we check your wallet
          </p>
        </Card>
      </div>
    );
  }

  // Check if user is connected
  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Wallet Required</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to access this page
          </p>
          <WalletConnectButton />
        </Card>
      </div>
    );
  }

  // Check if profile is required but user doesn't have one
  if (requireProfile && userProfile && !userProfile.hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">Activation Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to activate your on-chain profile to access this feature
          </p>
          <Button onClick={() => {
            const profileUrl = `/${userProfile}`;
            window.location.href = profileUrl;
          }}>
            Go to Profile
          </Button>
        </Card>
      </div>
    );
  }

  // Check if admin access is required
  if (requireAdmin && userProfile && !userProfile.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges to access this page
          </p>
          <Button onClick={() => setLocation('/')}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  // Check if issuer access is required
  if (requireIssuer && userProfile && !userProfile.isIssuer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have issuer privileges to access this page
          </p>
          <Button onClick={() => setLocation('/')}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
}
