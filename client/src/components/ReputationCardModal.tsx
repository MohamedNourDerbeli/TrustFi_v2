import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Sparkles, 
  ExternalLink, 
  FileText, 
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import type { ReputationCard } from '@/types/reputationCard';
import { useState, useEffect } from 'react';
import { MintingModeBadge } from '@/components/shared/MintingModeBadge';
import { MintingMode, type CollectibleTemplate } from '@/types/collectible';
import { collectibleContractService } from '@/services/collectibleContractService';
import { useToast } from '@/hooks/use-toast';
import { ShareModal } from '@/components/shared/ShareModal';

interface ReputationCardModalProps {
  card: ReputationCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReputationCardModal({ card, open, onOpenChange }: ReputationCardModalProps) {
  const [copiedIssuer, setCopiedIssuer] = useState(false);
  const [mintingMode, setMintingMode] = useState<MintingMode | null>(null);
  const [collectibleTemplate] = useState<CollectibleTemplate | null>(null);
  const [loadingMintingInfo, setLoadingMintingInfo] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch minting mode and collectible info when card changes
  useEffect(() => {
    const fetchMintingInfo = async () => {
      if (!card?.id && !card?.cardId) return;

      setLoadingMintingInfo(true);
      try {
        const cardId = card.id || card.cardId;
        if (!cardId) return;

        // Get minting mode
        const mode = await collectibleContractService.getCardMintingMode(cardId);
        setMintingMode(mode as MintingMode);

        // If it's a collectible, try to get the template info
        if (mode === MintingMode.COLLECTIBLE) {
          // Note: We would need a way to get the templateId from the card
          // For now, we'll just show the minting mode badge
          // In a full implementation, the card data should include templateId
        }
      } catch (error) {
        console.error('Failed to fetch minting info:', error);
        // Default to DIRECT mode if fetch fails
        setMintingMode(MintingMode.DIRECT);
      } finally {
        setLoadingMintingInfo(false);
      }
    };

    if (open && card) {
      fetchMintingInfo();
    }
  }, [card, open]);

  if (!card) return null;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      education: 'bg-blue-500',
      professional: 'bg-purple-500',
      achievement: 'bg-green-500',
      community: 'bg-pink-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  const getImageUrl = (imageUri?: string) => {
    if (!imageUri) return null;
    
    if (imageUri.startsWith('ipfs://')) {
      const hash = imageUri.replace('ipfs://', '');
      const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
      return `https://${gateway}/ipfs/${hash}`;
    }
    
    return imageUri;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIssuer(true);
    setTimeout(() => setCopiedIssuer(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Issuer address copied to clipboard',
    });
  };

  const getVerificationUrl = () => {
    if (!card?.id && !card?.cardId) return '';
    const cardId = card.id || card.cardId;
    const chainId = collectibleContractService.getCurrentChainId() || '31337';
    const contractAddress = collectibleContractService.getContractAddress();
    return `${window.location.origin}/verify/${chainId}/${contractAddress}/${cardId}`;
  };

  const imageUrl = getImageUrl(card.metadata?.image);
  const title = card.metadata?.title || card.description || 'Untitled Card';
  const description = card.metadata?.description || card.description;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Image */}
          <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                style={{ minHeight: '400px' }}
              />
            ) : (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                <Shield className="w-32 h-32 text-primary/30" />
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="p-6 space-y-6">
            <DialogHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${getCategoryColor(card.category)} text-white`}>
                    {card.metadata?.category || card.category}
                  </Badge>
                  {mintingMode !== null && !loadingMintingInfo && (
                    <MintingModeBadge mintingMode={mintingMode} size="sm" />
                  )}
                </div>
                {card.isValid ? (
                  <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-red-500 text-red-600">
                    <XCircle className="w-3 h-3" />
                    Revoked
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
            </DialogHeader>

            {description && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                <p className="text-sm leading-relaxed">{description}</p>
              </div>
            )}

            <Separator />

            {/* Reputation Value */}
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Reputation Value</span>
                </div>
                <span className="text-3xl font-bold text-primary">+{card.value}</span>
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Details</h3>
              
              {/* Issuer */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Issued by</span>
                </div>
                <div className="text-right">
                  {card.metadata?.issuerName ? (
                    <div>
                      <p className="font-medium">{card.metadata.issuerName}</p>
                      <button
                        onClick={() => copyToClipboard(card.issuer)}
                        className="text-xs text-muted-foreground hover:text-primary font-mono flex items-center gap-1"
                      >
                        {formatAddress(card.issuer)}
                        {copiedIssuer ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => copyToClipboard(card.issuer)}
                      className="font-mono text-sm hover:text-primary flex items-center gap-1"
                    >
                      {formatAddress(card.issuer)}
                      {copiedIssuer ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Issue/Claim Date */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {mintingMode === MintingMode.COLLECTIBLE ? 'Claimed on' : 'Issued on'}
                  </span>
                </div>
                <p className="font-medium text-sm text-right">{formatDate(card.issuedAt)}</p>
              </div>

              {/* Card ID */}
              {card.id && (
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Card ID</span>
                  </div>
                  <p className="font-medium text-sm">#{card.id}</p>
                </div>
              )}
            </div>

            {/* Attributes */}
            {(() => {
              const customAttributes = card.metadata?.attributes?.filter(attr => 
                // Filter out attributes that are already shown in Details section
                attr.trait_type !== 'Issuer' && 
                attr.trait_type !== 'Issued At' &&
                attr.trait_type !== 'Reputation Value'
              ) || [];
              
              return customAttributes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Attributes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {customAttributes.map((attr, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">{attr.trait_type}</p>
                          <p className="font-semibold text-sm">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Collectible Template Info */}
            {mintingMode === MintingMode.COLLECTIBLE && collectibleTemplate && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Collectible Info</h3>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {collectibleTemplate.maxSupply > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supply</span>
                        <span className="font-medium">
                          {collectibleTemplate.currentSupply} / {collectibleTemplate.maxSupply}
                        </span>
                      </div>
                    )}
                    {collectibleTemplate.rarityTier !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rarity</span>
                        <span className="font-medium">
                          {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][collectibleTemplate.rarityTier]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Links */}
            {(card.metadata?.externalUrl || card.metadata?.proofDocument) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {card.metadata.externalUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <a
                        href={card.metadata.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View External Details
                      </a>
                    </Button>
                  )}
                  {card.metadata.proofDocument && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <a
                        href={getImageUrl(card.metadata.proofDocument) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="w-4 h-4" />
                        View Proof Document
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Share Functionality - Only for collectibles */}
            {mintingMode === MintingMode.COLLECTIBLE && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Share</h3>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share2 className="w-4 h-4" />
                    Share This Card
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ShareModal
      open={shareModalOpen}
      onOpenChange={setShareModalOpen}
      verificationUrl={getVerificationUrl()}
      title={title}
      description={description}
    />
    </>
  );
}
