import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Eye, User } from 'lucide-react';
import { profileService, type OffChainProfile } from '@/services/profileService';

interface TrendingProfilesProps {
  limit?: number;
  showTitle?: boolean;
}

export default function TrendingProfiles({ limit = 5, showTitle = true }: TrendingProfilesProps) {
  const [profiles, setProfiles] = useState<OffChainProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrendingProfiles() {
      try {
        setIsLoading(true);
        const data = await profileService.getTrendingProfiles(limit);
        setProfiles(data);
      } catch (err: any) {
        console.error('Error loading trending profiles:', err);
        setError(err.message || 'Failed to load trending profiles');
      } finally {
        setIsLoading(false);
      }
    }

    loadTrendingProfiles();
  }, [limit]);

  const getProfileUrl = (profile: OffChainProfile) => {
    return profile.username ? `/${profile.username}` : `/${profile.address}`;
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (error) {
    return null; // Silently fail - trending is not critical
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Trending Profiles</h3>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return null; // Don't show if no trending profiles
  }

  return (
    <Card className="p-6">
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Trending Profiles</h3>
        </div>
      )}
      <div className="space-y-3">
        {profiles.map((profile, index) => (
          <Link key={profile.address} href={getProfileUrl(profile)}>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-6 text-center">
                <span className="text-sm font-bold text-muted-foreground">
                  #{index + 1}
                </span>
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                <AvatarImage src={profile.avatar} alt={profile.display_name || profile.username} />
                <AvatarFallback>
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {profile.display_name || profile.username || formatAddress(profile.address)}
                  </p>
                  {profile.username && (
                    <Badge variant="secondary" className="text-xs">
                      @{profile.username}
                    </Badge>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* View Count */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {/* Profile views would come from the API if available */}
                  {/* For now, we can show a placeholder or omit */}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function TrendingProfilesSkeleton({ limit = 5 }: { limit?: number }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-6 h-4" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
