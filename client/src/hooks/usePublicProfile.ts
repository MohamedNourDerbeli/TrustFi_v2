/**
 * Custom hook for loading public profile data
 * Handles username resolution, on-chain data, off-chain data, and privacy checks
 */

import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { contractService } from '@/services/contractService';
import { reputationCardService, type ReputationCard } from '@/services/reputationCardService';

interface UsePublicProfileResult {
  profileData: any;
  offChainData: any;
  reputationCards: ReputationCard[];
  resolvedAddress: string;
  isLoading: boolean;
  error: string | null;
}

export function usePublicProfile(
  targetAddress: string | undefined,
  walletProvider: ethers.BrowserProvider | null,
  connectedAddress: string | undefined
): UsePublicProfileResult {
  const [profileData, setProfileData] = useState<any>(null);
  const [offChainData, setOffChainData] = useState<any>(null);
  const [reputationCards, setReputationCards] = useState<ReputationCard[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize read-only provider to avoid recreating on every render
  const readOnlyProvider = useMemo(() => {
    const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
    return new ethers.JsonRpcProvider(rpcUrl);
  }, []);

  // Load profile data
  useEffect(() => {
    const loadPublicProfile = async () => {
      if (!targetAddress) {
        // No target address means we're using cached data (viewing own profile)
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      let addressToLoad = targetAddress;

      // Check if it's a username (not starting with 0x)
      if (!targetAddress.startsWith('0x')) {
        try {
          const { profileService } = await import('@/services/profileService');
          const profile = await profileService.getProfileByUsername(targetAddress);

          if (profile) {
            addressToLoad = profile.address;
            setResolvedAddress(profile.address);
          } else {
            setError('Username not found');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error resolving username:', err);
          setError('Failed to resolve username');
          setIsLoading(false);
          return;
        }
      } else {
        // Validate Ethereum address
        if (!ethers.isAddress(targetAddress)) {
          setError('Invalid Ethereum address');
          setIsLoading(false);
          return;
        }
        setResolvedAddress(targetAddress);
      }

      try {
        // Load off-chain data first (fastest) - show immediately
        const loadOffChainData = async () => {
          try {
            const { profileService } = await import('@/services/profileService');
            const offChain = await profileService.getProfile(addressToLoad);
            console.log('Off-chain profile loaded:', offChain);
            setOffChainData(offChain);
            
            // If we have off-chain data, we're not in an error state
            if (offChain) {
              setError(null);
            }
          } catch (err) {
            console.error('Error loading off-chain data:', err);
          }
        };

        // Start loading off-chain data immediately (don't wait)
        await loadOffChainData();

        // Load on-chain profile using wallet provider if available
        if (walletProvider) {
          await contractService.initialize(walletProvider);
          await reputationCardService.initialize(walletProvider);

          try {
            const profile = await contractService.getProfileByOwner(addressToLoad);
            setProfileData(profile);

            // Load reputation cards with metadata in parallel (don't block profile display)
            reputationCardService.getProfileCards(Number(profile.tokenId)).then(async (cardIds) => {
              // Fetch full card data with metadata
              const { reputationCardMetadataService } = await import('@/services/reputationCardMetadataService');
              
              const cardsWithMetadata = await Promise.all(
                cardIds.map(async (cardId) => {
                  try {
                    const cardData = await reputationCardService.getCard(cardId);
                    
                    // Fetch metadata if URI exists
                    let metadata = null;
                    if (cardData.metadataURI) {
                      try {
                        metadata = await reputationCardMetadataService.fetchMetadata(cardData.metadataURI);
                      } catch (metaErr) {
                        console.warn(`Failed to fetch metadata for card ${cardId}:`, metaErr);
                      }
                    }
                    
                    return {
                      id: cardId,
                      profileId: cardData.profileId,
                      issuer: cardData.issuer,
                      category: metadata?.category || 'unknown',
                      description: metadata?.description || cardData.description,
                      value: cardData.value,
                      issuedAt: cardData.issuedAt,
                      isValid: cardData.isValid,
                      metadata,
                      metadataURI: cardData.metadataURI,
                    };
                  } catch (err) {
                    console.error(`Error loading card ${cardId}:`, err);
                    return null;
                  }
                })
              );
              
              // Filter out failed cards
              setReputationCards(cardsWithMetadata.filter(card => card !== null) as any[]);
            }).catch((err) => {
              console.error('Error loading reputation cards:', err);
            });
          } catch (err: any) {
            console.error('Error loading on-chain profile:', err);
            // Don't set error for missing on-chain profile - user might have off-chain profile only
            console.log('No on-chain profile found, will use off-chain data if available');
          }
        } else {
          // Read-only mode: directly call contract without signer
          const network = await readOnlyProvider.getNetwork();
          const chainId = Number(network.chainId).toString();

          const { CONTRACT_ADDRESSES } = await import('@/config/contracts');
          const { ProfileNFT_ABI } = await import('@/config/ProfileNFT.abi');

          const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ProfileNFT;
          if (!contractAddress) {
            throw new Error('Contract not deployed on this network');
          }

          const contract = new ethers.Contract(contractAddress, ProfileNFT_ABI, readOnlyProvider);

          try {
            const [tokenId, profileData, metadataURI] = await contract.getProfileByOwner(addressToLoad);

            // Fetch metadata (with fallback if it fails)
            let metadata = null;
            try {
              const { metadataService } = await import('@/services/metadataService');
              metadata = await metadataService.fetchMetadata(metadataURI);
            } catch (metadataError) {
              console.warn('Failed to fetch metadata from IPFS, using defaults:', metadataError);
              metadata = {
                name: 'Anonymous User',
                bio: 'No bio available',
                image: '',
              };
            }

            setProfileData({
              tokenId: Number(tokenId),
              reputationScore: Number(profileData.reputationScore),
              createdAt: Number(profileData.createdAt),
              lastUpdated: Number(profileData.lastUpdated),
              isActive: profileData.isActive,
              metadata,
              metadataURI,
            });

            // Load reputation cards with metadata in parallel (don't block profile display)
            const loadCards = async () => {
              try {
                const { ReputationCard_ABI } = await import('@/config/ReputationCard.abi');
                const { reputationCardMetadataService } = await import('@/services/reputationCardMetadataService');
                const cardContractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ReputationCard;
                
                if (cardContractAddress) {
                  const cardContract = new ethers.Contract(
                    cardContractAddress,
                    ReputationCard_ABI,
                    readOnlyProvider
                  );
                  const cardIds = await cardContract.getCardsByProfile(Number(tokenId));

                  const cards = await Promise.all(
                    cardIds.map(async (cardId: bigint) => {
                      try {
                        const [card, categoryHash, metadataURI] = await cardContract.getCard(cardId);
                        
                        // Fetch metadata if URI exists
                        let metadata = null;
                        if (metadataURI) {
                          try {
                            metadata = await reputationCardMetadataService.fetchMetadata(metadataURI);
                          } catch (metaErr) {
                            console.warn(`Failed to fetch metadata for card ${cardId}:`, metaErr);
                          }
                        }
                        
                        return {
                          id: Number(cardId),
                          profileId: Number(card.profileId),
                          issuer: card.issuer,
                          category: metadata?.category || 'unknown',
                          description: metadata?.description || '',
                          value: Number(card.value),
                          issuedAt: Number(card.issuedAt),
                          isValid: card.isValid,
                          metadata,
                          metadataURI,
                          categoryHash,
                        };
                      } catch (err) {
                        console.error(`Error loading card ${cardId}:`, err);
                        return null;
                      }
                    })
                  );
                  
                  // Filter out failed cards
                  setReputationCards(cards.filter(card => card !== null) as any[]);
                }
              } catch (err) {
                console.error('Error loading reputation cards:', err);
              }
            };
            loadCards();
          } catch (err: any) {
            console.error('Error loading profile in read-only mode:', err);
            // Don't set error for missing on-chain profile - user might have off-chain profile only
            console.log('No on-chain profile found in read-only mode, will use off-chain data if available');
          }
        }
      } catch (err: any) {
        console.error('Profile load error:', err);
        // Only set error if it's not a "profile not found" error
        if (!err.message?.includes('Profile not found') && 
            !err.message?.includes('ProfileNotFound') &&
            err.code !== 'CALL_EXCEPTION') {
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicProfile();
  }, [targetAddress, walletProvider, readOnlyProvider]);

  // Separate effect to check privacy after data is loaded
  useEffect(() => {
    if (!offChainData || isLoading) return;

    const visibility = offChainData.visibility || 'public';
    const isOwner =
      connectedAddress &&
      resolvedAddress &&
      connectedAddress.toLowerCase() === resolvedAddress.toLowerCase();

    console.log('Privacy check:', {
      visibility,
      connectedAddress: connectedAddress?.toLowerCase(),
      resolvedAddress: resolvedAddress?.toLowerCase(),
      isOwner,
      willBlock: visibility === 'private' && !isOwner,
    });

    // If profile is private and viewer is not the owner, show error
    if (visibility === 'private' && !isOwner) {
      setError('This profile is private');
    } else if (error === 'This profile is private') {
      // Clear the error if user is now recognized as owner
      setError(null);
    }
  }, [offChainData, connectedAddress, resolvedAddress, isLoading, error]);

  return {
    profileData,
    offChainData,
    reputationCards,
    resolvedAddress,
    isLoading,
    error,
  };
}
