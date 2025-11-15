// hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseAbiItem, type Address } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTABI from '../lib/ProfileNFT.abi.json';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import { supabase, type ProfileRow } from '../lib/supabase';
import { uploadToPinata } from '../lib/pinata';
import type { Profile, ProfileMetadata } from '../types/profile';
import type { Card } from '../types/card';

export interface UseProfileReturn {
  profile: Profile | null;
  profileId: bigint | null;
  score: bigint;
  cards: Card[];
  loading: boolean;
  error: Error | null;
  createProfile: (tokenURI: string) => Promise<void>;
  updateProfile: (updates: ProfileMetadata) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  uploadBanner: (file: File) => Promise<string>;
  recalculateScore: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useProfile(walletAddress?: Address): UseProfileReturn {
  const { address: connectedAddress } = useAccount();
  const address = walletAddress || connectedAddress;
  const publicClient = usePublicClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileId, setProfileId] = useState<bigint | null>(null);
  const [score, setScore] = useState<bigint>(0n);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!address || !publicClient) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch profileId from contract
      const profileIdResult = await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTABI,
        functionName: 'addressToProfileId',
        args: [address],
      }) as bigint;

      // If profileId is 0, user doesn't have a profile
      if (profileIdResult === 0n) {
        setProfile(null);
        setProfileId(null);
        setScore(0n);
        setCards([]);
        setLoading(false);
        return;
      }

      setProfileId(profileIdResult);

      // Fetch score from contract
      const scoreResult = await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTABI,
        functionName: 'profileIdToScore',
        args: [profileIdResult],
      }) as bigint;

      setScore(scoreResult);

      // Fetch attached cards from contract
      const cardsResult = await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTABI,
        functionName: 'getCardsForProfile',
        args: [profileIdResult],
      }) as bigint[];

      // Fetch card details for each card
      // Note: We'll fetch basic card info. Full metadata can be fetched when needed
      const cardDetails = await Promise.all(
        cardsResult.map(async (cardId) => {
          try {
            // Get token URI
            const tokenUri = await publicClient.readContract({
              address: REPUTATION_CARD_CONTRACT_ADDRESS as `0x${string}`,
              abi: ReputationCardABI,
              functionName: 'tokenURI',
              args: [cardId],
            }) as string;

            // For now, we'll create a basic card object
            // Template ID and other details can be fetched from events or stored in Supabase
            return {
              cardId,
              templateId: 0n, // Will be populated from events or Supabase
              profileId: profileIdResult,
              tokenUri,
              tier: 0, // Will be populated from metadata
              issuer: '0x0000000000000000000000000000000000000000' as Address,
              claimedAt: new Date(),
            } as Card;
          } catch (err) {
            console.error(`Error fetching card ${cardId}:`, err);
            return null;
          }
        })
      );

      const validCards = cardDetails.filter((card): card is Card => card !== null);
      setCards(validCards);

      // Fetch profile metadata from Supabase
      const { data: profileData, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet', address.toLowerCase())
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is okay
        console.error('Error fetching profile from database:', dbError);
      }

      if (profileData) {
        const profileRow = profileData as ProfileRow;
        setProfile({
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
          cards: validCards,
          createdAt: new Date(profileRow.created_at),
        });
      } else {
        // Profile exists on-chain but not in database
        setProfile({
          id: '',
          wallet: address,
          profileId: profileIdResult,
          tokenUri: '',
          score: scoreResult,
          cards: validCards,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Create profile - not implemented in hook, use CreateProfile component instead
  const createProfile = useCallback(async (tokenURI: string) => {
    throw new Error('Use CreateProfile component to create a profile');
  }, []);

  // Update profile metadata
  const updateProfile = useCallback(async (updates: ProfileMetadata) => {
    if (!address || !profileId) {
      throw new Error('Profile not found');
    }

    const { error: dbError } = await supabase
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

    if (dbError) {
      throw new Error(`Failed to update profile: ${dbError.message}`);
    }

    // Refresh profile data
    await fetchProfile();
  }, [address, profileId, fetchProfile]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    const ipfsUrl = await uploadToPinata(file);
    return ipfsUrl;
  }, []);

  // Upload banner
  const uploadBanner = useCallback(async (file: File): Promise<string> => {
    const ipfsUrl = await uploadToPinata(file);
    return ipfsUrl;
  }, []);

  // Recalculate score - simplified, just refresh from contract
  const recalculateScore = useCallback(async () => {
    if (!address || !profileId) {
      throw new Error('Profile not found');
    }
    // User needs to call recalculateMyScore on contract directly
    // This just refreshes the data
    await fetchProfile();
  }, [address, profileId, fetchProfile]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    profileId,
    score,
    cards,
    loading,
    error,
    createProfile,
    updateProfile,
    uploadAvatar,
    uploadBanner,
    recalculateScore,
    refreshProfile,
  };
}
