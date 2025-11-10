/**
 * CollectibleNotification component
 * Displays a single notification for a new eligible collectible
 * Task 16.3: Create CollectibleNotification component
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { X, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { collectibleNotificationService } from '@/services/collectibleNotificationService';
import { RarityIndicator } from '@/components/shared/RarityIndicator';
import { TimeRemainingBadge } from '@/components/shared/TimeRemainingBadge';
import type { CollectibleNotification as NotificationType } from '@/services/collectibleNotificationService';

interface CollectibleNotificationProps {
  notification: NotificationType;
  onClose?: () => void;
}

export default function CollectibleNotification({
  notification,
  onClose,
}: CollectibleNotificationProps) {
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const { collectible, eligibilityReason, isRead, isNew } = notification;

  const handleView = () => {
    // Mark as read
    collectibleNotificationService.markAsRead(notification.templateId);
    
    // Navigate to collectibles gallery with this collectible highlighted
    setLocation(`/collectibles?highlight=${collectible.templateId}`);
    
    // Close the popover
    onClose?.();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    collectibleNotificationService.dismissNotification(notification.templateId);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={cn(
        'relative p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        !isRead && 'bg-primary/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleView}
    >
      {/* New indicator */}
      {isNew && (
        <div className="absolute top-2 left-2">
          <Badge variant="default" className="text-xs px-1.5 py-0.5">
            New
          </Badge>
        </div>
      )}

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute top-2 right-2 h-6 w-6 opacity-0 transition-opacity',
          isHovered && 'opacity-100'
        )}
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-semibold text-sm truncate',
              !isRead && 'text-primary'
            )}>
              {collectible.category}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {collectible.description}
            </p>
          </div>
        </div>

        {/* Rarity and Time */}
        <div className="flex items-center gap-2 flex-wrap">
          <RarityIndicator rarity={collectible.rarityTier} size="sm" />
          {(collectible.startTime > 0 || collectible.endTime > 0) && (
            <TimeRemainingBadge
              startTime={collectible.startTime}
              endTime={collectible.endTime}
              size="sm"
            />
          )}
        </div>

        {/* Eligibility reason */}
        <div className="text-xs text-muted-foreground">
          {eligibilityReason}
        </div>

        {/* Supply info if limited */}
        {collectible.maxSupply > 0 && (
          <div className="text-xs">
            <span className="text-muted-foreground">Supply: </span>
            <span className="font-medium">
              {collectible.currentSupply} / {collectible.maxSupply} claimed
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(notification.timestamp)}
          </span>
          
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs"
            onClick={handleView}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}
