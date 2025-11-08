import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Shield } from 'lucide-react';
import type { ReputationCard } from '@/types/reputationCard';

interface ReputationCardDisplayProps {
  card: ReputationCard;
  isLoading?: boolean;
  onClick?: () => void;
}

export function ReputationCardDisplay({ card, isLoading, onClick }: ReputationCardDisplayProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      education: 'bg-blue-500',
      professional: 'bg-purple-500',
      achievement: 'bg-green-500',
      community: 'bg-pink-500',
    };
    return colors[category.toLowerCase()] || 'bg-gray-500';
  };

  const getImageUrl = (imageUri?: string) => {
    if (!imageUri) return null;
    
    if (imageUri.startsWith('ipfs://')) {
      const hash = imageUri.replace('ipfs://', '');
      const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';
      return `https://${gateway}/ipfs/${hash}`;
    }
    
    return imageUri;
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  const imageUrl = getImageUrl(card.metadata?.image);
  const title = card.metadata?.title || card.description || 'Untitled Card';
  const description = card.metadata?.description || card.description;

  return (
    <Card 
      onClick={onClick}
      className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
        !card.isValid ? 'opacity-60' : ''
      }`}
    >
      {/* Card Image */}
      {imageUrl ? (
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Overlay info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className={`${getCategoryColor(card.category)} text-white text-xs`}>
                {card.metadata?.category || card.category}
              </Badge>
              {!card.isValid && (
                <Badge variant="destructive" className="text-xs">Revoked</Badge>
              )}
            </div>
            <h3 className="font-bold text-white text-lg line-clamp-2 mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-1 text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">+{card.value} Reputation</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-purple-500/20 flex flex-col items-center justify-center p-4">
          <Shield className="w-16 h-16 text-primary/50 mb-4" />
          <div className="text-center">
            <Badge className={`${getCategoryColor(card.category)} text-white text-xs mb-2`}>
              {card.metadata?.category || card.category}
            </Badge>
            <h3 className="font-bold text-lg line-clamp-2 mb-2">
              {title}
            </h3>
            <div className="flex items-center gap-1 justify-center text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">+{card.value}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
}

export function ReputationCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}
