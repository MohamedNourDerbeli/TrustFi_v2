/**
 * MintingModeBadge - Display component for showing how a reputation card was minted
 * Shows "Awarded" for direct minting or "Claimed" for collectible minting
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MintingMode } from '@/types/collectible';
import { cn } from '@/lib/utils';
import { Award, Hand } from 'lucide-react';

interface MintingModeBadgeProps {
  mintingMode: MintingMode;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
}

export function MintingModeBadge({
  mintingMode,
  size = 'md',
  showIcon = true,
  showTooltip = true,
}: MintingModeBadgeProps) {
  const isDirect = mintingMode === MintingMode.DIRECT;

  const config = {
    label: isDirect ? 'Awarded' : 'Claimed',
    icon: isDirect ? Award : Hand,
    className: isDirect
      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
      : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    tooltip: isDirect
      ? 'This card was directly awarded to you by the issuer'
      : 'You claimed this collectible card yourself',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const Icon = config.icon;

  const badge = (
    <Badge
      className={cn(
        'font-semibold border shadow-sm',
        config.className,
        sizeClasses[size],
        showIcon && 'gap-1'
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
