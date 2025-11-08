import { useState, useEffect } from 'react';
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
import { Shield, Send, Clock, CheckCircle2, Loader2, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { contractService } from '@/services/contractService';
import { reputationCardService } from '@/services/reputationCardService';
import { reputationCardMetadataService } from '@/services/reputationCardMetadataService';

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
  const [issuedCredentials, setIssuedCredentials] = useState<Array<{
    id: string;
    recipient: string;
    title: string;
    date: string;
    status: string;
  }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load issued credentials
  useEffect(() => {
    async function loadIssuedCredentials() {
      if (!userProfile?.isIssuer || !address) return;

      try {
        setIsLoadingHistory(true);
        // Get all cards issued by this address
        // Note: This requires iterating through profiles or implementing an indexer
        // For now, we'll show a placeholder
        setIssuedCredentials([]);
      } catch (error) {
        // Failed to load issued credentials
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadIssuedCredentials();
  }, [userProfile, address]);

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
      setUploadProgress('Verifying recipient...');

      // Get recipient's profile
      const recipientProfile = await contractService.getProfileByOwner(formData.recipientAddress);
      
      if (!recipientProfile || !recipientProfile.tokenId) {
        toast({
          title: 'Profile Not Found',
          description: 'Recipient does not have a TrustFi profile',
          variant: 'destructive',
        });
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
      setUploadProgress('Issuing credential on blockchain...');
      toast({
        title: 'Confirm Transaction',
        description: 'Please confirm the transaction in your wallet',
      });

      const cardId = await reputationCardService.issueCard(
        Number(recipientProfile.tokenId),
        formData.category,
        Number(formData.value),
        metadataURI
      );

      toast({
        title: 'Credential Issued!',
        description: `Successfully issued credential #${cardId} to ${formatAddress(formData.recipientAddress)}`,
      });

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
      toast({
        title: 'Issuance Failed',
        description: error.message || 'Failed to issue credential',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Issue Credentials</h1>
          <p className="text-muted-foreground">
            Create and mint verifiable credentials for recipients
          </p>
        </div>

        <Tabs defaultValue="issue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="issue" data-testid="tab-issue">Issue New</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Issued Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="issue" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Credential Details</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Recipient Wallet Address</Label>
                    <Input
                      id="recipientAddress"
                      placeholder="0x..."
                      value={formData.recipientAddress}
                      onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                      className="font-mono text-sm"
                      required
                      data-testid="input-recipient-address"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the blockchain address of the recipient
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Credential Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Blockchain Development Certificate"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      data-testid="input-credential-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="achievement">Achievement</SelectItem>
                        <SelectItem value="community">Community</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the achievement or qualification..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      required
                      data-testid="textarea-description"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length} characters (max 200)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">Reputation Value</Label>
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="100"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      required
                      data-testid="input-reputation-value"
                    />
                    <p className="text-xs text-muted-foreground">
                      Points to add to reputation (1-1000)
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Additional Information (Optional)</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="issuerName">Issuer Name</Label>
                        <Input
                          id="issuerName"
                          placeholder="e.g., Your Organization Name"
                          value={formData.issuerName}
                          onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="externalUrl">External URL</Label>
                        <Input
                          id="externalUrl"
                          type="url"
                          placeholder="https://..."
                          value={formData.externalUrl}
                          onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Link to more information about this credential
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="badgeImage">NFT Badge Image</Label>
                        {badgePreview ? (
                          <div className="relative">
                            <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-border">
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
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setBadgeImage(null);
                                setBadgePreview('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
                            <Input
                              id="badgeImage"
                              type="file"
                              accept="image/*"
                              onChange={handleBadgeImageChange}
                              className="hidden"
                            />
                            <label htmlFor="badgeImage" className="cursor-pointer">
                              <div className="aspect-square w-24 h-24 mx-auto mb-4 rounded-lg bg-muted/50 flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium mb-1">
                                Click to upload NFT image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Recommended: 1000x1000px (1:1 ratio)
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </label>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Square images (1:1 aspect ratio) work best for NFTs
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proofDocument">Proof Document</Label>
                        {proofDocument ? (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="flex-1 text-sm truncate">{proofDocumentName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProofDocument(null);
                                setProofDocumentName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                            <Input
                              id="proofDocument"
                              type="file"
                              accept=".pdf,image/*"
                              onChange={handleProofDocumentChange}
                              className="hidden"
                            />
                            <label htmlFor="proofDocument" className="cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload proof document
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF or image up to 10MB
                              </p>
                            </label>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Supporting documentation (certificate, transcript, etc.)
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !userProfile?.isIssuer}
                    data-testid="button-issue-credential"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {uploadProgress || 'Issuing...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Issue Credential
                      </>
                    )}
                  </Button>
                  
                  {!userProfile?.isIssuer && (
                    <p className="text-xs text-destructive text-center">
                      You are not authorized to issue credentials
                    </p>
                  )}
                </form>
              </Card>

              <Card className="p-6 bg-card/50 sticky top-20">
                <h2 className="text-xl font-semibold mb-4">NFT Preview</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  This is how your reputation card will appear as an NFT
                </p>
                
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
                  <div className="aspect-square w-full max-w-sm mx-auto rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                    <div className="text-center p-8">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Fill out the form to preview your NFT
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Recently Issued Credentials</h2>
              {isLoadingHistory ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading history...</p>
                </div>
              ) : issuedCredentials.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No credentials issued yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issuedCredentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`credential-row-${credential.id}`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{credential.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-mono">{credential.recipient}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(credential.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        {credential.status === 'verified' ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
