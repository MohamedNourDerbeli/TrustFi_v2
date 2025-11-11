/**
 * Example implementations using the contract data fetching infrastructure
 * These examples demonstrate proper usage patterns for the hooks and utilities
 */

import { useContractData, useAuthenticatedContractData, useProfileContractData } from './index';
import { contractService } from '@/services/contractService';
import { reputationCardService } from '@/services/reputationCardService';
import { collectibleContractService } from '@/services/collectibleContractService';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Example 1: Basic contract data fetching
 * Fetches profile data with loading and error states
 */
export function ProfileDataExample() {
  const tokenId = 1;
  
  const { data: profile, loading, error, refetch } = useContractData(
    async () => {
      return await contractService.getProfile(tokenId);
    },
    [tokenId],
    {
      enabled: !!tokenId,
      onSuccess: (data) => {
        console.log('Profile loaded successfully:', data);
      },
      onError: (error) => {
        console.error('Failed to load profile:', error.userMessage);
      }
    }
  );

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.userMessage}</p>
        {error.retryable && (
          <button onClick={refetch}>
            {error.action === 'retry' ? 'Retry' : 'Reconnect'}
          </button>
        )}
      </div>
    );
  }

  if (!profile) {
    return <div>No profile found</div>;
  }

  return (
    <div>
      <h2>Profile #{profile.tokenId}</h2>
      <p>Reputation Score: {profile.reputationScore}</p>
      <p>Created: {new Date(profile.createdAt * 1000).toLocaleDateString()}</p>
    </div>
  );
}

/**
 * Example 2: Authenticated contract data
 * Requires wallet connection before fetching
 */
export function UserCardsExample() {
  const { userProfile } = useWallet();
  const { toast } = useToast();
  
  const { data: cards, loading, error, refetch } = useAuthenticatedContractData(
    async () => {
      if (!userProfile?.tokenId) return [];
      
      const cardIds = await reputationCardService.getProfileCards(
        Number(userProfile.tokenId)
      );
      
      // Fetch full card data
      const cardData = await Promise.all(
        cardIds.map(id => reputationCardService.getCard(id))
      );
      
      return cardData;
    },
    [userProfile?.tokenId],
    {
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      staleTime: 60 * 1000,      // Stale after 1 minute
      onError: (error) => {
        toast({
          title: 'Error loading cards',
          description: error.userMessage,
          variant: 'destructive'
        });
      }
    }
  );

  if (loading) {
    return <div>Loading your reputation cards...</div>;
  }

  if (error) {
    return (
      <div>
        <p>{error.userMessage}</p>
        {error.retryable && (
          <button onClick={refetch}>Try Again</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Your Reputation Cards ({cards?.length || 0})</h2>
      {cards?.map((_card, index) => (
        <div key={index}>
          <p>Card #{index + 1}</p>
          {/* Render card details */}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 3: Profile-required contract data
 * Requires both wallet connection and on-chain profile
 */
export function EligibleCollectiblesExample() {
  const { address, userProfile } = useWallet();
  
  const { data: collectibles, loading, error, refetch, isStale } = useProfileContractData(
    async () => {
      if (!address) return [];
      
      // Get all active collectibles
      const allCollectibles = await collectibleContractService.getActiveCollectibles();
      
      // Check eligibility for each
      const eligibilityChecks = await Promise.all(
        allCollectibles.map(async (collectible) => {
          try {
            const status = await collectibleContractService.checkEligibility(
              collectible.templateId,
              address
            );
            return { collectible, eligible: status.isEligible };
          } catch {
            return { collectible, eligible: false };
          }
        })
      );
      
      // Filter to only eligible ones
      return eligibilityChecks
        .filter(item => item.eligible)
        .map(item => item.collectible);
    },
    [address],
    {
      cacheTime: 2 * 60 * 1000, // Cache for 2 minutes
      staleTime: 30 * 1000,      // Stale after 30 seconds
      retryOptions: {
        maxRetries: 2,
        initialDelay: 500
      }
    }
  );

  if (!userProfile?.hasProfile) {
    return <div>Please create a profile to view eligible collectibles</div>;
  }

  if (loading) {
    return <div>Checking eligibility...</div>;
  }

  if (error) {
    return (
      <div>
        <p>{error.userMessage}</p>
        {error.retryable && (
          <button onClick={refetch}>Retry</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Eligible Collectibles ({collectibles?.length || 0})</h2>
        {isStale && (
          <button onClick={refetch}>Refresh</button>
        )}
      </div>
      {collectibles?.map((collectible) => (
        <div key={collectible.templateId}>
          <p>{collectible.category}</p>
          {/* Render collectible details */}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 4: Multiple parallel fetches
 * Demonstrates fetching multiple independent data sources
 */
export function DashboardStatsExample() {
  const { userProfile } = useWallet();
  
  // Fetch reputation score
  const { data: score, loading: scoreLoading } = useProfileContractData(
    async () => {
      if (!userProfile?.tokenId) return 0;
      return await reputationCardService.calculateReputationScore(
        Number(userProfile.tokenId)
      );
    },
    [userProfile?.tokenId]
  );
  
  // Fetch card count
  const { data: cardCount, loading: cardsLoading } = useProfileContractData(
    async () => {
      if (!userProfile?.tokenId) return 0;
      const cardIds = await reputationCardService.getProfileCards(
        Number(userProfile.tokenId)
      );
      return cardIds.length;
    },
    [userProfile?.tokenId]
  );
  
  // Fetch collectibles count
  const { data: collectiblesCount, loading: collectiblesLoading } = useAuthenticatedContractData(
    async () => {
      const collectibles = await collectibleContractService.getActiveCollectibles();
      return collectibles.length;
    },
    []
  );

  const loading = scoreLoading || cardsLoading || collectiblesLoading;

  if (loading) {
    return <div>Loading dashboard stats...</div>;
  }

  return (
    <div>
      <h2>Dashboard Statistics</h2>
      <div>
        <div>Reputation Score: {score || 0}</div>
        <div>Total Cards: {cardCount || 0}</div>
        <div>Available Collectibles: {collectiblesCount || 0}</div>
      </div>
    </div>
  );
}

/**
 * Example 5: Manual refetch with custom retry logic
 * Demonstrates manual control over fetching
 */
export function ManualFetchExample() {
  const { address } = useWallet();
  const { toast } = useToast();
  
  const { data, loading, error, refetch, reset } = useContractData(
    async () => {
      if (!address) throw new Error('No address');
      return await contractService.getProfileByOwner(address);
    },
    [address],
    {
      enabled: false, // Don't auto-fetch
      retryOptions: {
        maxRetries: 5,
        initialDelay: 2000,
        onRetry: (attempt) => {
          toast({
            title: `Retrying... (${attempt}/5)`,
            description: 'Please wait while we fetch your profile'
          });
        }
      },
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Profile loaded successfully'
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.userMessage,
          variant: 'destructive'
        });
      }
    }
  );

  return (
    <div>
      <button onClick={() => refetch()} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Profile'}
      </button>
      <button onClick={reset} disabled={loading}>
        Reset
      </button>
      
      {error && (
        <div>
          <p>Error: {error.userMessage}</p>
          <p>Type: {error.type}</p>
          <p>Retryable: {error.retryable ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      {data && (
        <div>
          <h3>Profile Data</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
