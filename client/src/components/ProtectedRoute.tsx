import { type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { Shield, AlertCircle, Lock, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnectButton from '@/components/WalletConnectButton';

/**
 * Type representing the reason for authorization failure
 */
export const AuthFailureReason = {
  NO_WALLET: 'no-wallet',
  NO_PROFILE: 'no-profile',
  INSUFFICIENT_ROLE: 'insufficient-role',
} as const;

export type AuthFailureReason = typeof AuthFailureReason[keyof typeof AuthFailureReason];

/**
 * Result of role checking operation
 */
export interface RoleCheckResult {
  authorized: boolean;
  reason?: AuthFailureReason;
  redirectPath?: string;
  message?: string;
}

/**
 * Props for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
  requireAdmin?: boolean;
  requireIssuer?: boolean;
  fallbackPath?: string;
  customUnauthorizedMessage?: string;
}

/**
 * Loading skeleton component displayed while checking permissions
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md shadow-lg">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Checking Permissions</h2>
        <p className="text-muted-foreground">
          Please wait while we verify your access...
        </p>
      </Card>
    </div>
  );
}

/**
 * Performs granular role checking with specific failure reasons
 */
function checkRoleAuthorization(
  connected: boolean,
  userProfile: any,
  requireProfile: boolean,
  requireAdmin: boolean,
  requireIssuer: boolean,
  fallbackPath?: string
): RoleCheckResult {
  // Check 1: Wallet connection
  if (!connected) {
    return {
      authorized: false,
      reason: AuthFailureReason.NO_WALLET,
      redirectPath: fallbackPath || '/',
      message: 'Please connect your wallet to access this page',
    };
  }

  // Check 2: Profile requirement
  if (requireProfile && userProfile && !userProfile.hasProfile) {
    return {
      authorized: false,
      reason: AuthFailureReason.NO_PROFILE,
      redirectPath: fallbackPath || `/${userProfile}`,
      message: 'You need to activate your on-chain profile to access this feature',
    };
  }

  // Check 3: Admin role requirement
  if (requireAdmin && userProfile && !userProfile.isAdmin) {
    return {
      authorized: false,
      reason: AuthFailureReason.INSUFFICIENT_ROLE,
      redirectPath: fallbackPath || '/',
      message: 'You need admin privileges to access this page',
    };
  }

  // Check 4: Issuer role requirement
  if (requireIssuer && userProfile && !userProfile.isIssuer) {
    return {
      authorized: false,
      reason: AuthFailureReason.INSUFFICIENT_ROLE,
      redirectPath: fallbackPath || '/',
      message: 'You need issuer privileges to access this page',
    };
  }

  // All checks passed
  return {
    authorized: true,
  };
}

export default function ProtectedRoute({
  children,
  requireProfile = false,
  requireAdmin = false,
  requireIssuer = false,
  fallbackPath,
  customUnauthorizedMessage,
}: ProtectedRouteProps) {
  const { connected, userProfile, isLoadingProfile, isInitializing } = useWallet();
  const [, setLocation] = useLocation();

  // Wait for wallet initialization (checking for existing connection)
  if (isInitializing || isLoadingProfile) {
    return <LoadingSkeleton />;
  }

  // Perform granular role checking
  const roleCheck = checkRoleAuthorization(
    connected,
    userProfile,
    requireProfile,
    requireAdmin,
    requireIssuer,
    fallbackPath
  );

  // If authorization failed, render appropriate error UI
  if (!roleCheck.authorized) {
    return renderUnauthorizedUI(
      roleCheck,
      customUnauthorizedMessage,
      setLocation
    );
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
}

/**
 * Renders the appropriate unauthorized UI based on the failure reason
 */
function renderUnauthorizedUI(
  roleCheck: RoleCheckResult,
  customMessage: string | undefined,
  setLocation: (path: string) => void
): React.ReactElement {
  const message = customMessage || roleCheck.message || 'Access denied';
  const redirectPath = roleCheck.redirectPath || '/';

  switch (roleCheck.reason) {
    case AuthFailureReason.NO_WALLET:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="p-8 text-center max-w-md shadow-lg">
            <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <WalletConnectButton />
          </Card>
        </div>
      );

    case AuthFailureReason.NO_PROFILE:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="p-8 text-center max-w-md shadow-lg">
            <UserX className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Profile Activation Required</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => setLocation(redirectPath)}>
              Activate Profile
            </Button>
          </Card>
        </div>
      );

    case AuthFailureReason.INSUFFICIENT_ROLE:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="p-8 text-center max-w-md shadow-lg">
            <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setLocation(redirectPath)}>
                Go Back
              </Button>
              <Button variant="outline" onClick={() => setLocation('/')}>
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      );

    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="p-8 text-center max-w-md shadow-lg">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => setLocation(redirectPath)}>
              Go Back
            </Button>
          </Card>
        </div>
      );
  }
}
