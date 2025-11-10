import { useQuery } from '@tanstack/react-query';
import { contractService } from '@/services/contractService';
import { reputationCardService } from '@/services/reputationCardService';
import type { ethers } from 'ethers';

export function useOnChainProfile(address: string | undefined, provider: ethers.BrowserProvider | null) {
  return useQuery({
    queryKey: ['profile', 'onchain', address?.toLowerCase()],
    queryFn: async () => {
      if (!address || !provider) return null;

      // Initialize services if needed
      if (!contractService.isInitialized()) {
        await contractService.initialize(provider);
      }
      if (!reputationCardService.isInitialized()) {
        await reputationCardService.initialize(provider);
      }

      try {
        const profile = await contractService.getProfileByOwner(address);
        const isIssuer = await reputationCardService.isAuthorizedIssuer(address);

        return {
          tokenId: profile.tokenId.toString(),
          hasProfile: true,
          isAdmin: isIssuer,
          isIssuer: isIssuer,
          reputationScore: profile.reputationScore,
          createdAt: profile.createdAt,
          lastUpdated: profile.lastUpdated,
          isActive: profile.isActive,
        };
      } catch (error: any) {
        // No profile found - this is normal for new users
        return {
          tokenId: '',
          hasProfile: false,
          isAdmin: false,
          isIssuer: false,
        };
      }
    },
    enabled: !!address && !!provider,
    staleTime: 60000, // 1 minute for blockchain data
  });
}

export function useReputationScore(tokenId: number | undefined, provider: ethers.BrowserProvider | null) {
  return useQuery({
    queryKey: ['reputation', 'score', tokenId],
    queryFn: async () => {
      if (!tokenId || !provider) return 0;

      if (!reputationCardService.isInitialized()) {
        await reputationCardService.initialize(provider);
      }

      return reputationCardService.calculateReputationScore(tokenId);
    },
    enabled: !!tokenId && !!provider,
    staleTime: 60000,
  });
}

export function useProfileCards(tokenId: number | undefined, provider: ethers.BrowserProvider | null) {
  return useQuery({
    queryKey: ['profile', 'cards', tokenId],
    queryFn: async () => {
      if (!tokenId || !provider) return [];

      if (!reputationCardService.isInitialized()) {
        await reputationCardService.initialize(provider);
      }

      const cardIds = await reputationCardService.getProfileCards(tokenId);
      
      // Fetch full card data for each ID
      const cardDataPromises = cardIds.map(async (cardId) => {
        try {
          const card = await reputationCardService.getCard(cardId);
          return {
            id: cardId,
            ...card
          };
        } catch (err) {
          console.error(`Failed to load card ${cardId}:`, err);
          return null;
        }
      });
      
      const cards = (await Promise.all(cardDataPromises)).filter(card => card !== null);
      return cards;
    },
    enabled: !!tokenId && !!provider,
    staleTime: 60000,
  });
}
