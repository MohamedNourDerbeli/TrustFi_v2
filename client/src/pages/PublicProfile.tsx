import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useWallet } from '@/contexts/WalletContext';
import { useProfile } from '@/contexts/ProfileContext';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useToast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  User,
  Award, 
  Calendar,
  TrendingUp,
  Copy,
  Check,
  Settings,
  Share2,
  Mail,
  Globe,
  Github,
  MessageCircle,
  Send,
  Twitter,
  Linkedin,
  Zap,
  Eye
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ActivateProfileDialog from '@/components/ActivateProfileDialog';
import { ReputationCardDisplay } from '@/components/ReputationCardDisplay';
import { ReputationCardModal } from '@/components/ReputationCardModal';
import type { ReputationCard } from '@/types/reputationCard';

export default function PublicProfile() {
  const [, params] = useRoute('/:address');
  const [, setLocation] = useLocation();
  const { provider: walletProvider, address: connectedAddress } = useWallet();
  const { offChainData: cachedOffChainData } = useProfile();
  const { toast } = useToast();

  const targetAddress = params?.address;
  const [copied, setCopied] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ReputationCard | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Check if viewing own profile
  const isViewingOwnProfile = 
    connectedAddress && 
    targetAddress && 
    (connectedAddress.toLowerCase() === targetAddress.toLowerCase() ||
     cachedOffChainData?.username?.toLowerCase() === targetAddress.toLowerCase());

  // Use custom hook for data fetching - always fetch to get reputation cards
  const { 
    profileData: fetchedProfileData, 
    offChainData: fetchedOffChainData, 
    reputationCards: fetchedReputationCards, 
    resolvedAddress: fetchedResolvedAddress, 
    error: fetchedError 
  } = usePublicProfile(
    targetAddress, // Always fetch to get reputation cards
    walletProvider, 
    connectedAddress
  );

  // Use cached data for own profile's basic info, but always use fetched reputation cards
  const profileData = fetchedProfileData;
  const offChainData = isViewingOwnProfile ? (cachedOffChainData || fetchedOffChainData) : fetchedOffChainData;
  const reputationCards = fetchedReputationCards;
  const resolvedAddress = isViewingOwnProfile ? connectedAddress : fetchedResolvedAddress;
  const error = fetchedError;

  const isOwnProfile = isViewingOwnProfile;

  // Track profile views (only for other people's profiles)
  useEffect(() => {
    if (resolvedAddress && !isOwnProfile && !error) {
      // Increment view count in background (don't wait for response)
      profileService.incrementProfileViews(resolvedAddress).catch(err => {
        console.error('Failed to track profile view:', err);
        // Silently fail - view tracking shouldn't break the UI
      });
    }
  }, [resolvedAddress, isOwnProfile, error]);

  const copyAddress = () => {
    if (resolvedAddress) {
      navigator.clipboard.writeText(resolvedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="py-12 px-4">
          <Card className="p-8 text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => setLocation('/')}>
              Go Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Get privacy settings
  const privacySettings = offChainData?.privacy_settings || {};
  const showBio = privacySettings.show_bio !== false;
  const showEmail = privacySettings.show_email === true;
  const showSocialLinks = privacySettings.show_social_links !== false;
  const showReputationScore = privacySettings.show_reputation_score !== false;
  const showCredentials = privacySettings.show_credentials !== false;
  const showWalletAddress = privacySettings.show_wallet_address !== false;
  // const showActivity = privacySettings.show_activity !== false; // Reserved for future use

  // Use display_name if available, fallback to username, then on-chain name
  // Show loading placeholder only if we're still loading and have no data
  const isLoadingData = !offChainData && !profileData;
  const displayName = offChainData?.display_name || offChainData?.username || profileData?.metadata?.name || (isLoadingData ? '' : 'Anonymous User');
  const displayBio = (showBio && offChainData?.bio) || profileData?.metadata?.bio || '';
  const avatarUrl = offChainData?.avatar || profileData?.metadata?.image;
  const bannerUrl = offChainData?.banner;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Banner - Simple like OpenSea */}
      <div className="relative h-80 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Content - OpenSea Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        {/* Avatar and Name Row */}
        <div className="flex items-center gap-3 py-4 min-w-0">
          {/* Avatar - 80x80 like OpenSea */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-background">
                <img
                  src={avatarUrl.startsWith('ipfs://') 
                    ? `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${avatarUrl.replace('ipfs://', '')}`
                    : avatarUrl
                  }
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Name and Actions */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isLoadingData ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-semibold truncate">{displayName || 'Anonymous User'}</h1>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isLoadingData ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <>
                    {offChainData?.username && (
                      <span className="text-sm text-muted-foreground">@{offChainData.username}</span>
                    )}
                    {showWalletAddress && resolvedAddress && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 rounded text-xs font-mono">
                        {formatAddress(resolvedAddress)}
                      </div>
                    )}
                    {offChainData?.profile_views !== undefined && offChainData.profile_views > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 rounded text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{offChainData.profile_views.toLocaleString()} views</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              {isOwnProfile && !profileData && (
                <Button
                  onClick={() => setShowActivateDialog(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Activate Profile
                </Button>
              )}
              {isOwnProfile && profileData && (
                <button
                  onClick={() => setLocation('/settings/profile')}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Activation Dialog */}
        <ActivateProfileDialog
          open={showActivateDialog}
          onOpenChange={setShowActivateDialog}
          onSuccess={() => {
            // Reload the page to show updated profile
            window.location.reload();
          }}
        />

        {/* Card Detail Modal */}
        <ReputationCardModal
          card={selectedCard}
          open={showCardModal}
          onOpenChange={setShowCardModal}
        />

        {/* Bio */}
        {isLoadingData ? (
          <div className="mt-4 max-w-lg space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          showBio && displayBio && (
            <div className="mt-4 max-w-lg">
              <p className="text-sm text-muted-foreground">{displayBio}</p>
            </div>
          )
        )}

        {/* Social Links - Simple like OpenSea */}
        {offChainData && (showEmail || showSocialLinks) && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              {showEmail && offChainData.email && (
                <a href={`mailto:${offChainData.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Mail className="w-4 h-4" />
                  {offChainData.email}
                </a>
              )}
              {showSocialLinks && offChainData.websiteUrl && (
                <a href={offChainData.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
              {showSocialLinks && offChainData.twitterHandle && (
                <a href={`https://twitter.com/${offChainData.twitterHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Twitter className="w-4 h-4" />
                  {offChainData.twitterHandle}
                </a>
              )}
              {showSocialLinks && offChainData.githubHandle && (
                <a href={`https://github.com/${offChainData.githubHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Github className="w-4 h-4" />
                  {offChainData.githubHandle}
                </a>
              )}
              {showSocialLinks && offChainData.linkedinUrl && (
                <a href={offChainData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {showSocialLinks && offChainData.discordHandle && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  {offChainData.discordHandle}
                </span>
              )}
              {showSocialLinks && offChainData.telegramHandle && (
                <a href={`https://t.me/${offChainData.telegramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Send className="w-4 h-4" />
                  {offChainData.telegramHandle}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {showReputationScore && (
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Reputation Score</span>
              </div>
              {isLoadingData ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-bold text-primary">
                  {profileData?.reputationScore || 0}
                </p>
              )}
            </Card>
          )}
          
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Reputation Cards</span>
            </div>
            {isLoadingData ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <p className="text-3xl font-bold text-purple-600">
                {reputationCards.length}
              </p>
            )}
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-pink-600" />
              <span className="text-sm font-medium text-muted-foreground">Member Since</span>
            </div>
            {isLoadingData ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-lg font-bold text-pink-600">
                {profileData?.createdAt ? formatDate(profileData.createdAt) : 'Recently'}
              </p>
            )}
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="cards">Reputation Cards</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            {!showCredentials && !isOwnProfile ? (
              <Card className="p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Credentials Hidden</h3>
                <p className="text-muted-foreground">
                  This user has chosen to hide their credentials
                </p>
              </Card>
            ) : reputationCards.length === 0 ? (
              <Card className="p-12 text-center">
                <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Reputation Cards</h3>
                <p className="text-muted-foreground">
                  This profile hasn't earned any reputation cards yet
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reputationCards.map((card, index) => (
                  <ReputationCardDisplay 
                    key={card.id || index} 
                    card={card}
                    onClick={() => {
                      setSelectedCard(card);
                      setShowCardModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Activity will appear here
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
