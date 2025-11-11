/**
 * CollectibleDetailModal - Detailed view of a collectible with claim functionality
 * Shows full information, eligibility requirements, and claim button with gas estimate
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  RarityIndicator, 
  SupplyIndicator, 
  TimeRemainingBadge,
  EligibilityChecker 
} from '@/components/shared';
import { ClaimConfirmationModal } from './ClaimConfirmationModal';
import { useCollectibleClaim } from '@/hooks/useCollectibleClaim';
import { useWallet } from '@/contexts/WalletContext';
import type { CollectibleTemplate, ClaimStatus } from '@/types/collectible';
import { EligibilityType } from '@/types/collectible';
import {
  Sparkles,
  User,
  CheckCircle2,
  Share2,
  ExternalLink,
  Calendar,
  Users,
  TrendingUp,
} from 'lucide-react';
// import { cn } from '@/lib/utils';

interface CollectibleDetailModalProps {
  template: CollectibleTemplate;
  claimStatus?: ClaimStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimSuccess?: () => void;
}

export function CollectibleDetailModal({
  template,
  claimStatus,
  open,
  onOpenChange,
  onClaimSuccess,
}: CollectibleDetailModalProps) {
  const { address } = useWallet();
  const { estimateGas, gasEstimate } = useCollectibleClaim();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const {
    templateId,
    category,
    description,
    value,
    issuer,
    rarityTier,
    maxSupply,
    currentSupply,
    startTime,
    endTime,
    eligibilityType,
    isPaused,
    metadataURI,
  } = template;

  // Fetch metadata and extract image URL
  useEffect(() => {
    async function fetchImage() {
      if (!metadataURI) return;
      
      setIsLoadingImage(true);
      try {
        // Convert IPFS URI to HTTP gateway URL
        let metadataUrl = metadataURI;
        if (metadataURI.startsWith('ipfs://')) {
          const hash = metadataURI.replace('ipfs://', '');
          const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
          metadataUrl = `https://${gateway}/ipfs/${hash}`;
        }

        // Fetch metadata JSON
        const response = await fetch(metadataUrl);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        
        const metadata = await response.json();
        
        // Extract image URL
        if (metadata.image) {
          let imgUrl = metadata.image;
          // Convert IPFS image URL to HTTP gateway
          if (imgUrl.startsWith('ipfs://')) {
            const imgHash = imgUrl.replace('ipfs://', '');
            const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
            imgUrl = `https://${gateway}/ipfs/${imgHash}`;
          }
          setImageUrl(imgUrl);
        }
      } catch (error) {
        console.error('Failed to fetch collectible image:', error);
      } finally {
        setIsLoadingImage(false);
      }
    }

    if (open) {
      fetchImage();
    }
  }, [metadataURI, open]);

  const isEligible = claimStatus?.isEligible ?? false;
  const hasClaimed = claimStatus?.hasClaimed ?? false;
  const canClaimNow = claimStatus?.canClaimNow ?? false;

  // Estimate gas when modal opens and user is eligible
  useEffect(() => {
    if (open && address && isEligible && !hasClaimed && canClaimNow) {
      setIsEstimating(true);
      estimateGas(templateId).finally(() => setIsEstimating(false));
    }
  }, [open, address, isEligible, hasClaimed, canClaimNow, templateId, estimateGas]);

  const handleClaimClick = () => {
    setShowClaimModal(true);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/collectibles/${templateId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${category} - TrustFi Collectible`,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  };

  const getEligibilityTypeName = (type: EligibilityType): string => {
    switch (type) {
      case EligibilityType.OPEN:
        return 'Open to All';
      case EligibilityType.WHITELIST:
        return 'Whitelist Only';
      case EligibilityType.TOKEN_HOLDER:
        return 'Token Holders';
      case EligibilityType.PROFILE_REQUIRED:
        return 'Profile Required';
      default:
        return 'Unknown';
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{category}</DialogTitle>
                <DialogDescription className="text-base">
                  {description}
                </DialogDescription>
              </div>
              <RarityIndicator rarity={rarityTier} size="lg" />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Large Image/Visual */}
            <Card className="overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={template.title || category}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      setImageUrl(null);
                    }}
                  />
                ) : isLoadingImage ? (
                  <div className="text-muted-foreground">Loading image...</div>
                ) : (
                  <Sparkles className="w-32 h-32 text-muted-foreground/30" />
                )}
              </div>
            </Card>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {hasClaimed && (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  You've Claimed This
                </Badge>
              )}
              {!hasClaimed && isEligible && (
                <Badge variant="default" className="gap-1 bg-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                  You're Eligible
                </Badge>
              )}
              {isPaused && (
                <Badge variant="destructive">Paused</Badge>
              )}
              <TimeRemainingBadge startTime={startTime} endTime={endTime} />
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supply */}
              <Card>
                <CardContent className="p-4">
                  <SupplyIndicator
                    currentSupply={currentSupply}
                    maxSupply={maxSupply}
                    showProgressBar={true}
                  />
                </CardContent>
              </Card>

              {/* Value */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium">
                      Reputation Value:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      +{value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Issuer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Issuer Information
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Issued by
                      </div>
                      <div className="font-mono text-sm">
                        {formatAddress(issuer)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${issuer}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Eligibility Requirements */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Eligibility Requirements
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="outline">
                        {getEligibilityTypeName(eligibilityType)}
                      </Badge>
                    </div>
                    
                    {claimStatus && address && (
                      <EligibilityChecker
                        template={template}
                        claimStatus={claimStatus}
                        userAddress={address}
                      />
                    )}

                    {!address && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Connect your wallet to check eligibility
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Claim Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Claim Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">{currentSupply}</div>
                    <div className="text-xs text-muted-foreground">Total Claims</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {startTime > 0 ? new Date(startTime * 1000).toLocaleDateString() : 'Anytime'}
                    </div>
                    <div className="text-xs text-muted-foreground">Start Date</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-2xl font-bold">
                      {endTime > 0 ? new Date(endTime * 1000).toLocaleDateString() : 'No Limit'}
                    </div>
                    <div className="text-xs text-muted-foreground">End Date</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Blockchain Verification */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Blockchain Verification</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template ID:</span>
                      <span className="font-mono">#{templateId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract:</span>
                      <span className="font-mono text-xs">
                        {formatAddress(issuer)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified On-Chain
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!hasClaimed && canClaimNow && !isPaused && (
                <Button
                  className="flex-1"
                  onClick={handleClaimClick}
                  disabled={!isEligible || isEstimating}
                >
                  {isEstimating ? 'Estimating Gas...' : 'Claim Collectible'}
                </Button>
              )}

              {hasClaimed && (
                <Button className="flex-1" variant="outline" disabled>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Already Claimed
                </Button>
              )}

              {!canClaimNow && !hasClaimed && (
                <Button className="flex-1" variant="outline" disabled>
                  {claimStatus?.reason || 'Not Available'}
                </Button>
              )}

              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Gas Estimate Display */}
            {gasEstimate && isEligible && !hasClaimed && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Gas:</span>
                      <span className="font-medium">{gasEstimate.gasCostEth} ETH</span>
                    </div>
                    {gasEstimate.gasCostUsd && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">USD Equivalent:</span>
                        <span className="font-medium">${gasEstimate.gasCostUsd}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Confirmation Modal */}
      {showClaimModal && (
        <ClaimConfirmationModal
          template={template}
          gasEstimate={gasEstimate}
          claimStatus={claimStatus}
          open={showClaimModal}
          onOpenChange={setShowClaimModal}
          onSuccess={() => {
            setShowClaimModal(false);
            onOpenChange(false);
            // Trigger refresh of claim status and collectibles
            onClaimSuccess?.();
          }}
        />
      )}
    </>
  );
}
