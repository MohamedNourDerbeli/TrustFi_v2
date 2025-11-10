/**
 * CollectibleCard - Clean, modern card design
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CollectibleTemplate, ClaimStatus } from '@/types/collectible';
import { RarityTier } from '@/types/collectible';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectibleCardProps {
  template: CollectibleTemplate;
  claimStatus?: ClaimStatus;
  onClick?: () => void;
  onClaim?: () => void;
}

// Rarity colors
const rarityColors: Record<RarityTier, string> = {
  [RarityTier.COMMON]: 'from-gray-500/20 to-gray-600/20',
  [RarityTier.UNCOMMON]: 'from-green-500/20 to-green-600/20',
  [RarityTier.RARE]: 'from-blue-500/20 to-blue-600/20',
  [RarityTier.EPIC]: 'from-purple-500/20 to-purple-600/20',
  [RarityTier.LEGENDARY]: 'from-amber-500/20 to-amber-600/20',
};

const rarityBadgeColors: Record<RarityTier, string> = {
  [RarityTier.COMMON]: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20',
  [RarityTier.UNCOMMON]: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
  [RarityTier.RARE]: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  [RarityTier.EPIC]: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  [RarityTier.LEGENDARY]: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
};

const rarityNames: Record<RarityTier, string> = {
  [RarityTier.COMMON]: 'Common',
  [RarityTier.UNCOMMON]: 'Uncommon',
  [RarityTier.RARE]: 'Rare',
  [RarityTier.EPIC]: 'Epic',
  [RarityTier.LEGENDARY]: 'Legendary',
};

export function CollectibleCard({
  template,
  claimStatus,
  onClick,
  onClaim,
}: CollectibleCardProps) {
  const {
    category,
    description,
    rarityTier,
    maxSupply,
    currentSupply,
    endTime,
    isPaused,
    metadataURI,
  } = template;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Fetch metadata and extract image URL
  useEffect(() => {
    async function fetchImage() {
      if (!metadataURI) return;
      
      setIsLoadingImage(true);
      try {
        let metadataUrl = metadataURI;
        if (metadataURI.startsWith('ipfs://')) {
          const hash = metadataURI.replace('ipfs://', '');
          const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
          metadataUrl = `https://${gateway}/ipfs/${hash}`;
        }

        const response = await fetch(metadataUrl);
        if (!response.ok) throw new Error('Failed to fetch metadata');
        
        const metadata = await response.json();
        
        if (metadata.image) {
          let imgUrl = metadata.image;
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

    fetchImage();
  }, [metadataURI]);

  const isEligible = claimStatus?.isEligible ?? false;
  const hasClaimed = claimStatus?.hasClaimed ?? false;
  const canClaimNow = claimStatus?.canClaimNow ?? false;

  // Calculate if expiring soon (within 7 days)
  const now = Math.floor(Date.now() / 1000);
  const isExpiringSoon = endTime > 0 && endTime - now < 7 * 24 * 60 * 60;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  const handleClaimClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClaim?.();
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 overflow-hidden',
        'hover:shadow-lg border-border/50',
        'bg-card'
      )}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className={cn(
        'relative aspect-square bg-gradient-to-br overflow-hidden',
        rarityColors[rarityTier as RarityTier]
      )}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={template.title || category}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              setImageUrl(null);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            {isLoadingImage ? (
              <div className="text-muted-foreground text-xs">Loading...</div>
            ) : (
              <div className="text-5xl">
                {category === 'education' && '🎓'}
                {category === 'professional' && '💼'}
                {category === 'achievement' && '🏆'}
                {category === 'community' && '🤝'}
                {!['education', 'professional', 'achievement', 'community'].includes(category) && '⭐'}
              </div>
            )}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <Badge className={cn('text-xs border', rarityBadgeColors[rarityTier as RarityTier])}>
            {rarityNames[rarityTier as RarityTier]}
          </Badge>
          
          {hasClaimed && (
            <Badge className="bg-green-600 text-white border-0">
              <CheckCircle2 className="w-3 h-3" />
            </Badge>
          )}
          
          {!hasClaimed && isEligible && (
            <Badge className="bg-blue-600 text-white border-0">
              Eligible
            </Badge>
          )}
        </div>

        {/* Bottom Badges */}
        {isExpiringSoon && endTime > 0 && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="destructive" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              Expiring Soon
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Category */}
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {category}
        </div>

        {/* Description */}
        <p className="text-sm font-medium line-clamp-2 mb-3 min-h-[2.5rem]">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b">
          <div>
            <div className="text-muted-foreground">Supply</div>
            <div className="font-semibold">{currentSupply}/{maxSupply === 0 ? '∞' : maxSupply}</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Claimed</div>
            <div className="font-semibold">
              {maxSupply === 0 ? currentSupply : `${Math.round((currentSupply / maxSupply) * 100)}%`}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!hasClaimed && canClaimNow && !isPaused && (
          <Button
            className="w-full h-9"
            onClick={handleClaimClick}
            disabled={!isEligible}
          >
            Claim Now
          </Button>
        )}

        {!hasClaimed && !canClaimNow && !isPaused && (
          <Button
            className="w-full h-9"
            variant="outline"
            disabled
          >
            {claimStatus?.reason || 'Not Available'}
          </Button>
        )}

        {hasClaimed && (
          <Button
            className="w-full h-9"
            variant="outline"
            disabled
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Claimed
          </Button>
        )}

        {isPaused && (
          <Button
            className="w-full h-9"
            variant="outline"
            disabled
          >
            Paused
          </Button>
        )}

        {/* View Details */}
        <button
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClick}
        >
          View Details →
        </button>
      </div>
    </Card>
  );
}
