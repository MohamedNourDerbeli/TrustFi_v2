import { useState } from 'react';
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
  Copy
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
  const [showActivateDialog, setShowActivateDialog] = useState(false);

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
  }));

  const verifiedCount = credentials.filter(c => c.verified).length;
  const profileViews = offChainData?.profile_views || 0;

  // Create activity events from credentials
  const events = credentials.slice(0, 3).map((cred, idx) => ({
    id: `event-${idx}`,
    type: 'credential' as const,
    title: 'Credential Received',
    description: cred.title,
    timestamp: cred.issuedDate,
  }));

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cred.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || cred.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
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
                        if (offChainData?.username && offChainData.username !== `user-${address?.slice(2, 8)}`) completed += 20;
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
                    if (offChainData?.username && offChainData.username !== `user-${address?.slice(2, 8)}`) completed += 20;
                    if (offChainData?.display_name && offChainData.display_name !== 'Unnamed') completed += 20;
                    if (offChainData?.bio) completed += 20;
                    if (offChainData?.avatar_url) completed += 20;
                    if (hasOnChainProfile) completed += 20;
                    return completed;
                  })()} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {offChainData?.username && offChainData.username !== `user-${address?.slice(2, 8)}` ? (
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
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Award className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{event.title}</p>
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
                <Button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }} variant="outline">
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
