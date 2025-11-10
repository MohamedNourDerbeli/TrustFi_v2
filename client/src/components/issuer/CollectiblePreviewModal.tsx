import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Users, Award, Sparkles } from 'lucide-react';
import type { CollectibleTemplate } from '@/types/collectible';
import { format } from 'date-fns';

interface CollectiblePreviewModalProps {
  collectible: CollectibleTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_CONFIG = {
  0: { name: 'Common', gradient: 'from-gray-400 to-gray-600', glow: 'shadow-gray-500/50' },
  1: { name: 'Uncommon', gradient: 'from-green-400 to-green-600', glow: 'shadow-green-500/50' },
  2: { name: 'Rare', gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/50' },
  3: { name: 'Epic', gradient: 'from-purple-400 to-purple-600', glow: 'shadow-purple-500/50' },
  4: { name: 'Legendary', gradient: 'from-orange-400 to-orange-600', glow: 'shadow-orange-500/50' },
};

export function CollectiblePreviewModal({
  collectible,
  isOpen,
  onClose,
}: CollectiblePreviewModalProps) {
  if (!collectible) return null;

  const rarity = RARITY_CONFIG[collectible.rarityTier as keyof typeof RARITY_CONFIG];
  const hasTimeWindow = collectible.startTime > 0 || collectible.endTime > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Collectible Preview
          </DialogTitle>
          <DialogDescription>
            How users will see this collectible
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* NFT Card Preview */}
          <div className="relative">
            <div className={`aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden border-4 ${rarity.glow} shadow-2xl bg-gradient-to-br ${rarity.gradient} relative`}>
              {collectible.metadataURI && collectible.metadataURI.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={collectible.metadataURI}
                  alt={collectible.category}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <div class="text-center p-8">
                            <div class="text-6xl mb-4">🏆</div>
                            <p class="text-white font-bold text-2xl capitalize">${collectible.category}</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="text-8xl mb-6">
                      {collectible.category === 'education' && '🎓'}
                      {collectible.category === 'professional' && '💼'}
                      {collectible.category === 'achievement' && '🏆'}
                      {collectible.category === 'community' && '🤝'}
                      {!['education', 'professional', 'achievement', 'community'].includes(collectible.category) && '⭐'}
                    </div>
                    <h3 className="text-white font-bold text-3xl capitalize mb-2">
                      {collectible.category}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {rarity.name} Collectible
                    </p>
                  </div>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`bg-gradient-to-r ${rarity.gradient} text-white border-0 shadow-lg`}>
                    {rarity.name}
                  </Badge>
                  <div className="flex items-center gap-1 text-white">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-medium">+{collectible.value}</span>
                  </div>
                </div>
                <h3 className="text-white font-bold text-2xl mb-2 capitalize">
                  {collectible.category}
                </h3>
                <p className="text-white/90 text-sm line-clamp-2">
                  {collectible.description}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Supply</span>
              </div>
              <p className="text-lg font-bold">
                {collectible.maxSupply === 0 ? 'Unlimited' : `${collectible.currentSupply} / ${collectible.maxSupply}`}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Reputation</span>
              </div>
              <p className="text-lg font-bold">+{collectible.value}</p>
            </Card>
          </div>

          {/* Time Window */}
          {hasTimeWindow && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <h4 className="font-semibold">Availability Window</h4>
              </div>
              <div className="space-y-2 text-sm">
                {collectible.startTime > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts</span>
                    <span className="font-medium">
                      {format(new Date(collectible.startTime * 1000), 'PPp')}
                    </span>
                  </div>
                )}
                {collectible.endTime > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="font-medium">
                      {format(new Date(collectible.endTime * 1000), 'PPp')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Eligibility */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Eligibility Requirements</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm">
                  {['Anyone can claim', 'Whitelisted addresses only', 'Token holders only', 'Profile required'][collectible.eligibilityType]}
                </span>
              </div>
              {collectible.maxSupply > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">Limited to {collectible.maxSupply} claims</span>
                </div>
              )}
            </div>
          </Card>

          {/* Status */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status</span>
              <Badge variant={collectible.isActive && !collectible.isPaused ? 'default' : 'secondary'}>
                {collectible.isPaused ? 'Paused' : collectible.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
