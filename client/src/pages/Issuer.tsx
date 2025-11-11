import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import { Shield, Send, Clock, CheckCircle2, Loader2, Upload, X, FileText, Image as ImageIcon, Award, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import { reputationCardService } from '@/services/reputationCardService';
import { reputationCardMetadataService } from '@/services/reputationCardMetadataService';
import { CollectibleCreationForm } from '@/components/issuer/CollectibleCreationForm';
import { CollectibleManagementPanel } from '@/components/issuer/CollectibleManagementPanel';
import { WhitelistManager } from '@/components/issuer/WhitelistManager';
import { CollectibleAnalyticsModal } from '@/components/issuer/CollectibleAnalyticsModal';
import { CollectiblePreviewModal } from '@/components/issuer/CollectiblePreviewModal';
import { useIssuerCollectibles } from '@/hooks/useIssuerCollectibles';
import { useContractData } from '@/hooks/useContractData';
import { CardLoadingSkeleton } from '@/components/skeletons/CardLoadingSkeleton';
import { TransactionStatus, type TransactionStatusType } from '@/components/shared/TransactionStatus';
import type { CollectibleFormData, CollectibleTemplate } from '@/types/collectible';
import { useLazyLoad } from '@/hooks/useLazyLoad';

export default function Issuer() {
  const { toast } = useToast();
  const { userProfile, address } = useWallet();
  const [formData, setFormData] = useState({
    recipientAddress: '',
    title: '',
    description: '',
    category: 'education',
    value: '100',
    issuerName: '',
    externalUrl: '',
  });
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgePreview, setBadgePreview] = useState<string>('');
  const [proofDocument, setProofDocument] = useState<File | null>(null);
  const [proofDocumentName, setProofDocumentName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // Transaction status state
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [txError, setTxError] = useState<string>('');
  const [issuedCredentialId, setIssuedCredentialId] = useState<string>('');

  // Fetch issued credentials using useContractData hook
  const {
    data: issuedCredentials,
    loading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useContractData(
    async () => {
      if (!address) return [];

      // Get all card IDs issued by this address
      const cardIds = await reputationCardService.getAllCardsIssuedBy(address);
      
      // Format for display
      const formattedCards = await Promise.all(
        cardIds.map(async (cardId) => {
          try {
            // Get the full card details
            const card = await reputationCardService.getCard(cardId);
            
            // Get recipient address by getting the owner of the profile NFT
            const recipientAddress = await contractService.getProfileOwner(card.profileId);
            
            // Fetch metadata from IPFS
            let metadata: any = {};
            try {
              if (card.metadataURI) {
                const metadataResponse = await fetch(
                  card.metadataURI.startsWith('ipfs://') 
                    ? `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${card.metadataURI.replace('ipfs://', '')}`
                    : card.metadataURI
                );
                metadata = await metadataResponse.json();
              }
            } catch (metadataError) {
              console.error('Failed to fetch metadata:', metadataError);
            }
            
            return {
              id: cardId.toString(),
              recipient: recipientAddress,
              title: metadata.title || 'Untitled Credential',
              date: new Date(card.issuedAt * 1000).toISOString(),
              status: card.isValid ? 'verified' : 'revoked',
              category: metadata.category || 'unknown',
              value: card.value,
            };
          } catch (error) {
            console.error(`Failed to process card ${cardId}:`, error);
            return null;
          }
        })
      );
      
      // Filter out null values and sort by date (newest first)
      const validCards = formattedCards.filter(card => card !== null);
      validCards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return validCards;
    },
    [address],
    {
      enabled: !!address && !!userProfile?.isIssuer,
      requiresAuth: true,
      onError: (error) => {
        console.error('Failed to load issued credentials:', error);
        toast({
          title: 'Failed to Load History',
          description: error.userMessage || 'Could not load issued credentials',
          variant: 'destructive',
        });
      },
    }
  );

  // Collectibles management with useContractData wrapper
  const {
    collectibles,
    createCollectible,
    pauseCollectible,
    resumeCollectible,
    addToWhitelist,
    removeFromWhitelist,
    loading: collectiblesLoading,
    error: collectiblesError,
    refetch: refetchCollectibles,
  } = useIssuerCollectibles();

  // Whitelist manager state
  const [whitelistManagerOpen, setWhitelistManagerOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Analytics modal state
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedCollectibleForAnalytics, setSelectedCollectibleForAnalytics] = useState<CollectibleTemplate | null>(null);
  
  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCollectibleForPreview, setSelectedCollectibleForPreview] = useState<CollectibleTemplate | null>(null);

  // Lazy loading for issued credentials history
  const {
    visibleItems: visibleCredentials,
    hasMore: hasMoreCredentials,
    isLoadingMore: isLoadingMoreCredentials,
    loadMore: loadMoreCredentials,
    containerRef: credentialsContainerRef,
  } = useLazyLoad(issuedCredentials || [], {
    initialCount: 10,
    pageSize: 10,
    autoLoad: true,
    threshold: 200,
  });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleBadgeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setBadgeImage(file);
    const reader = new FileReader();
    reader.onload = () => setBadgePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProofDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File',
        description: 'Please select a PDF or image file',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Document must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setProofDocument(file);
    setProofDocumentName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.isIssuer) {
      toast({
        title: 'Unauthorized',
        description: 'You are not authorized to issue credentials',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setTxStatus('idle');
      setTxError('');
      setTxHash('');
      setUploadProgress('Verifying recipient...');

      // Get recipient's profile
      const recipientProfile = await contractService.getProfileByOwner(formData.recipientAddress);
      
      if (!recipientProfile || !recipientProfile.tokenId) {
        toast({
          title: 'Profile Not Found',
          description: 'Recipient does not have a TrustFi profile',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Upload badge image if provided
      let badgeImageURI: string | undefined;
      if (badgeImage) {
        setUploadProgress('Uploading badge image...');
        badgeImageURI = await reputationCardMetadataService.uploadImage(badgeImage);
      }

      // Upload proof document if provided
      let proofDocumentURI: string | undefined;
      if (proofDocument) {
        setUploadProgress('Uploading proof document...');
        proofDocumentURI = await reputationCardMetadataService.uploadDocument(proofDocument);
      }

      // Create metadata
      setUploadProgress('Creating metadata...');
      const metadata = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        image: badgeImageURI,
        proofDocument: proofDocumentURI,
        issuerName: formData.issuerName || undefined,
        externalUrl: formData.externalUrl || undefined,
        // Note: Reputation Value, Issued At, and Issuer are shown in Details section
        // Only add custom attributes here if needed
        attributes: [],
      };

      // Upload metadata to IPFS
      const metadataURI = await reputationCardMetadataService.uploadMetadata(metadata);

      // Issue credential with metadata
      setUploadProgress('Waiting for wallet confirmation...');
      setTxStatus('pending');

      const cardId = await reputationCardService.issueCard(
        Number(recipientProfile.tokenId),
        formData.category,
        Number(formData.value),
        metadataURI
      );

      // Transaction confirmed
      setTxStatus('confirming');
      setUploadProgress('Transaction confirmed, processing...');
      
      // Simulate brief delay for confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTxStatus('success');
      setIssuedCredentialId(cardId.toString());
      
      toast({
        title: 'Credential Issued!',
        description: `Successfully issued credential #${cardId} to ${formatAddress(formData.recipientAddress)}`,
      });

      // Refresh issued credentials list
      await refetchHistory();

      // Reset form
      setFormData({
        recipientAddress: '',
        title: '',
        description: '',
        category: 'education',
        value: '100',
        issuerName: '',
        externalUrl: '',
      });
      setBadgeImage(null);
      setBadgePreview('');
      setProofDocument(null);
      setProofDocumentName('');

    } catch (error: any) {
      setTxStatus('error');
      
      // Check if user rejected transaction
      if (error.code === 4001 || error.message?.includes('user rejected')) {
        setTxError('Transaction was rejected by user');
        toast({
          title: 'Transaction Rejected',
          description: 'You rejected the transaction in your wallet',
          variant: 'destructive',
        });
      } else {
        setTxError(error.message || 'Failed to issue credential');
        toast({
          title: 'Issuance Failed',
          description: error.message || 'Failed to issue credential',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // Show loading state while checking issuer status
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Loading...</h2>
              <p className="text-muted-foreground">
                Checking your issuer status
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Show authorization warning if not an issuer
  if (userProfile && !userProfile.isIssuer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center border-2 border-destructive/20 bg-destructive/5">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Unauthorized Access</h2>
              <p className="text-muted-foreground mb-6">
                You need to be an authorized issuer to access this page. Please contact an administrator to request issuer privileges.
              </p>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Issuer Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage verifiable credentials
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          {userProfile?.isIssuer && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{issuedCredentials?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Issued</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{collectibles.length}</p>
                    <p className="text-xs text-muted-foreground">Collectibles</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {issuedCredentials?.filter(c => c.status === 'verified').length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <Tabs defaultValue="issue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="issue" data-testid="tab-issue" className="gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Issue New</span>
              <span className="sm:hidden">Issue</span>
            </TabsTrigger>
            <TabsTrigger value="collectibles" data-testid="tab-collectibles" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Collectibles</span>
              <span className="sm:hidden">Collect</span>
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issue" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="p-6 border-2 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Credential Details</h2>
                    <p className="text-sm text-muted-foreground">Fill in the information below</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress" className="text-sm font-semibold">
                      Recipient Wallet Address *
                    </Label>
                    <Input
                      id="recipientAddress"
                      placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                      value={formData.recipientAddress}
                      onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                      className="font-mono text-sm h-11 bg-background/50 border-2 focus:border-primary transition-colors"
                      required
                      data-testid="input-recipient-address"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary"></span>
                      Enter the blockchain address of the recipient
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold">
                      Credential Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Blockchain Development Certificate"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-11 bg-background/50 border-2 focus:border-primary transition-colors"
                      required
                      data-testid="input-credential-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold">
                      Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-category" className="h-11 bg-background/50 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">🎓 Education</SelectItem>
                        <SelectItem value="professional">💼 Professional</SelectItem>
                        <SelectItem value="achievement">🏆 Achievement</SelectItem>
                        <SelectItem value="community">🤝 Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the achievement or qualification in detail..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="bg-background/50 border-2 focus:border-primary transition-colors resize-none"
                      required
                      data-testid="textarea-description"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-primary"></span>
                        Provide clear details about this credential
                      </p>
                      <p className={`font-medium ${formData.description.length > 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.description.length}/200
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-sm font-semibold">
                      Reputation Value *
                    </Label>
                    <div className="relative">
                      <Input
                        id="value"
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="100"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="h-11 bg-background/50 border-2 focus:border-primary transition-colors pl-10"
                        required
                        data-testid="input-reputation-value"
                      />
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-primary"></span>
                      Points to add to reputation (1-1000)
                    </p>
                  </div>

                  <div className="border-t-2 border-dashed pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Additional Information (Optional)
                      </h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="issuerName" className="text-sm font-semibold">
                          Issuer Name
                        </Label>
                        <Input
                          id="issuerName"
                          placeholder="e.g., Your Organization Name"
                          value={formData.issuerName}
                          onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                          className="h-11 bg-background/50 border-2 focus:border-primary transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="externalUrl" className="text-sm font-semibold">
                          External URL
                        </Label>
                        <Input
                          id="externalUrl"
                          type="url"
                          placeholder="https://example.com/credential-info"
                          value={formData.externalUrl}
                          onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                          className="h-11 bg-background/50 border-2 focus:border-primary transition-colors"
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground"></span>
                          Link to more information about this credential
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="badgeImage" className="text-sm font-semibold">
                          NFT Badge Image
                        </Label>
                        {badgePreview ? (
                          <div className="relative group">
                            <div className="aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                              <img
                                src={badgePreview}
                                alt="Badge preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              onClick={() => {
                                setBadgeImage(null);
                                setBadgePreview('');
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                            <Input
                              id="badgeImage"
                              type="file"
                              accept="image/*"
                              onChange={handleBadgeImageChange}
                              className="hidden"
                            />
                            <label htmlFor="badgeImage" className="cursor-pointer block">
                              <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-10 h-10 text-primary" />
                              </div>
                              <p className="text-sm font-semibold mb-2">
                                Click to upload NFT image
                              </p>
                              <p className="text-xs text-muted-foreground mb-1">
                                Recommended: 1000x1000px (1:1 ratio)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </label>
                          </div>
                        )}
                        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <span className="text-blue-600 text-lg">💡</span>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            <strong>Tip:</strong> Square images (1:1 aspect ratio) work best for NFTs
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proofDocument" className="text-sm font-semibold">
                          Proof Document
                        </Label>
                        {proofDocument ? (
                          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg group hover:bg-green-500/15 transition-colors">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate">{proofDocumentName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setProofDocument(null);
                                setProofDocumentName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                            <Input
                              id="proofDocument"
                              type="file"
                              accept=".pdf,image/*"
                              onChange={handleProofDocumentChange}
                              className="hidden"
                            />
                            <label htmlFor="proofDocument" className="cursor-pointer block">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6 text-primary" />
                              </div>
                              <p className="text-sm font-medium mb-1">
                                Click to upload proof document
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF or image up to 10MB
                              </p>
                            </label>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground"></span>
                          Supporting documentation (certificate, transcript, etc.)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                    disabled={isSubmitting}
                    data-testid="button-issue-credential"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{uploadProgress || 'Processing...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        <span>Issue Credential</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-2 shadow-lg sticky top-20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Live Preview</h2>
                    <p className="text-sm text-muted-foreground">See how it will look</p>
                  </div>
                </div>
                
                {formData.title ? (
                  <div className="space-y-4">
                    {/* NFT Card - Standard 1:1 aspect ratio */}
                    <div className="relative aspect-square w-full max-w-sm mx-auto rounded-xl overflow-hidden border-2 border-border shadow-lg bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
                      {/* Badge Image */}
                      {badgePreview ? (
                        <img
                          src={badgePreview}
                          alt="Badge"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-600/20">
                          <div className="text-center p-8">
                            <Shield className="w-24 h-24 mx-auto mb-4 text-primary/50" />
                            <p className="text-sm text-muted-foreground">
                              Upload an image to see it here
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-primary text-primary-foreground">
                            {formData.category}
                          </Badge>
                          <div className="flex items-center gap-1 text-white">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">
                          {formData.title}
                        </h3>
                        <p className="text-white/80 text-sm font-medium">
                          +{formData.value} Reputation
                        </p>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground">Description</span>
                        <span className="text-right flex-1 ml-4 font-medium">
                          {formData.description || 'No description'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground">Issuer</span>
                        <span className="font-medium">
                          {formData.issuerName || 'Your Organization'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground">Issue Date</span>
                        <span className="font-medium">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>

                      {formData.externalUrl && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-muted-foreground">External Link</span>
                          <a
                            href={formData.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}

                      {proofDocument && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">Proof document attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square w-full max-w-sm mx-auto rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/20">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-semibold mb-2">Preview Your NFT</h3>
                      <p className="text-sm text-muted-foreground">
                        Start filling out the form to see a live preview of your credential
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="collectibles" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Creation Form */}
              <div>
                <Card className="p-6 mb-6 border-2 shadow-lg bg-gradient-to-br from-card to-purple-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Create Collectible</h2>
                      <p className="text-sm text-muted-foreground">
                        Let users claim reputation cards themselves
                      </p>
                    </div>
                  </div>
                </Card>
                <CollectibleCreationForm
                  onSubmit={async (data: CollectibleFormData) => {
                    try {
                      const templateId = await createCollectible(data);
                      toast({
                        title: 'Collectible Created!',
                        description: `Successfully created collectible #${templateId}`,
                      });
                    } catch (error: any) {
                      toast({
                        title: 'Creation Failed',
                        description: error.message || 'Failed to create collectible',
                        variant: 'destructive',
                      });
                      throw error;
                    }
                  }}
                  isSubmitting={isSubmitting}
                />
              </div>

              {/* Info Card */}
              <div>
                <Card className="p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-primary/10 border-2 border-purple-500/20 shadow-lg sticky top-20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold">About Collectibles</h2>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-2">What are Collectibles?</h3>
                      <p className="text-muted-foreground">
                        Collectibles are reputation cards that users can claim themselves, rather than being directly issued. Perfect for events, achievements, and community rewards.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Key Features</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Set supply limits for scarcity</li>
                        <li>Time-based availability windows</li>
                        <li>Flexible eligibility criteria</li>
                        <li>Rarity tiers for gamification</li>
                        <li>Real-time analytics</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Best Practices</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Use clear, descriptive titles</li>
                        <li>Set appropriate reputation values</li>
                        <li>Consider time limits for urgency</li>
                        <li>Use rarity tiers strategically</li>
                        <li>Monitor claim analytics</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Management Panel */}
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Manage Collectibles</h2>
                      <p className="text-sm text-muted-foreground">
                        View and manage your created collectibles
                      </p>
                    </div>
                  </div>
                  {!collectiblesLoading && !collectiblesError && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchCollectibles()}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
              {collectiblesError && (
                <Card className="p-6 mb-4 border-2 border-destructive/20 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-destructive mb-1">Failed to Load Collectibles</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {collectiblesError.message || 'Could not load collectibles'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchCollectibles()}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              {collectiblesLoading ? (
                <CardLoadingSkeleton count={3} layout="grid" variant="collectible" />
              ) : (
                <CollectibleManagementPanel
                  collectibles={collectibles}
                  loading={collectiblesLoading}
                  onPause={async (templateId) => {
                  try {
                    await pauseCollectible(templateId);
                    toast({
                      title: 'Collectible Paused',
                      description: `Collectible #${templateId} has been paused`,
                    });
                  } catch (error: any) {
                    toast({
                      title: 'Pause Failed',
                      description: error.message || 'Failed to pause collectible',
                      variant: 'destructive',
                    });
                  }
                }}
                onResume={async (templateId) => {
                  try {
                    await resumeCollectible(templateId);
                    toast({
                      title: 'Collectible Resumed',
                      description: `Collectible #${templateId} has been resumed`,
                    });
                  } catch (error: any) {
                    toast({
                      title: 'Resume Failed',
                      description: error.message || 'Failed to resume collectible',
                      variant: 'destructive',
                    });
                  }
                }}
                onViewAnalytics={(templateId) => {
                  const collectible = collectibles.find(c => c.templateId === templateId);
                  if (collectible) {
                    setSelectedCollectibleForAnalytics(collectible);
                    setAnalyticsModalOpen(true);
                  }
                }}
                onViewPreview={(templateId) => {
                  const collectible = collectibles.find(c => c.templateId === templateId);
                  if (collectible) {
                    setSelectedCollectibleForPreview(collectible);
                    setPreviewModalOpen(true);
                  }
                }}
                onManageWhitelist={(templateId) => {
                  setSelectedTemplateId(templateId);
                  setWhitelistManagerOpen(true);
                }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Issuance History</h2>
                <p className="text-sm text-muted-foreground">
                  Track all credentials you've issued
                </p>
              </div>
              {!isLoadingHistory && !historyError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHistory()}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              )}
            </div>

            {/* Summary Stats */}
            {!isLoadingHistory && issuedCredentials && issuedCredentials.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Total Issued</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {issuedCredentials.length}
                  </p>
                </Card>
                
                <Card className="p-5 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Active</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {issuedCredentials.filter(c => c.status === 'verified').length}
                  </p>
                </Card>
                
                <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Total Reputation</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {issuedCredentials.reduce((sum, c) => sum + c.value, 0)}
                  </p>
                </Card>
              </div>
            )}

            <Card className="p-6 border-2 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Issued Credentials</h2>
                  <p className="text-sm text-muted-foreground">
                    {issuedCredentials?.length || 0} credential{issuedCredentials?.length !== 1 ? 's' : ''} issued
                  </p>
                </div>
              </div>
              {isLoadingHistory ? (
                <CardLoadingSkeleton count={3} layout="list" variant="credential" />
              ) : historyError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Failed to Load History</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {historyError.userMessage || 'Could not load issued credentials'}
                  </p>
                  <Button onClick={() => refetchHistory()} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              ) : !issuedCredentials || issuedCredentials.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Credentials Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Start issuing credentials to build reputation for your community members
                  </p>
                  <Button onClick={() => {
                    const tabs = document.querySelector('[value="issue"]') as HTMLElement;
                    tabs?.click();
                  }}>
                    <Send className="w-4 h-4 mr-2" />
                    Issue Your First Credential
                  </Button>
                </div>
              ) : (
                <div 
                  ref={credentialsContainerRef}
                  className="space-y-3 max-h-[600px] overflow-y-auto pr-2"
                >
                  {visibleCredentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-start justify-between p-4 rounded-lg border-2 hover:border-primary/50 hover:shadow-md transition-all bg-gradient-to-r from-card to-card/50"
                      data-testid={`credential-row-${credential.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold truncate">{credential.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {credential.category}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">Recipient:</span>
                            <span className="font-mono text-xs">{formatAddress(credential.recipient)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              +{credential.value} reputation
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(credential.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {credential.status === 'verified' ? (
                          <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-700 dark:text-red-400">
                            <X className="w-3 h-3" />
                            Revoked
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator for lazy loading */}
                  {isLoadingMoreCredentials && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                    </div>
                  )}
                  
                  {/* Load more button (fallback if auto-load doesn't trigger) */}
                  {hasMoreCredentials && !isLoadingMoreCredentials && (
                    <div className="flex items-center justify-center py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMoreCredentials}
                        className="gap-2"
                      >
                        Load More ({issuedCredentials.length - visibleCredentials.length} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Whitelist Manager Modal */}
      {selectedTemplateId !== null && (
        <WhitelistManager
          templateId={selectedTemplateId}
          isOpen={whitelistManagerOpen}
          onClose={() => {
            setWhitelistManagerOpen(false);
            setSelectedTemplateId(null);
          }}
          onAddAddresses={async (templateId, addresses) => {
            await addToWhitelist(templateId, addresses);
          }}
          onRemoveAddresses={async (templateId, addresses) => {
            await removeFromWhitelist(templateId, addresses);
          }}
        />
      )}

      {/* Analytics Modal */}
      <CollectibleAnalyticsModal
        collectible={selectedCollectibleForAnalytics}
        isOpen={analyticsModalOpen}
        onClose={() => {
          setAnalyticsModalOpen(false);
          setSelectedCollectibleForAnalytics(null);
        }}
      />

      {/* Preview Modal */}
      <CollectiblePreviewModal
        collectible={selectedCollectibleForPreview}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedCollectibleForPreview(null);
        }}
      />

      {/* Transaction Status Modal */}
      <TransactionStatus
        status={txStatus}
        message={uploadProgress}
        txHash={txHash}
        error={txError}
        open={txStatus !== 'idle'}
        onClose={() => {
          setTxStatus('idle');
          setTxHash('');
          setTxError('');
          setIssuedCredentialId('');
        }}
        title="Issue Credential"
        successMessage={`Successfully issued credential #${issuedCredentialId}`}
      />
    </div>
  );
}
