// hooks/useProfile.ts - Modern React Query implementation
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTABI from '../lib/ProfileNFT.abi.json';
import { supabase, type ProfileRow } from '../lib/supabase';
import type { Profile } from '../types/profile';
import type { Card } from '../types/card';

export interface UseProfileReturn {
  profile: Profile | null;
  profileId: bigint | null;
  score: bigint;
  cards: Card[];
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
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

  // Fetch attached cards from contract
  const cardsResult = await publicClient.readContract({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'getCardsForProfile',
    args: [profileIdResult],
  }) as bigint[];

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
      cards: [],
      createdAt: new Date(profileRow.created_at),
    };
  }

  return {
    profile,
    profileId: profileIdResult,
    score: scoreResult,
    cards: [] as Card[], // Simplified for now
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const refreshProfile = async () => {
    await refetch();
  };

  return {
    profile: data?.profile || null,
    profileId: data?.profileId || null,
    score: data?.score || 0n,
    cards: data?.cards || [],
    loading: isLoading,
    error: error as Error | null,
    refreshProfile,
  };
}
