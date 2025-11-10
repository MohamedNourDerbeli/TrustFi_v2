import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search as SearchIcon, User, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { profileService, type OffChainProfile } from '@/services/profileService';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OffChainProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const searchProfiles = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const profiles = await profileService.searchProfiles(query);
        setResults(profiles);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const getProfileUrl = (profile: OffChainProfile) => {
    return profile.username ? `/${profile.username}` : `/${profile.address}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Profiles</h1>
          <p className="text-muted-foreground">
            Find users by username, name, or wallet address
          </p>
        </div>
        
        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username, name, or address..."
            className="pl-10 text-lg h-12"
            autoFocus
          />
        </div>

        {isSearching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {!isSearching && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Found {results.length} {results.length === 1 ? 'profile' : 'profiles'}
            </p>
            {results.map((profile) => (
              <Card
                key={profile.address}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setLocation(getProfileUrl(profile))}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {profile.display_name || profile.username || 'Anonymous User'}
                      </h3>
                      {profile.visibility === 'public' && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    
                    {profile.username && (
                      <p className="text-sm text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {query.length >= 2 && !isSearching && results.length === 0 && (
          <Card className="p-8 text-center">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground">
              Try searching with a different username, name, or address
            </p>
          </Card>
        )}

        {query.length < 2 && !isSearching && (
          <Card className="p-8 text-center">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter at least 2 characters to search for profiles
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
