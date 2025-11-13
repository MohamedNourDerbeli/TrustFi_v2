import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Link } from 'wouter';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '@/lib/contracts';
import ReputationCardAbi from '@/lib/ReputationCard.abi.json';
import { usePublicClient } from 'wagmi';

interface ReputationCardInfo {
  id: bigint;
  uri: string;
  metadata?: {
    name: string;
    description: string;
    image: string;
  };
}

export default function MyProfilePage( ) {
  const { profile, isLoading: isProfileLoading } = useUser();
  const [cards, setCards] = useState<ReputationCardInfo[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchClaimedCards = async () => {
      if (!profile || !publicClient) return;

      setIsLoadingCards(true);
      try {
        // 1. Get current block number and fetch recent events (last 1000 blocks to stay under limit)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;
        
        const logs = await publicClient.getLogs({
          address: REPUTATION_CARD_CONTRACT_ADDRESS,
          event: {
            type: 'event',
            name: 'CardIssued',
            inputs: [
              { type: 'uint256', name: 'profileId', indexed: true },
              { type: 'uint256', name: 'cardId', indexed: true },
              { type: 'address', name: 'issuer', indexed: true },
              { type: 'uint8', name: 'tier' },
            ],
          },
          args: {
            profileId: BigInt(profile.profile_nft_id || 0),
          },
          fromBlock,
          toBlock: 'latest',
        });

        // 2. For each log, get the tokenURI from the contract
        const cardPromises = logs.map(async (log) => {
          const cardId = (log.args as any).cardId;
          const uri = await publicClient.readContract({
            address: REPUTATION_CARD_CONTRACT_ADDRESS,
            abi: ReputationCardAbi,
            functionName: 'tokenURI',
            args: [cardId],
          }) as string;
          return { id: cardId, uri };
        });

        const fetchedCards = await Promise.all(cardPromises);

        // 3. For each card, fetch its metadata from IPFS with error handling
        const metadataPromises = fetchedCards.map(async (card) => {
          if (card.uri) {
            try {
              const metadataUrl = card.uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              const response = await fetch(metadataUrl, {
                signal: AbortSignal.timeout(5000), // 5 second timeout
              });
              
              if (!response.ok) {
                console.warn(`Failed to fetch metadata for card ${card.id}: ${response.status}`);
                return card; // Return card without metadata
              }
              
              const metadata = await response.json();
              return { ...card, metadata };
            } catch (error) {
              console.warn(`Error fetching metadata for card ${card.id}:`, error);
              return card; // Return card without metadata on error
            }
          }
          return card;
        });

        const cardsWithMetadata = await Promise.all(metadataPromises);
        setCards(cardsWithMetadata);

      } catch (error) {
        console.error("Failed to fetch claimed cards:", error);
      } finally {
        setIsLoadingCards(false);
      }
    };

    fetchClaimedCards();
  }, [profile, publicClient]);

  // ... (rest of the component is the same until the "My Reputation Cards" section)

  if (isProfileLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading your profile...</div>;
  }
  if (!profile) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1">My Profile</h1>
            <p className="text-lg text-gray-400">Your on-chain identity and collection.</p>
          </div>
          <Link href="/collectibles" className="py-2 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors">
            Discover Collectibles
          </Link>
        </div>

        {/* Main Profile NFT Section */}
        <div className="bg-[#1A202C] border border-[#374151] rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{profile.username}</h2>
              {profile.bio && <p className="text-gray-400 mt-2">{profile.bio}</p>}
            </div>
            <Link href="/settings" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
              Edit Profile
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Profile NFT ID:</span> {profile.profile_nft_id || 'N/A'}
            </p>
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Member since:</span> {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* --- THIS IS THE UPDATED SECTION --- */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-indigo-400 mb-4">My Reputation Cards</h2>
          {isLoadingCards ? (
            <div className="text-center text-gray-400">Loading your collection...</div>
          ) : cards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.id.toString()} className="bg-[#1A202C] border border-[#374151] rounded-lg overflow-hidden">
                  {card.metadata?.image ? (
                    <img 
                      src={card.metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')} 
                      alt={card.metadata?.name || `Card #${card.id}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        // Fallback to placeholder on image load error
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Card+' + card.id;
                      }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500">Card #{card.id.toString()}</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-bold text-md truncate">
                      {card.metadata?.name || `Reputation Card #${card.id}`}
                    </h4>
                    {card.metadata?.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{card.metadata.description}</p>
                    )}
                  </div>
                </div>
               ))}
            </div>
          ) : (
            <div className="bg-[#1A202C] border border-[#374151] rounded-lg p-10 text-center">
              <p className="text-gray-500">Your collection of credentials will appear here once you claim them.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
