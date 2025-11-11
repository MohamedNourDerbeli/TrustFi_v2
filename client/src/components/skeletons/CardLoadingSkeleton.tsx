import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CardLoadingSkeletonProps {
  count?: number;
  layout?: 'grid' | 'list';
  variant?: 'credential' | 'collectible';
}

export function CardLoadingSkeleton({ 
  count = 3, 
  layout = 'grid',
  variant = 'credential'
}: CardLoadingSkeletonProps) {
  const cards = Array.from({ length: count }, (_, i) => i);

  if (layout === 'list') {
    return (
      <div className="space-y-4">
        {cards.map((i) => (
          <CardSkeletonItem key={i} variant={variant} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((i) => (
        <CardSkeletonItem key={i} variant={variant} />
      ))}
    </div>
  );
}

function CardSkeletonItem({ variant }: { variant: 'credential' | 'collectible' }) {
  if (variant === 'collectible') {
    return (
      <Card className="p-6 border-2">
        {/* Image placeholder */}
        <Skeleton className="w-full aspect-square rounded-lg mb-4" />
        
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Title */}
        <Skeleton className="h-6 w-full mb-2" />
        
        {/* Description */}
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-4" />

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Action Button */}
        <Skeleton className="h-10 w-full mt-4" />
      </Card>
    );
  }

  // Credential card variant
  return (
    <Card className="p-6 border-2">
      {/* Header with badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-full mb-2" />

      {/* Description */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />

      {/* Footer info */}
      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}
