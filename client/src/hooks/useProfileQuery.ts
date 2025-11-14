// hooks/useProfileQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTABI from '../lib/ProfileNFT.abi.json';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import { supabase, type ProfileRow } from '../lib/supabase';
import { uploadToPinata } from '../lib/pinata';
import type { Profile, ProfileMetadata } from '../types/profile';
import type { Card } from '../types/card';
import { queryKeys } from '../lib/queryClient';

// Fetch profile ID from contract
async function fetchProfileId(address: Address, publicClient: any): Promise<bigint> {
  const profileId = await publicClient.readContract({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'addressToProfileId',
    args: [address],
  }) as bigint;
  
  return profileId;
}

// Fetch profile score from contract
async function fetchProfileScore(profileId: bigint, publicClient: any): Promise<bigint> {
  const score = await publicClient.readContract({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'profileIdToScore',
    args: [profileId],
  }) as bigint;
  
  return score;
}

// Fetch cards for profile
async function fetchProfileCards(profileId: bigint, publicClient: any): Promise<Card[]> {
  const cardsResult = await publicClient.readContract({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'getCardsForProfile',
    args: [profileId],
  }) as bigint[];

  const cardDetails = await Promise.all(
    cardsResult.map(async (cardId) => {
      try {
        const tokenUri = await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as `0x${string}`,
          abi: ReputationCardABI,
          functionName: 'tokenURI',
          args: [cardId],
        }) as string;

        return {
          cardId,
          templateId: 0n,
          profileId,
          tokenUri,
          tier: 0,
          issuer: '0x0000000000000000000000000000000000000000' as Address,
          claimedAt: new Date(),
        } as Card;
      } catch (err) {
        console.error(`Error fetching card ${cardId}:`, err);
        return null;
      }
    })
  );

  return cardDetails.filter((card): card is Card => card !== null);
}

// Fetch complete profile data
async function fetchProfile(address: Address, publicClient: any): Promise<Profile | null> {
  const profileId = await fetchProfileId(address, publicClient);
  
  if (profileId === 0n) {
    return null;
  }

  const [score, cards] = await Promise.all([
    fetchProfileScore(profileId, publicClient),
    fetchProfileCards(profileId, publicClient),
  ]);

  // Fetch profile metadata from Supabase
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet', address.toLowerCase())
    .single();

  if (profileData) {
    const profileRow = profileData as ProfileRow;
    return {
      id: profileRow.id,
      wallet: address,
      profileId,
      tokenUri: profileRow.token_uri,
      displayName: profileRow.display_name || undefined,
      bio: profileRow.bio || undefined,
      avatarUrl: profileRow.avatar_url || undefined,
      bannerUrl: profileRow.banner_url || undefined,
      twitterHandle: profileRow.twitter_handle || undefined,
      discordHandle: profileRow.discord_handle || undefined,
      websiteUrl: profileRow.website_url || undefined,
      score,
      cards,
      createdAt: new Date(profileRow.created_at),
    };
  }

  return {
    id: '',
    wallet: address,
    profileId,
    tokenUri: '',
    score,
    cards,
    createdAt: new Date(),
  };
}

// Hook for profile data with React Query
export function useProfileQuery(walletAddress?: Address) {
  const { address: connectedAddress } = useAccount();
  const address = walletAddress || connectedAddress;
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  // Query for complete profile
  const profileQuery = useQuery({
    queryKey: queryKeys.profile(address),
    queryFn: () => fetchProfile(address!, publicClient),
    enabled: !!address && !!publicClient,
    staleTime: 1000 * 60 * 2, // 2 minutes for profile data
  });

  // Query for profile score (can be refetched independently)
  const scoreQuery = useQuery({
    queryKey: queryKeys.profileScore(profileQuery.data?.profileId),
    queryFn: () => fetchProfileScore(profileQuery.data!.profileId, publicClient),
    enabled: !!profileQuery.data?.profileId && !!publicClient,
    staleTime: 1000 * 30, // 30 seconds for score (more volatile)
  });

  // Mutation for updating profile metadata
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: ProfileMetadata) => {
      if (!address || !profileQuery.data?.profileId) {
        throw new Error('Profile not found');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          bio: updates.bio,
          avatar_url: updates.avatarUrl,
          banner_url: updates.bannerUrl,
          twitter_handle: updates.twitterHandle,
          discord_handle: updates.discordHandle,
          website_url: updates.websiteUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet', address.toLowerCase());

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return updates;
    },
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(address) });
    },
  });

  // Mutation for uploading avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return await uploadToPinata(file);
    },
  });

  // Mutation for uploading banner
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      return await uploadToPinata(file);
    },
  });

  return {
    profile: profileQuery.data,
    profileId: profileQuery.data?.profileId || null,
    score: scoreQuery.data || profileQuery.data?.score || 0n,
    cards: profileQuery.data?.cards || [],
    loading: profileQuery.isLoading || scoreQuery.isLoading,
    error: profileQuery.error || scoreQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    uploadBanner: uploadBannerMutation.mutateAsync,
    refreshProfile: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(address) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileScore(profileQuery.data?.profileId) });
    },
    refetchScore: () => scoreQuery.refetch(),
  };
}
