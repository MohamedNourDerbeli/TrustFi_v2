import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Sparkles,
  Calendar,
  Users,
  Lock,
  Coins,
  UserCheck,
  Infinity,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import type { CollectibleFormData } from '@/types/collectible';
import { EligibilityType, RarityTier } from '@/types/collectible';

interface CollectiblePreviewProps {
  data: CollectibleFormData;
  imagePreview?: string;
  onPublish?: () => void;
  isPublishing?: boolean;
}

const RARITY_CONFIG = {
  [RarityTier.COMMON]: {
    name: 'Common',
    color: 'bg-gray-500',
    textColor: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500',
  },
  [RarityTier.UNCOMMON]: {
    name: 'Uncommon',
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
  },
  [RarityTier.RARE]: {
    name: 'Rare',
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
  },
  [RarityTier.EPIC]: {
    name: 'Epic',
    color: 'bg-purple-500',
    textColor: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
  },
  [RarityTier.LEGENDARY]: {
    name: 'Legendary',
    color: 'bg-orange-500',
    textColor: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
  },
};

const ELIGIBILITY_ICONS = {
  [EligibilityType.OPEN]: Users,
  [EligibilityType.WHITELIST]: Lock,
  [EligibilityType.TOKEN_HOLDER]: Coins,
  [EligibilityType.PROFILE_REQUIRED]: UserCheck,
};

const ELIGIBILITY_LABELS = {
  [EligibilityType.OPEN]: 'Open to Everyone',
  [EligibilityType.WHITELIST]: 'Whitelist Only',
  [EligibilityType.TOKEN_HOLDER]: 'Token Holders',
  [EligibilityType.PROFILE_REQUIRED]: 'Profile Required',
};

export function CollectiblePreview({
  data,
  imagePreview,
  onPublish,
  isPublishing,
}: CollectiblePreviewProps) {
  const rarityConfig = RARITY_CONFIG[data.rarityTier];
  const EligibilityIcon = ELIGIBILITY_ICONS[data.eligibilityType];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      education: 'bg-blue-500',
      professional: 'bg-purple-500',
      achievement: 'bg-green-500',
      community: 'bg-pink-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Preview</h2>
        <p className="text-sm text-muted-foreground">
          This is how your collectible will appear to users
        </p>
      </div>

      {/* Collectible Card Display */}
      <div className={`relative aspect-square w-full max-w-sm mx-auto rounded-xl overflow-hidden border-2 ${rarityConfig.borderColor} shadow-lg`}>
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Collectible preview"
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
            <Badge className={`${getCategoryColor(data.category)} text-white`}>
              {data.category}
            </Badge>
            <Badge className={`${rarityConfig.bgColor} ${rarityConfig.textColor} border ${rarityConfig.borderColor}`}>
              <Sparkles className="w-3 h-3 mr-1" />
              {rarityConfig.name}
            </Badge>
          </div>
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">
            {data.description || 'Collectible Title'}
          </h3>
          <p className="text-white/80 text-sm font-medium">
            +{data.value} Reputation
          </p>
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Details</h3>

        {/* Supply */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            {data.maxSupply === 0 ? (
              <Infinity className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Users className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">Supply</span>
          </div>
          <span className="font-medium">
            {data.maxSupply === 0 ? 'Unlimited' : `${data.maxSupply} total`}
          </span>
        </div>

        {/* Time Restrictions */}
        {(data.startTime || data.endTime) && (
          <div className="space-y-2">
            {data.startTime && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Starts</span>
                </div>
                <span className="font-medium text-sm">
                  {format(data.startTime, 'PPP')}
                </span>
              </div>
            )}
            {data.endTime && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ends</span>
                </div>
                <span className="font-medium text-sm">
                  {format(data.endTime, 'PPP')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Eligibility */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <EligibilityIcon className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">
              {ELIGIBILITY_LABELS[data.eligibilityType]}
            </span>
          </div>
          
          {data.eligibilityType === EligibilityType.OPEN && (
            <p className="text-xs text-muted-foreground">
              Anyone can claim this collectible
            </p>
          )}

          {data.eligibilityType === EligibilityType.WHITELIST && (
            <p className="text-xs text-muted-foreground">
              {data.eligibilityConfig.whitelist?.length || 0} whitelisted addresses
            </p>
          )}

          {data.eligibilityType === EligibilityType.TOKEN_HOLDER && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Token: {data.eligibilityConfig.tokenAddress?.slice(0, 10)}...</p>
              <p>Min Balance: {data.eligibilityConfig.minBalance}</p>
            </div>
          )}

          {data.eligibilityType === EligibilityType.PROFILE_REQUIRED && (
            <p className="text-xs text-muted-foreground">
              {data.eligibilityConfig.minReputationScore
                ? `Requires ${data.eligibilityConfig.minReputationScore}+ reputation`
                : 'Requires TrustFi profile'}
            </p>
          )}
        </div>

        {/* Rarity Tier */}
        <div className={`p-4 ${rarityConfig.bgColor} border ${rarityConfig.borderColor} rounded-lg`}>
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${rarityConfig.color.replace('bg-', 'text-')}`} />
            <span className={`font-semibold text-sm ${rarityConfig.textColor}`}>
              {rarityConfig.name} Rarity
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This collectible will have special {rarityConfig.name.toLowerCase()} styling
          </p>
        </div>
      </div>

      {onPublish && (
        <>
          <Separator />
          <Button
            onClick={onPublish}
            disabled={isPublishing || !data.description}
            className="w-full"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Shield className="w-4 h-4 animate-pulse" />
                Publishing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Publish Collectible
              </>
            )}
          </Button>
          {!data.description && (
            <p className="text-xs text-center text-muted-foreground">
              Complete the form to publish
            </p>
          )}
        </>
      )}
    </Card>
  );
}
