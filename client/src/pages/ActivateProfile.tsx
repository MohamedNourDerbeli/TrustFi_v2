import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { Shield, Zap, Award, TrendingUp } from 'lucide-react';

export default function ActivateProfile() {
  const [, setLocation] = useLocation();
  const [isActivating, setIsActivating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { connected, provider, address, refreshProfile, userProfile, isLoadingProfile } = useWallet();
  const { toast } = useToast();

  // Check if user already has a profile
  useEffect(() => {
    if (!isLoadingProfile && userProfile?.hasProfile) {
      toast({
        title: 'Profile Already Active',
        description: 'You already have an active profile. Redirecting...',
      });
      setLocation('/dashboard');
    } else if (!isLoadingProfile) {
      setIsChecking(false);
    }
  }, [userProfile, isLoadingProfile, setLocation, toast]);

  const handleActivate = async () => {
    if (!connected || !provider || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsActivating(true);

      // Initialize contract service
      if (!contractService.isInitialized()) {
        await contractService.initialize(provider);
      }

      // Check if profile already exists
      try {
        const existingProfile = await contractService.getProfileByOwner(address);
        if (existingProfile) {
          toast({
            title: 'Profile Already Exists',
            description: 'You already have an active profile. Redirecting...',
          });
          
          // Force refresh profile state
          await refreshProfile();
          
          // Redirect immediately
          setLocation('/dashboard');
          return;
        }
      } catch (err: any) {
        // Profile doesn't exist OR metadata URI is invalid
        if (err.message?.includes('Profile not found')) {
          console.log('No existing profile found, proceeding with creation');
        } else {
          // Any other error might mean profile exists but has issues
          console.log('Error checking profile:', err.message);
          
          // Try to refresh profile anyway
          const profile = await refreshProfile();
          if (profile?.hasProfile) {
            toast({
              title: 'Profile Already Exists',
              description: 'You already have an active profile. Redirecting...',
            });
            setLocation('/dashboard');
            return;
          }
        }
      }

      // Create simple metadata (no name/bio needed)
      const metadata = {
        name: `User ${address.slice(0, 6)}`,
        description: 'TrustFi Profile',
      };

      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      toast({
        title: 'Confirm Transaction',
        description: 'Please confirm the transaction in your wallet',
      });

      // Create on-chain profile
      await contractService.createProfile(metadataURI);

      toast({
        title: 'Profile Activated!',
        description: 'You can now start earning reputation',
      });

      // Wait for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh profile multiple times to ensure it's loaded
      let retries = 0;
      let profileLoaded = false;
      
      while (retries < 5 && !profileLoaded) {
        console.log(`Attempt ${retries + 1}: Refreshing profile...`);
        const profile = await refreshProfile();
        console.log('Profile refresh result:', profile);
        
        if (profile?.hasProfile) {
          console.log('✅ Profile loaded successfully!');
          profileLoaded = true;
          break;
        }
        retries++;
        if (retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!profileLoaded) {
        console.warn('⚠️ Profile not loaded after retries, but redirecting anyway');
        toast({
          title: 'Profile Created',
          description: 'Your profile was created. If you see issues, please refresh the page.',
        });
      }

      // Force a page reload to ensure fresh state
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Activation error:', error);
      
      // Check for specific error types
      if (error.message?.includes('ProfileAlreadyExists') || 
          error.message?.includes('execution reverted') ||
          error.code === 'CALL_EXCEPTION') {
        
        // Profile already exists - refresh and redirect
        console.log('Profile already exists, refreshing state...');
        
        toast({
          title: 'Profile Already Exists',
          description: 'You already have an active profile. Redirecting...',
        });
        
        // Force refresh profile state
        await refreshProfile();
        
        // Redirect immediately
        setLocation('/dashboard');
      } else if (error.message?.includes('user rejected') || 
                 error.code === 'ACTION_REJECTED') {
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the transaction',
          variant: 'destructive',
        });
      } else if (error.message?.includes('insufficient funds')) {
        toast({
          title: 'Insufficient Funds',
          description: 'You need ETH to pay for gas fees',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Activation Failed',
          description: error.message || 'Failed to activate profile. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (isChecking || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="py-12 px-4">
          <Card className="p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Checking Profile...</h2>
            <p className="text-muted-foreground">
              Please wait while we check your profile status
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="py-12 px-4">
          <Card className="p-8 text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to activate your profile
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Activate Your TrustFi Profile
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start building your on-chain reputation and earn credentials
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Instant Activation</h3>
              <p className="text-sm text-muted-foreground">
                One-click activation, no forms to fill
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Earn Credentials</h3>
              <p className="text-sm text-muted-foreground">
                Receive reputation cards from verified issuers
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-500/10 mb-4">
                <TrendingUp className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Build Reputation</h3>
              <p className="text-sm text-muted-foreground">
                Grow your on-chain reputation score
              </p>
            </Card>
          </div>

          {/* Activation Card */}
          <Card className="p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="text-muted-foreground">
                Activate your profile to start earning reputation
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">What happens next:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  <span>Confirm the transaction in your wallet (one-time gas fee)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  <span>Your profile will be created on the blockchain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  <span>Customize your profile in Settings (free, no gas!)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">4.</span>
                  <span>Start earning reputation cards and building trust</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isActivating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Activating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Activate Profile
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By activating, you agree to create an on-chain profile. You can customize it later in Settings.
            </p>
          </Card>

          {/* Info Section */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Your profile will be identified by your wallet address until you claim a username
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
