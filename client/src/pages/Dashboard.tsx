import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import CredentialCard, { type CredentialCardData } from '@/components/CredentialCard';
import TrendingProfiles from '@/components/TrendingProfiles';
import ActivateProfileDialog from '@/components/ActivateProfileDialog';
import { 
  Shield, 
  Search, 
  Filter, 
  Share2, 
  User, 
  Plus, 
  Loader2,
  Award,
  Eye,
  TrendingUp,
  Settings,
  Zap,
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  Sparkles,
  Bell,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWallet } from '@/contexts/WalletContext';
import { useOffChainProfile } from '@/hooks/queries/useProfileQuery';
import { useProfileCards, useReputationScore } from '@/hooks/queries/useOnChainProfile';
import { collectibleContractService } from '@/services/collectibleContractService';
import { MintingMode, RarityTier } from '@/types/collectible';
import { useCollectibles } from '@/hooks/useCollectibles';
import { useClaimStatus } from '@/hooks/useClaimStatus';
import ClaimHistory from '@/components/ClaimHistory';
import { claimHistoryService, type ClaimHistoryStats } from '@/services/claimHistoryService';

export default function Dashboard() {
  const { userProfile, provider, address, isLoadingProfile } = useWallet();
  
  // React Query hooks
  const { data: offChainData, isLoading: isLoadingOffChain } = useOffChainProfile(address);
  const tokenId = userProfile?.hasProfile ? Number(userProfile.tokenId) : undefined;
  const { data: cards = [] } = useProfileCards(tokenId, provider);
  const { data: reputationScore = 0 } = useReputationScore(tokenId, provider);
  
  const [selectedCredential, setSelectedCredential] = useState<CredentialCardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [mintingModeFilter, setMintingModeFilter] = useState('all');
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [cardMintingModes, setCardMintingModes] = useState<Map<string, MintingMode>>(new Map());
  const [claimStats, setClaimStats] = useState<ClaimHistoryStats | null>(null);

  // Collectibles data
  const { collectibles } = useCollectibles({ autoFetch: true });
  const collectibleTemplateIds = collectibles.map(c => c.templateId);
  const { claimStatus } = useClaimStatus(collectibleTemplateIds, address || undefined);

  // Fetch minting modes for all cards
  useEffect(() => {
    async function fetchMintingModes() {
      if (!provider || cards.length === 0) return;

      try {
        if (!collectibleContractService.isInitialized()) {
          await collectibleContractService.initialize(provider);
        }

        const modes = new Map<string, MintingMode>();
        await Promise.all(
          cards.map(async (card: any) => {
            try {
              const mode = await collectibleContractService.getCardMintingMode(card.id);
              modes.set(card.id.toString(), mode as MintingMode);
            } catch (error) {
              console.warn(`Failed to fetch minting mode for card ${card.id}:`, error);
              // Default to DIRECT mode
              modes.set(card.id.toString(), MintingMode.DIRECT);
            }
          })
        );

        setCardMintingModes(modes);
      } catch (error) {
        console.error('Failed to fetch minting modes:', error);
      }
    }

    fetchMintingModes();
  }, [cards, provider]);

  // Initialize claim history service and load statistics
  useEffect(() => {
    async function initializeClaimHistory() {
      if (!address || !provider) return;

      try {
        // Initialize the service
        await claimHistoryService.initialize();

        // Sync claim history from blockchain
        await claimHistoryService.syncClaimHistory(provider, address);

        // Start listening for new claims
        await claimHistoryService.startListening(provider, address);

        // Load statistics
        const stats = await claimHistoryService.getUserClaimStats(address);
        setClaimStats(stats);
      } catch (error) {
        console.error('Failed to initialize claim history:', error);
      }
    }

    initializeClaimHistory();

    // Cleanup: stop listening when component unmounts
    return () => {
      claimHistoryService.stopListening();
    };
  }, [address, provider]);

  // Convert cards to credential format
  const credentials: CredentialCardData[] = cards.map((card: any) => ({
    id: card.id.toString(),
    title: card.description || 'Untitled Credential',
    issuer: card.issuer.substring(0, 10) + '...',
    issuerAddress: card.issuer,
    description: card.description || 'No description',
    issuedDate: new Date(card.issuedAt * 1000).toISOString().split('T')[0],
    category: card.category || 'general',
    verified: card.isValid,
    mintingMode: cardMintingModes.get(card.id.toString()),
  }));

  const verifiedCount = credentials.filter(c => c.verified).length;
  const profileViews = offChainData?.profile_views || 0;

  // Calculate eligible collectibles count (after credentials are defined)
  const eligibleCollectiblesCount = Array.from(claimStatus.values()).filter(
    status => status.isEligible && !status.hasClaimed && status.canClaimNow
  ).length;

  // Create activity events from credentials
  const events = credentials.slice(0, 5).map((cred, idx) => ({
    id: `event-${idx}`,
    type: cred.mintingMode === MintingMode.COLLECTIBLE ? 'collectible' as const : 'credential' as const,
    title: cred.mintingMode === MintingMode.COLLECTIBLE ? 'Collectible Claimed' : 'Credential Received',
    description: cred.title,
    timestamp: cred.issuedDate,
    mintingMode: cred.mintingMode,
  }));

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cred.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || cred.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesMintingMode = mintingModeFilter === 'all' || 
      (mintingModeFilter === 'direct' && cred.mintingMode === MintingMode.DIRECT) ||
      (mintingModeFilter === 'collectible' && cred.mintingMode === MintingMode.COLLECTIBLE);
    return matchesSearch && matchesCategory && matchesMintingMode;
  });

  // Show loading state while profile is being loaded
  const isLoading = isLoadingProfile || isLoadingOffChain || !address;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // User has off-chain profile but no on-chain profile yet - show welcome dashboard
  const hasOffChainProfile = !!offChainData;
  const hasOnChainProfile = userProfile?.hasProfile;
  const displayName = offChainData?.display_name || offChainData?.username || 'there';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your reputation
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${offChainData?.username || address}`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Button size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/${offChainData?.username || address}`);
            }}>
              <Copy className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reputationScore}</div>
              <p className="text-xs text-muted-foreground">
                {hasOnChainProfile ? '+12% from last month' : 'Activate to start earning'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credentials</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credentials.length}</div>
              <p className="text-xs text-muted-foreground">
                {verifiedCount} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileViews}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasOnChainProfile ? (
                  <Badge variant="default" className="text-sm">Active</Badge>
                ) : offChainData?.activation_status === 'pending' ? (
                  <Badge variant="outline" className="text-sm border-yellow-500 text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1" />
                    Pending
                  </Badge>
                ) : offChainData?.activation_status === 'failed' ? (
                  <Badge variant="destructive" className="text-sm">Failed</Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm">Off-Chain</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasOnChainProfile 
                  ? 'On-chain verified' 
                  : offChainData?.activation_status === 'pending'
                  ? 'Activating on blockchain...'
                  : offChainData?.activation_status === 'failed'
                  ? 'Activation failed - try again'
                  : 'Free profile'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Banner for New Users */}
        {hasOffChainProfile && !hasOnChainProfile && (
          <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Activate Your On-Chain Profile
              </CardTitle>
              <CardDescription>
                Unlock the full power of TrustFi by activating your on-chain profile. Earn verifiable credentials and build your reputation on the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Button variant="default" onClick={() => setShowActivateDialog(true)}>
                <Zap className="w-4 h-4 mr-2" />
                Activate Now
              </Button>
              <Link href="/settings/profile">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize Profile First
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Collectibles Notification Banner */}
        {hasOnChainProfile && eligibleCollectiblesCount > 0 && (
          <Card className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-background relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent animate-pulse" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <span>New Collectibles Available!</span>
                <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-700 dark:text-purple-400 animate-bounce">
                  {eligibleCollectiblesCount} eligible
                </Badge>
              </CardTitle>
              <CardDescription className="text-base">
                You're eligible to claim {eligibleCollectiblesCount} new collectible{eligibleCollectiblesCount !== 1 ? 's' : ''}. Don't miss out on these limited opportunities!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 relative">
              <Link href="/collectibles">
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Collectibles
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Refresh notifications
                  window.location.reload();
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Refresh Notifications
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  Finish setting up your profile to maximize your reputation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Profile Completion</span>
                    <span className="text-muted-foreground">
                      {(() => {
                        let completed = 0;
                        if (offChainData?.username && offChainData.username !== `user${address?.slice(2, 10)}`) completed += 20;
                        if (offChainData?.display_name && offChainData.display_name !== 'Unnamed') completed += 20;
                        if (offChainData?.bio) completed += 20;
                        if (offChainData?.avatar_url) completed += 20;
                        if (hasOnChainProfile) completed += 20;
                        return completed;
                      })()}%
                    </span>
                  </div>
                  <Progress value={(() => {
                    let completed = 0;
                    if (offChainData?.username && offChainData.username !== `user${address?.slice(2, 10)}`) completed += 20;
                    if (offChainData?.display_name && offChainData.display_name !== 'Unnamed') completed += 20;
                    if (offChainData?.bio) completed += 20;
                    if (offChainData?.avatar_url) completed += 20;
                    if (hasOnChainProfile) completed += 20;
                    return completed;
                  })()} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {offChainData?.username && offChainData.username !== `user${address?.slice(2, 10)}` ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Set a custom username</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {offChainData?.display_name && offChainData.display_name !== 'Unnamed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Add your display name</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {offChainData?.bio ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Write a bio</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {offChainData?.avatar_url ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Upload an avatar</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasOnChainProfile ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Activate on-chain profile</span>
                  </div>
                </div>

                <Link href="/settings/profile">
                  <Button className="w-full" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest credentials and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className={`p-2 rounded-lg ${
                          event.type === 'collectible' 
                            ? 'bg-purple-500/10' 
                            : 'bg-primary/10'
                        }`}>
                          {event.type === 'collectible' ? (
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          ) : (
                            <Award className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{event.title}</p>
                            {event.type === 'collectible' && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-400">
                                Collectible
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start earning credentials to see your activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Notifications Summary */}
            {hasOnChainProfile && eligibleCollectiblesCount > 0 && (
              <Card className="border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    You have new opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/20">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New Collectibles</p>
                        <p className="text-xs text-muted-foreground">
                          {eligibleCollectiblesCount} available to claim
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500 hover:bg-purple-600">
                      {eligibleCollectiblesCount}
                    </Badge>
                  </div>
                  <Link href="/collectibles">
                    <Button variant="outline" className="w-full" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/settings/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href={`/${offChainData?.username || address}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Public Profile
                  </Button>
                </Link>
                <Link href="/collectibles">
                  <Button variant="outline" className="w-full justify-start relative">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Browse Collectibles
                    {eligibleCollectiblesCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-auto bg-purple-500/20 text-purple-700 dark:text-purple-400"
                      >
                        {eligibleCollectiblesCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Discover Profiles
                  </Button>
                </Link>
                {!hasOnChainProfile && (
                  <Button className="w-full justify-start" onClick={() => setShowActivateDialog(true)}>
                    <Zap className="w-4 h-4 mr-2" />
                    Activate Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Trending Profiles */}
            <Card>
              <CardHeader>
                <CardTitle>Trending Profiles</CardTitle>
                <CardDescription>Most viewed this week</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendingProfiles limit={5} showTitle={false} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credentials Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>My Credentials</CardTitle>
                <CardDescription>
                  {filteredCredentials.length} credential{filteredCredentials.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <Button data-testid="button-claim-credential" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Claim Credential
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-credentials"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mintingModeFilter} onValueChange={setMintingModeFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-minting-mode-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="direct">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Awarded
                    </div>
                  </SelectItem>
                  <SelectItem value="collectible">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Claimed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {credentials.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {hasOnChainProfile 
                    ? "Start earning credentials from authorized issuers to build your reputation"
                    : "Activate your on-chain profile to start earning verifiable credentials"
                  }
                </p>
                {!hasOnChainProfile && (
                  <Button onClick={() => setShowActivateDialog(true)}>
                    <Zap className="w-4 h-4 mr-2" />
                    Activate Profile
                  </Button>
                )}
              </div>
            ) : filteredCredentials.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No credentials found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filter</p>
                <Button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setMintingModeFilter('all'); }} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCredentials.map((credential) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    onClick={() => setSelectedCredential(credential)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim History Section */}
        {hasOnChainProfile && (
          <div className="space-y-6">
            {/* Claim Statistics */}
            {claimStats && claimStats.totalClaims > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{claimStats.totalClaims}</div>
                    <p className="text-xs text-muted-foreground">
                      Collectibles claimed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.keys(claimStats.byCategory).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Different categories
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rarest Claim</CardTitle>
                    <Sparkles className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const rarities = Object.keys(claimStats.byRarity).map(Number);
                        if (rarities.length === 0) return 'None';
                        const highest = Math.max(...rarities);
                        const rarityNames: Record<number, string> = {
                          [RarityTier.COMMON]: 'Common',
                          [RarityTier.UNCOMMON]: 'Uncommon',
                          [RarityTier.RARE]: 'Rare',
                          [RarityTier.EPIC]: 'Epic',
                          [RarityTier.LEGENDARY]: 'Legendary',
                        };
                        return rarityNames[highest] || 'Unknown';
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Highest rarity tier
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Latest Claim</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {claimStats.latestClaim
                        ? new Date(claimStats.latestClaim.timestamp * 1000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Most recent claim
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Claim History Timeline */}
            <ClaimHistory userAddress={address} limit={10} showFilters={true} showTitle={true} />
          </div>
        )}
      </main>

      <Dialog open={!!selectedCredential} onOpenChange={() => setSelectedCredential(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-credential-details">
          {selectedCredential && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedCredential.title}</DialogTitle>
                <DialogDescription>Credential Details</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedCredential.description}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Issuer</h4>
                    <p className="text-muted-foreground">{selectedCredential.issuer}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Issued Date</h4>
                    <p className="text-muted-foreground">
                      {new Date(selectedCredential.issuedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <p className="text-muted-foreground">{selectedCredential.category}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      {selectedCredential.verified ? (
                        <>
                          <Shield className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">Verified</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Pending Verification</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Issuer Address (On-Chain)</h4>
                  <code className="text-xs font-mono bg-muted px-3 py-2 rounded-md block break-all">
                    {selectedCredential.issuerAddress}
                  </code>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1" data-testid="button-share-credential">
                    <Share2 className="w-4 h-4" />
                    Share Credential
                  </Button>
                  <Button variant="outline" className="flex-1" data-testid="button-verify-onchain">
                    <Shield className="w-4 h-4" />
                    Verify On-Chain
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Activation Dialog */}
      <ActivateProfileDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
        onSuccess={() => {
          setShowActivateDialog(false);
          // Profile will be refreshed automatically by React Query
        }}
      />
    </div>
  );
}
