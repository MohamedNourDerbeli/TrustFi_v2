/**
 * RarityIndicator - Display component for collectible rarity tier
 * Shows rarity name with color-coded styling
 */

import { Badge } from '@/components/ui/badge';
import { RarityTier } from '@/types/collectible';
import { cn } from '@/lib/utils';
import { Sparkles, Star, Gem, Crown, Zap } from 'lucide-react';

interface RarityIndicatorProps {
  rarity: RarityTier;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Rarity names
const rarityNames: Record<RarityTier, string> = {
  [RarityTier.COMMON]: 'Common',
  [RarityTier.UNCOMMON]: 'Uncommon',
  [RarityTier.RARE]: 'Rare',
  [RarityTier.EPIC]: 'Epic',
  [RarityTier.LEGENDARY]: 'Legendary',
};

// Rarity colors
const rarityColors: Record<RarityTier, string> = {
  [RarityTier.COMMON]: 'bg-gray-500 text-white border-gray-600',
  [RarityTier.UNCOMMON]: 'bg-green-600 text-white border-green-700',
  [RarityTier.RARE]: 'bg-blue-600 text-white border-blue-700',
  [RarityTier.EPIC]: 'bg-purple-600 text-white border-purple-700',
  [RarityTier.LEGENDARY]: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-700',
};

// Rarity icons
const rarityIcons: Record<RarityTier, React.ComponentType<{ className?: string }>> = {
  [RarityTier.COMMON]: Sparkles,
  [RarityTier.UNCOMMON]: Star,
  [RarityTier.RARE]: Gem,
  [RarityTier.EPIC]: Zap,
  [RarityTier.LEGENDARY]: Crown,
};

export function RarityIndicator({
  rarity,
  showIcon = true,
  size = 'md',
}: RarityIndicatorProps) {
  const Icon = rarityIcons[rarity];
  
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

  return (
    <Badge
      className={cn(
        'font-semibold border-2 shadow-md',
        rarityColors[rarity],
        sizeClasses[size],
        showIcon && 'gap-1'
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {rarityNames[rarity]}
    </Badge>
  );
}
