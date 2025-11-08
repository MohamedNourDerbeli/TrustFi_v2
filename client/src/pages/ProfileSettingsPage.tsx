import { useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Shield } from 'lucide-react';
import Navigation from '@/components/Navigation';
import WalletConnectButton from '@/components/WalletConnectButton';
import ProfileEditForm from '@/components/ProfileEditForm';

export default function ProfileSettingsPage() {
  const [, setLocation] = useLocation();
  const { connected, address } = useWallet();
  const { offChainData } = useProfile();

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="py-12 px-4">
          <Card className="p-8 text-center max-w-md mx-auto">
            <User className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to access settings
            </p>
            <WalletConnectButton />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="py-8 px-4 animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              if (offChainData?.username) {
                setLocation(`/${offChainData.username}`);
              } else {
                setLocation(address ? `/${address}` : '/profile');
              }
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Settings</h2>
              <nav className="space-y-0.5">
                <button 
                  onClick={() => setLocation('/settings/profile')}
                  className="w-full text-left px-3 py-2.5 rounded-md bg-muted text-foreground font-medium text-sm flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button 
                  onClick={() => setLocation('/settings/privacy')}
                  className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted/50 text-muted-foreground text-sm flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Privacy
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="md:col-span-4">
              <div className="max-w-2xl">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
                  <p className="text-muted-foreground">
                    You can set preferred display name, create your profile URL and manage other personal settings.
                  </p>
                </div>

                <ProfileEditForm address={address!} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
