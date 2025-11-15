// hooks/useCollectibles.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { supabase } from '../lib/supabase';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import type { Collectible } from '../types/collectible';

async function fetchCollectiblesData(publicClient: any, profileId?: bigint | null) {
  // Fetch collectibles from Supabase
  const { data, error } = await supabase
    .from('collectibles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collectibles:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Enrich with on-chain data
  const enrichedCollectibles = await Promise.all(
    data.map(async (item) => {
      try {
        const templateId = BigInt(item.template_id);
        
        // Fetch template data from contract
        const templateData = await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'templates',
          args: [templateId],
        }) as [Address, bigint, bigint, number, bigint, bigint, boolean];

        const [issuer, maxSupply, currentSupply, tier, startTime, endTime, isPaused] = templateData;

        // Check if user has claimed (if profileId provided)
        let hasClaimed = false;
        if (profileId) {
          hasClaimed = await publicClient.readContract({
            address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
            abi: ReputationCardABI,
            functionName: 'hasProfileClaimed',
            args: [templateId, profileId],
          }) as boolean;
        }

        // Check if collectible is currently claimable
        const now = BigInt(Math.floor(Date.now() / 1000));
        const hasStarted = startTime === 0n || now >= startTime;
        const hasNotEnded = endTime === 0n || now <= endTime;
        const isClaimable = hasStarted && hasNotEnded && !isPaused && currentSupply < maxSupply;

        return {
          id: item.id,
          templateId,
          title: item.title,
          description: item.description,
          imageUrl: item.image_url,
          bannerUrl: item.banner_url,
          tokenUri: item.token_uri,
          claimType: item.claim_type,
          requirements: item.requirements || {},
          createdBy: item.created_by as Address,
          isActive: item.is_active,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          tier,
          maxSupply,
          currentSupply,
          hasClaimed,
          isClaimable,
        } as Collectible & { isClaimable?: boolean };
      } catch (err) {
        console.error(`Error enriching collectible ${item.id}:`, err);
        return null;
      }
    })
  );

  return enrichedCollectibles.filter((c): c is Collectible & { isClaimable?: boolean } => c !== null);
}

export function useCollectibles(profileId?: bigint | null) {
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['collectibles', profileId?.toString()],
    queryFn: () => fetchCollectiblesData(publicClient!, profileId),
    enabled: !!publicClient,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const refreshCollectibles = async () => {
    await queryClient.invalidateQueries({ queryKey: ['collectibles'] });
    await refetch();
  };

  return {
    collectibles: data || [],
    loading: isLoading,
    error: error as Error | null,
    refreshCollectibles,
  };
}
