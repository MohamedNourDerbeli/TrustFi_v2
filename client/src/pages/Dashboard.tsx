import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import ReputationScore from '@/components/ReputationScore';
import CredentialCard, { type CredentialCardData } from '@/components/CredentialCard';
import ActivityTimeline from '@/components/ActivityTimeline';
import { Shield, Search, Filter, Share2, User, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWallet } from '@/contexts/WalletContext';
import { reputationCardService } from '@/services/reputationCardService';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { userProfile, provider } = useWallet();
  const { toast } = useToast();
  
  const [selectedCredential, setSelectedCredential] = useState<CredentialCardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [credentials, setCredentials] = useState<CredentialCardData[]>([]);
  const [reputationScore, setReputationScore] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Array<{
    id: string;
    type: 'credential' | 'achievement';
    title: string;
    description: string;
    timestamp: string;
  }>>([]);

  // Load credentials and reputation data
  useEffect(() => {
    async function loadData() {
      if (!userProfile?.hasProfile || !userProfile.tokenId || !provider) {
        return;
      }

      try {
        // Only show loading if we don't have data yet
        if (credentials.length === 0) {
          setIsLoading(true);
        }
        const tokenId = Number(userProfile.tokenId);

        // Load credentials
        const cards = await reputationCardService.getProfileCards(tokenId);
        
        // Convert to CredentialCardData format
        const credentialData: CredentialCardData[] = cards.map((card, index) => ({
          id: index.toString(),
          title: card.description.substring(0, 50), // Use first part of description as title
          issuer: card.issuer.substring(0, 10) + '...', // Truncate issuer address
          issuerAddress: card.issuer,
          description: card.description,
          issuedDate: new Date(card.issuedAt * 1000).toISOString().split('T')[0],
          category: card.category,
          verified: card.isValid,
        }));
        
        setCredentials(credentialData);
        setVerifiedCount(credentialData.filter(c => c.verified).length);

        // Load reputation score
        const score = await reputationCardService.calculateReputationScore(tokenId);
        setReputationScore(score);

        // Create activity events from credentials
        const recentEvents = credentialData.slice(0, 3).map((cred, idx) => ({
          id: `event-${idx}`,
          type: 'credential' as const,
          title: 'Credential Received',
          description: cred.title,
          timestamp: cred.issuedDate,
        }));
        setEvents(recentEvents);

      } catch (error: any) {
        toast({
          title: 'Error Loading Data',
          description: error.message || 'Failed to load credentials',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userProfile, provider, toast]);

  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cred.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || cred.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Don't render anything until we have profile data or confirmed no profile
  if (!userProfile) {
    return null;
  }

  // Show message if no profile
  if (!userProfile.hasProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-6">
              Create your TrustFi profile to start building your reputation
            </p>
            <Link href="/create-profile">
              <Button>Create Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <ReputationScore
              score={reputationScore}
              totalCredentials={credentials.length}
              verifiedAchievements={verifiedCount}
            />
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" data-testid="button-share-profile">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Link href="/profile" className="flex-1">
                <Button variant="outline" className="w-full" data-testid="button-view-profile">
                  <User className="w-4 h-4" />
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ActivityTimeline events={events} />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">My Credentials</h2>
              <p className="text-sm text-muted-foreground">
                {filteredCredentials.length} credential{filteredCredentials.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Button data-testid="button-claim-credential">
              <Plus className="w-4 h-4" />
              Claim Credential
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

          {filteredCredentials.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No credentials found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filter</p>
              <Button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>
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
        </div>
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
    </div>
  );
}
