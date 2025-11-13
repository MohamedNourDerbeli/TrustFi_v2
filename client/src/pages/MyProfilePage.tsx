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
        // 1. Fetch 'CardIssued' events from the blockchain where the profileId matches the user's
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
          fromBlock: 'earliest', // In production, you'd use a more recent block
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

        // 3. For each card, fetch its metadata from IPFS
        const metadataPromises = fetchedCards.map(async (card) => {
          if (card.uri) {
            const metadataUrl = card.uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/' );
            const response = await fetch(metadataUrl);
            const metadata = await response.json();
            return { ...card, metadata };
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

        {/* Main Profile NFT Section (unchanged) */}
        <div className="bg-[#1A202C] border border-[#374151] rounded-lg p-6 flex flex-col md:flex-row gap-6"> ... </div>

        {/* --- THIS IS THE UPDATED SECTION --- */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-indigo-400 mb-4">My Reputation Cards</h2>
          {isLoadingCards ? (
            <div className="text-center text-gray-400">Loading your collection...</div>
          ) : cards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.id.toString()} className="bg-[#1A202C] border border-[#374151] rounded-lg overflow-hidden">
                  <img src={card.metadata?.image || 'https://via.placeholder.com/300'} alt={card.metadata?.name} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <h4 className="font-bold text-md truncate">{card.metadata?.name}</h4>
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
