/**
 * SupplyIndicator - Display component for collectible supply status
 * Shows claimed/total with progress bar and visual indicators
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Infinity } from 'lucide-react';

interface SupplyIndicatorProps {
  currentSupply: number;
  maxSupply: number;
  showProgressBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SupplyIndicator({
  currentSupply,
  maxSupply,
  showProgressBar = true,
  size = 'md',
}: SupplyIndicatorProps) {
  const isUnlimited = maxSupply === 0;
  const remaining: number = isUnlimited ? Number.POSITIVE_INFINITY : maxSupply - currentSupply;
  const percentage = isUnlimited ? 0 : (currentSupply / maxSupply) * 100;

  // Determine color based on remaining supply
  const getSupplyColor = () => {
    if (isUnlimited) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 70) return 'text-orange-600 dark:text-orange-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="space-y-2">
      {/* Supply Text */}
      <div className={cn('flex items-center justify-between', textSizes[size])}>
        <span className="text-muted-foreground font-medium">Supply:</span>
        <span className={cn('font-semibold', getSupplyColor())}>
          {isUnlimited ? (
            <span className="flex items-center gap-1">
              <Infinity className="w-4 h-4" />
              Unlimited
            </span>
          ) : (
            `${currentSupply} / ${maxSupply}`
          )}
        </span>
      </div>

      {/* Progress Bar */}
      {showProgressBar && !isUnlimited && (
        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'absolute top-0 left-0 h-full transition-all duration-300',
              getProgressBarColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Limited Edition Badge */}
      {!isUnlimited && maxSupply <= 100 && (
        <Badge variant="secondary" className="text-xs">
          Limited Edition
        </Badge>
      )}

      {/* Remaining Count */}
      {!isUnlimited && remaining <= 10 && remaining > 0 && (
        <div className="text-xs text-destructive font-medium">
          Only {remaining} remaining!
        </div>
      )}

      {!isUnlimited && remaining === 0 && (
        <div className="text-xs text-destructive font-medium">
          Sold Out
        </div>
      )}
    </div>
  );
}
