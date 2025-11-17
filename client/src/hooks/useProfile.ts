// hooks/useProfile.ts - React Query implementation
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTABI from '../lib/ProfileNFT.abi.json';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import { supabase, type ProfileRow } from '../lib/supabase';
import type { Profile } from '../types/profile';
import type { Card } from '../types/card';
import { logger } from '../lib/logger';
import { CACHE_TIMES } from '../lib/constants';

export interface UseProfileReturn {
  profile: Profile | null;
  profileId: bigint | null;
  score: bigint;
  cards: Card[];
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (metadata: Partial<Profile>) => Promise<void>;
}

async function fetchProfileData(address: Address, publicClient: any) {
  // Fetch profileId from contract
  const profileIdResult = await publicClient.readContract({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'addressToProfileId',
    args: [address],
  }) as bigint;

  // If profileId is 0, user doesn't have a profile
  if (profileIdResult === 0n) {
    return { profile: null, profileId: null, score: 0n, cards: [] };
  }

  // Fetch score from contract
  const scoreResult = await publicClient.readContract({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'profileIdToScore',
    args: [profileIdResult],
  }) as bigint;

  // Fetch card details directly from ReputationCard contract
  const cards: Card[] = [];
  
  try {
    const [cardIds, templateIds, tiers, issuers] = await publicClient.readContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as `0x${string}`,
      abi: ReputationCardABI,
      functionName: 'getCardsDetailForProfile',
      args: [profileIdResult],
    }) as [bigint[], bigint[], number[], Address[]];

    logger.debug('[useProfile] Cards from contract:', { cardIds, templateIds, tiers, issuers });

    for (let i = 0; i < cardIds.length; i++) {
      cards.push({
        cardId: cardIds[i],
        profileId: profileIdResult,
        templateId: templateIds[i],
        tokenUri: '', // Fetched on-demand in CardDisplay component
        tier: tiers[i],
        issuer: issuers[i],
        claimedAt: new Date(), // Could be fetched from claims_log if needed
      });
    }
  } catch (error) {
    console.error('[useProfile] Error fetching cards:', error);
  }
  
  logger.debug('[useProfile] Final cards array:', cards);

  // Fetch profile metadata from Supabase
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet', address.toLowerCase())
    .maybeSingle();

  let profile: Profile | null = null;
  if (profileData) {
    const profileRow = profileData as ProfileRow;
    profile = {
      id: profileRow.id,
      wallet: address,
      profileId: profileIdResult,
      tokenUri: profileRow.token_uri,
      displayName: profileRow.display_name || undefined,
      username: profileRow.username || undefined,
      bio: profileRow.bio || undefined,
      avatarUrl: profileRow.avatar_url || undefined,
      bannerUrl: profileRow.banner_url || undefined,
      twitterHandle: profileRow.twitter_handle || undefined,
      discordHandle: profileRow.discord_handle || undefined,
      websiteUrl: profileRow.website_url || undefined,
      score: scoreResult,
      cards: cards,
      createdAt: new Date(profileRow.created_at),
    };
  }

  return {
    profile,
    profileId: profileIdResult,
    score: scoreResult,
    cards: cards,
  };
}

export function useProfile(walletAddress?: Address): UseProfileReturn {
  const { address: connectedAddress } = useAccount();
  const address = walletAddress || connectedAddress;
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', address?.toLowerCase()],
    queryFn: () => fetchProfileData(address!, publicClient!),
    enabled: !!address && !!publicClient,
    staleTime: CACHE_TIMES.PROFILE_STALE,
    gcTime: CACHE_TIMES.PROFILE_GC,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile', address?.toLowerCase()] });
    await refetch();
  };

  const updateProfile = async (metadata: Partial<Profile>) => {
    if (!address) {
      throw new Error('No wallet address connected');
    }

    // Update profile in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: metadata.displayName,
        bio: metadata.bio,
        avatar_url: metadata.avatarUrl,
        banner_url: metadata.bannerUrl,
        twitter_handle: metadata.twitterHandle,
        discord_handle: metadata.discordHandle,
        website_url: metadata.websiteUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet', address.toLowerCase());

    if (updateError) {
      console.error('[useProfile] Error updating profile:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // Refresh the profile data
    await refreshProfile();
  };

  const result = data || { profile: null, profileId: null, score: 0n, cards: [] };

  return {
    profile: result.profile,
    profileId: result.profileId,
    score: result.score,
    cards: result.cards,
    loading: isLoading,
    error: error as Error | null,
    refreshProfile,
    updateProfile,
  };
}
