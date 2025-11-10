/**
 * TrendingSection - Displays trending collectibles with indicators
 * Shows hot collectibles based on claim velocity, scarcity, and urgency
 */

import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollectibleCard } from './CollectibleCard';
import { trendingService } from '@/services/trendingService';
import type { CollectibleTemplate, ClaimStatus } from '@/types/collectible';
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Zap,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendingSectionProps {
  collectibles: CollectibleTemplate[];
  claimStatus?: Map<number, ClaimStatus>;
  onCollectibleClick?: (collectible: CollectibleTemplate) => void;
  className?: string;
}

export function TrendingSection({
  collectibles,
  claimStatus,
  onCollectibleClick,
  className,
}: TrendingSectionProps) {
  const [, setLocation] = useLocation();

  // Calculate trending collectibles
  const trendingCollectibles = useMemo(() => {
    return trendingService.getTrendingCollectibles(collectibles, 6);
  }, [collectibles]);

  // Get expiring soon collectibles
  const expiringSoon = useMemo(() => {
    return trendingService.getExpiringSoonCollectibles(collectibles, 3);
  }, [collectibles]);

  // Get low supply collectibles
  const lowSupply = useMemo(() => {
    return trendingService.getLowSupplyCollectibles(collectibles, 3);
  }, [collectibles]);

  // Format claim velocity for display
  const formatClaimVelocity = (velocity: number): string => {
    // Denormalize from 0-1 scale (assuming 10 claims/hour is max)
    const claimsPerHour = velocity * 10;
    
    if (claimsPerHour < 0.1) {
      return 'Low activity';
    } else if (claimsPerHour < 1) {
      return `${(claimsPerHour * 60).toFixed(0)} claims/hour`;
    } else if (claimsPerHour < 10) {
      return `${claimsPerHour.toFixed(1)} claims/hour`;
    } else {
      return 'Very high activity';
    }
  };

  // Format time remaining
  const formatTimeRemaining = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h left`;
    } else if (hours > 0) {
      return `${hours}h left`;
    } else {
      const minutes = Math.floor(remaining / 60);
      return `${minutes}m left`;
    }
  };

  if (trendingCollectibles.length === 0 && expiringSoon.length === 0 && lowSupply.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Hot & Trending Section */}
      {trendingCollectibles.length > 0 && (
        <Card className="border-orange-500/50 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Hot & Trending
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 dark:text-orange-400">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {trendingCollectibles.length} trending
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Most popular collectibles right now
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/collectibles?sort=popularity')}
                className="gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingCollectibles.map(({ trendingScore, ...collectible }) => (
                <div key={collectible.templateId} className="relative">
                  {/* Trending Badge Overlay */}
                  <div className="absolute top-2 right-2 z-10">
                    <Badge 
                      variant="default" 
                      className="bg-orange-500 hover:bg-orange-600 shadow-lg gap-1"
                    >
                      <Flame className="w-3 h-3" />
                      Hot
                    </Badge>
                  </div>
                  
                  <CollectibleCard
                    template={collectible}
                    claimStatus={claimStatus?.get(collectible.templateId)}
                    onClick={() => onCollectibleClick?.(collectible)}
                    onClaim={() => onCollectibleClick?.(collectible)}
                  />
                  
                  {/* Claim Velocity Indicator */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-orange-500" />
                    <span>{formatClaimVelocity(trendingScore.claimVelocity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon Section */}
      {expiringSoon.length > 0 && (
        <Card className="border-red-500/50 bg-gradient-to-br from-red-500/5 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Clock className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Expiring Soon
                    <Badge variant="secondary" className="bg-red-500/20 text-red-700 dark:text-red-400">
                      <Timer className="w-3 h-3 mr-1" />
                      {expiringSoon.length} ending
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Claim these before time runs out
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/collectibles?sort=expiration')}
                className="gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiringSoon.map(({ trendingScore, ...collectible }) => (
                <div key={collectible.templateId} className="relative">
                  {/* Expiring Badge Overlay */}
                  <div className="absolute top-2 right-2 z-10">
                    <Badge 
                      variant="destructive" 
                      className="shadow-lg gap-1 animate-pulse"
                    >
                      <Clock className="w-3 h-3" />
                      {formatTimeRemaining(collectible.endTime)}
                    </Badge>
                  </div>
                  
                  <CollectibleCard
                    template={collectible}
                    claimStatus={claimStatus?.get(collectible.templateId)}
                    onClick={() => onCollectibleClick?.(collectible)}
                    onClaim={() => onCollectibleClick?.(collectible)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Supply Section */}
      {lowSupply.length > 0 && (
        <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <AlertCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Nearly Sold Out
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-400">
                      {lowSupply.length} limited
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Limited supply remaining - claim now
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/collectibles?sort=supply')}
                className="gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowSupply.map(({ trendingScore, ...collectible }) => {
                const remaining = collectible.maxSupply - collectible.currentSupply;
                const percentage = (remaining / collectible.maxSupply) * 100;
                
                return (
                  <div key={collectible.templateId} className="relative">
                    {/* Low Supply Badge Overlay */}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge 
                        variant="secondary" 
                        className="bg-purple-500/90 text-white shadow-lg gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {remaining} left
                      </Badge>
                    </div>
                    
                    <CollectibleCard
                      template={collectible}
                      claimStatus={claimStatus?.get(collectible.templateId)}
                      onClick={() => onCollectibleClick?.(collectible)}
                      onClaim={() => onCollectibleClick?.(collectible)}
                    />
                    
                    {/* Supply Percentage */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${100 - percentage}%` }}
                        />
                      </div>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {percentage.toFixed(0)}% left
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
