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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Navigation from '@/components/Navigation';
import StatCard from '@/components/StatCard';
import { Shield, Users, Award, Building2, UserPlus, Trash2, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { reputationCardService } from '@/services/reputationCardService';
import { useContractData } from '@/hooks/useContractData';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { CardLoadingSkeleton } from '@/components/skeletons/CardLoadingSkeleton';
import { TransactionStatus, type TransactionStatusType } from '@/components/shared/TransactionStatus';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function Admin() {
  const { toast } = useToast();
  const { userProfile, isLoadingProfile } = useWallet();
  const [addIssuerOpen, setAddIssuerOpen] = useState(false);
  const [newIssuer, setNewIssuer] = useState({ name: '', address: '' });
  const [issuers, setIssuers] = useState<Array<{
    id: string;
    name: string;
    address: string;
    status: string;
    issued: number;
  }>>([]);
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');
  const [txMessage, setTxMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [revokeIssuerDialog, setRevokeIssuerDialog] = useState<{ open: boolean; issuer: { id: string; name: string; address: string } | null }>({
    open: false,
    issuer: null
  });

  // Show loading skeleton while checking admin status
  if (isLoadingProfile) {
    return <PageLoadingSkeleton variant="admin" />;
  }

  // Access control check - show access denied if not admin
  // Note: ProtectedRoute already handles this, but we add an extra check for safety
  if (userProfile && !userProfile.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center max-w-md mx-auto">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">
              You need administrator privileges to access this page.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Fetch system statistics using useContractData hook
  const {
    data: totalCards,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useContractData(
    async () => {
      return await reputationCardService.totalCards();
    },
    [userProfile?.isAdmin],
    {
      enabled: !!userProfile?.isAdmin,
      onError: (error) => {
        console.error('Failed to load system statistics:', error);
      }
    }
  );

  // Note: The smart contract doesn't expose a method to fetch all authorized issuers
  // This would need to be implemented either:
  // 1. By adding a contract method to return all issuers
  // 2. By indexing IssuerAuthorized events off-chain
  // 3. By maintaining an off-chain database
  // For now, we'll use local state management with manual additions
  const [isLoadingIssuers, setIsLoadingIssuers] = useState(false);
  const [issuersError, setIssuersError] = useState<string | null>(null);

  const refetchIssuers = async () => {
    // Placeholder for future implementation when contract supports it
    setIsLoadingIssuers(true);
    setIssuersError(null);
    try {
      // TODO: Implement when contract method is available
      // const issuersList = await reputationCardService.getAllAuthorizedIssuers();
      // setIssuers(issuersList);
      setIsLoadingIssuers(false);
    } catch (error: any) {
      setIssuersError(error.message);
      setIsLoadingIssuers(false);
    }
  };

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
      // Show transaction status
      setTxStatus('pending');
      setTxMessage('Please confirm the transaction in your wallet');
      
      const tx = await reputationCardService.authorizeIssuer(newIssuer.address);
      
      // Transaction submitted
      setTxStatus('confirming');
      setTxMessage('Authorizing issuer...');
      
      // Wait for confirmation (the service already waits for tx.wait())
      
      // Add to local state immediately
      const newIssuerData = {
        id: String(Date.now()),
        name: newIssuer.name,
        address: newIssuer.address,
        status: 'active',
        issued: 0,
      };
      
      setIssuers([...issuers, newIssuerData]);
      
      // Show success
      setTxStatus('success');
      setTxMessage(`${newIssuer.name} has been authorized`);
      
      toast({
        title: 'Issuer Authorized',
        description: `${newIssuer.name} (${newIssuer.address.slice(0, 6)}...${newIssuer.address.slice(-4)}) can now issue credentials`,
      });
      
      // Reset form
      setNewIssuer({ name: '', address: '' });
      
      // Close dialog after a short delay
      setTimeout(() => {
        setAddIssuerOpen(false);
        setTxStatus('idle');
      }, 1500);
      
    } catch (error: any) {
      setTxStatus('error');
      
      // Handle specific error cases
      if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        setTxMessage('Transaction was cancelled');
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the authorization',
          variant: 'destructive',
        });
      } else {
        setTxMessage(error.userMessage || error.message || 'Failed to authorize issuer');
        toast({
          title: 'Authorization Failed',
          description: error.userMessage || error.message || 'Failed to authorize issuer',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveIssuer = async () => {
    const issuer = revokeIssuerDialog.issuer;
    if (!issuer) return;

    if (!userProfile?.isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only admins can revoke issuers',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Close confirmation dialog
      setRevokeIssuerDialog({ open: false, issuer: null });
      
      // Show transaction status
      setTxStatus('pending');
      setTxMessage('Please confirm the transaction in your wallet');
      
      await reputationCardService.revokeIssuer(issuer.address);
      
      // Transaction submitted
      setTxStatus('confirming');
      setTxMessage('Revoking issuer authorization...');
      
      // Remove from local state immediately
      setIssuers(issuers.filter(i => i.id !== issuer.id));
      
      // Show success
      setTxStatus('success');
      setTxMessage(`${issuer.name} has been revoked`);
      
      toast({
        title: 'Issuer Revoked',
        description: `${issuer.name} (${issuer.address.slice(0, 6)}...${issuer.address.slice(-4)}) can no longer issue credentials`,
      });
      
      // Reset status after delay
      setTimeout(() => {
        setTxStatus('idle');
      }, 2000);
      
    } catch (error: any) {
      setTxStatus('error');
      
      // Handle specific error cases
      if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        setTxMessage('Transaction was cancelled');
        toast({
          title: 'Transaction Cancelled',
          description: 'You cancelled the revocation',
          variant: 'destructive',
        });
      } else {
        setTxMessage(error.userMessage || error.message || 'Failed to revoke issuer');
        toast({
          title: 'Revocation Failed',
          description: error.userMessage || error.message || 'Failed to revoke issuer',
          variant: 'destructive',
        });
      }
      
      // Reset status after delay
      setTimeout(() => {
        setTxStatus('idle');
      }, 3000);
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
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </>
          ) : statsError ? (
            <Card className="col-span-full p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-semibold">Failed to load statistics</p>
                    <p className="text-sm text-muted-foreground">{statsError.userMessage}</p>
                  </div>
                </div>
                <Button onClick={refetchStats} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <StatCard 
                title="Total Credentials" 
                value={totalCards?.toString() || "0"} 
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
            </>
          )}
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
                <div>
                  <h2 className="text-xl font-semibold">Authorized Issuers</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {issuers.length} issuer{issuers.length !== 1 ? 's' : ''} authorized
                  </p>
                </div>
                <Button onClick={() => setAddIssuerOpen(true)} data-testid="button-add-issuer">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Issuer
                </Button>
              </div>

              {isLoadingIssuers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-muted rounded w-1/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="h-8 w-8 bg-muted rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : issuersError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load issuers</h3>
                  <p className="text-sm text-muted-foreground mb-4">{issuersError}</p>
                  <Button onClick={refetchIssuers} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : issuers.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Issuers Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first authorized issuer to start issuing credentials
                  </p>
                  <Button onClick={() => setAddIssuerOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Issuer
                  </Button>
                </div>
              ) : (
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
                        onClick={() => setRevokeIssuerDialog({ open: true, issuer })}
                        data-testid={`button-remove-issuer-${issuer.id}`}
                        disabled={!userProfile?.isAdmin}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                disabled={txStatus === 'pending' || txStatus === 'confirming'}
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
                disabled={txStatus === 'pending' || txStatus === 'confirming'}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAddIssuer} 
                className="flex-1" 
                disabled={txStatus === 'pending' || txStatus === 'confirming' || !userProfile?.isAdmin}
                data-testid="button-confirm-add-issuer"
              >
                {txStatus === 'pending' || txStatus === 'confirming' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {txStatus === 'pending' ? 'Confirm in Wallet...' : 'Authorizing...'}
                  </>
                ) : (
                  'Add Issuer'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddIssuerOpen(false);
                  setTxStatus('idle');
                }} 
                className="flex-1"
                disabled={txStatus === 'pending' || txStatus === 'confirming'}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for issuer revocation */}
      <AlertDialog open={revokeIssuerDialog.open} onOpenChange={(open) => setRevokeIssuerDialog({ open, issuer: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Issuer Authorization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke authorization for{' '}
              <span className="font-semibold">{revokeIssuerDialog.issuer?.name}</span>?
              <br />
              <span className="font-mono text-xs">
                {revokeIssuerDialog.issuer?.address}
              </span>
              <br />
              <br />
              This issuer will no longer be able to issue new credentials. Existing credentials will remain valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveIssuer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Authorization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction status modal */}
      <TransactionStatus
        status={txStatus}
        message={txMessage}
        txHash={txHash}
        onClose={() => setTxStatus('idle')}
        open={txStatus !== 'idle'}
        title={txStatus === 'success' ? 'Success' : 'Processing Transaction'}
      />
    </div>
  );
}
