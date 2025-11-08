import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Navigation from '@/components/Navigation';
import StatCard from '@/components/StatCard';
import { Shield, Users, Award, Building2, UserPlus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { reputationCardService } from '@/services/reputationCardService';

export default function Admin() {
  const { toast } = useToast();
  const { userProfile } = useWallet();
  const [addIssuerOpen, setAddIssuerOpen] = useState(false);
  const [newIssuer, setNewIssuer] = useState({ name: '', address: '' });
  const [issuers, setIssuers] = useState<Array<{
    id: string;
    name: string;
    address: string;
    status: string;
    issued: number;
  }>>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load statistics
  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const total = await reputationCardService.totalCards();
        setTotalCards(total);
      } catch (error) {
        // Failed to load stats
      } finally{
        setIsLoading(false);
      }
    }

    if (userProfile?.isAdmin) {
      loadStats();
    }
  }, [userProfile]);

  const handleAddIssuer = async () => {
    if (!newIssuer.name || !newIssuer.address) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide both name and address',
        variant: 'destructive',
      });
      return;
    }

    if (!userProfile?.isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can authorize issuers',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await reputationCardService.authorizeIssuer(newIssuer.address);
      
      // Add to local state
      setIssuers([
        ...issuers,
        {
          id: String(issuers.length + 1),
          name: newIssuer.name,
          address: newIssuer.address,
          status: 'active',
          issued: 0,
        },
      ]);

      toast({
        title: 'Issuer Authorized',
        description: `${newIssuer.name} can now issue credentials`,
      });
      
      setNewIssuer({ name: '', address: '' });
      setAddIssuerOpen(false);
    } catch (error: any) {
      toast({
        title: 'Authorization Failed',
        description: error.message || 'Failed to authorize issuer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIssuer = async (id: string, address: string) => {
    if (!userProfile?.isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can revoke issuers',
        variant: 'destructive',
      });
      return;
    }

    try {
      await reputationCardService.revokeIssuer(address);
      
      const issuer = issuers.find(i => i.id === id);
      setIssuers(issuers.filter(i => i.id !== id));
      
      toast({
        title: 'Issuer Revoked',
        description: `${issuer?.name} can no longer issue credentials`,
      });
    } catch (error: any) {
      toast({
        title: 'Revocation Failed',
        description: error.message || 'Failed to revoke issuer',
        variant: 'destructive',
      });
    }
  };

  const auditLogs = [
    { id: '1', action: 'Issuer Added', user: 'Admin', details: 'MIT OpenCourseWare authorized', timestamp: '2024-01-15 14:30' },
    { id: '2', action: 'Credential Issued', user: 'MIT OpenCourseWare', details: 'Blockchain Certificate to 0x1234...', timestamp: '2024-01-15 13:15' },
    { id: '3', action: 'System Config', user: 'Admin', details: 'Updated reputation scoring parameters', timestamp: '2024-01-14 10:00' },
    { id: '4', action: 'Issuer Removed', user: 'Admin', details: 'Unauthorized issuer revoked', timestamp: '2024-01-13 16:45' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage issuers, monitor activity, and configure system settings
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Credentials" 
            value={isLoading ? "..." : totalCards.toString()} 
            icon={Award} 
          />
          <StatCard 
            title="Active Users" 
            value="--" 
            icon={Users} 
          />
          <StatCard 
            title="Authorized Issuers" 
            value={issuers.filter(i => i.status === 'active').length} 
            icon={Building2} 
          />
          <StatCard 
            title="Your Role" 
            value={userProfile?.isAdmin ? "Admin" : "User"} 
            icon={Shield} 
          />
        </div>

        <Tabs defaultValue="issuers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="issuers" data-testid="tab-issuers">Manage Issuers</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit Log</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="issuers">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Authorized Issuers</h2>
                <Button onClick={() => setAddIssuerOpen(true)} data-testid="button-add-issuer">
                  <UserPlus className="w-4 h-4" />
                  Add Issuer
                </Button>
              </div>

              <div className="space-y-3">
                {issuers.map((issuer) => (
                  <div
                    key={issuer.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`issuer-row-${issuer.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{issuer.name}</h3>
                        {issuer.status === 'active' ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{issuer.address}</span>
                        <span>{issuer.issued} credentials issued</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveIssuer(issuer.id, issuer.address)}
                      data-testid={`button-remove-issuer-${issuer.id}`}
                      disabled={!userProfile?.isAdmin}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">System Audit Log</h2>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-4 rounded-lg border"
                    data-testid={`audit-log-${log.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{log.action}</h3>
                        <Badge variant="secondary">{log.user}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">System Configuration</h2>
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input defaultValue="TrustFi" data-testid="input-platform-name" />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Reputation Score</Label>
                  <Input type="number" defaultValue="0" data-testid="input-min-reputation" />
                  <p className="text-xs text-muted-foreground">
                    Minimum score required for certain features
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Credential Verification Period (days)</Label>
                  <Input type="number" defaultValue="30" data-testid="input-verification-period" />
                  <p className="text-xs text-muted-foreground">
                    How long credentials remain valid before re-verification
                  </p>
                </div>
                <Button data-testid="button-save-settings">Save Changes</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={addIssuerOpen} onOpenChange={setAddIssuerOpen}>
        <DialogContent data-testid="dialog-add-issuer">
          <DialogHeader>
            <DialogTitle>Add New Issuer</DialogTitle>
            <DialogDescription>
              Authorize a new organization to issue credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="issuerName">Organization Name</Label>
              <Input
                id="issuerName"
                placeholder="e.g., MIT OpenCourseWare"
                value={newIssuer.name}
                onChange={(e) => setNewIssuer({ ...newIssuer, name: e.target.value })}
                data-testid="input-issuer-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuerAddress">Wallet Address</Label>
              <Input
                id="issuerAddress"
                placeholder="0x..."
                className="font-mono text-sm"
                value={newIssuer.address}
                onChange={(e) => setNewIssuer({ ...newIssuer, address: e.target.value })}
                data-testid="input-issuer-address"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAddIssuer} 
                className="flex-1" 
                disabled={isSubmitting || !userProfile?.isAdmin}
                data-testid="button-confirm-add-issuer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Issuer'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setAddIssuerOpen(false)} 
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
