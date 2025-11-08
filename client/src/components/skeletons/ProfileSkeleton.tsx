import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Banner Skeleton */}
      <Skeleton className="h-80 w-full rounded-none" />

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        {/* Avatar and Name Row */}
        <div className="flex items-center gap-3 py-4 min-w-0">
          {/* Avatar Skeleton */}
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />

          {/* Name and Actions */}
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32" />
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-9 h-9 rounded-md" />
              <Skeleton className="w-9 h-9 rounded-md" />
              <Skeleton className="w-9 h-9 rounded-md" />
            </div>
          </div>
        </div>

        {/* Bio Skeleton */}
        <div className="mt-4 max-w-lg space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Social Links Skeleton */}
        <div className="mt-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-9 w-16" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-9 w-12" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-7 w-24" />
          </Card>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-6 w-20 mb-4" />
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-16 w-full mb-3 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full rounded" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
