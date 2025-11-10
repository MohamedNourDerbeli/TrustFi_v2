import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Clock, Award } from 'lucide-react';
import type { CollectibleTemplate, ClaimStats } from '@/types/collectible';
import { collectibleContractService } from '@/services/collectibleContractService';

interface CollectibleAnalyticsModalProps {
  collectible: CollectibleTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CollectibleAnalyticsModal({
  collectible,
  isOpen,
  onClose,
}: CollectibleAnalyticsModalProps) {
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!collectible) return;

      setLoading(true);
      try {
        const claimStats = await collectibleContractService.getClaimStats(collectible.templateId);
        setStats(claimStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && collectible) {
      fetchStats();
    }
  }, [isOpen, collectible]);

  if (!collectible) return null;

  const supplyPercentage = collectible.maxSupply === 0
    ? 0
    : (stats?.totalClaims || 0) / collectible.maxSupply * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Analytics - {collectible.category}
          </DialogTitle>
          <DialogDescription>
            Collectible #{collectible.templateId} performance metrics
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Total Claims</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.totalClaims || 0}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Remaining</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {collectible.maxSupply === 0 ? '∞' : stats?.remainingSupply || 0}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-muted-foreground">Value</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {collectible.value}
                </p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-muted-foreground">Status</span>
                </div>
                <Badge variant={stats?.isActive ? 'default' : 'secondary'} className="text-xs">
                  {stats?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Card>
            </div>

            {/* Supply Progress */}
            {collectible.maxSupply > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Supply Progress</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Claimed</span>
                    <span className="font-medium">
                      {stats?.totalClaims || 0} / {collectible.maxSupply}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
                      style={{ width: `${Math.min(supplyPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {supplyPercentage.toFixed(1)}% claimed
                  </p>
                </div>
              </Card>
            )}

            {/* Details */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Collectible Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium capitalize">{collectible.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium text-right max-w-xs truncate">
                    {collectible.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eligibility</span>
                  <Badge variant="outline" className="text-xs">
                    {['Open', 'Whitelist', 'Token Holder', 'Profile Required'][collectible.eligibilityType]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rarity</span>
                  <Badge variant="outline" className="text-xs">
                    {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][collectible.rarityTier]}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
