// components/user/ProfileView.tsx
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useProfile } from '../../hooks/useProfile';
import { ScoreRecalculate } from './ScoreRecalculate';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardABI from '../../lib/ReputationCard.abi.json';
import type { Address } from 'viem';
import type { Card } from '../../types/card';

// Component to display individual card with metadata
function CardDisplay({ card }: { card: Card }) {
  const publicClient = usePublicClient();
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        if (!publicClient) return;

        // Fetch tokenURI from contract
        const tokenURI = (await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'tokenURI',
          args: [card.cardId],
        } as any)) as string;

        // Fetch metadata from tokenURI
        if (tokenURI.startsWith('data:application/json;base64,')) {
          // Base64 encoded JSON
          const base64Data = tokenURI.replace('data:application/json;base64,', '');
          const jsonString = atob(base64Data);
          const metadata = JSON.parse(jsonString);
          setMetadata(metadata);
        } else if (tokenURI.startsWith('http')) {
          // HTTP URL - add auth header if it's a Supabase function
          const headers: HeadersInit = {};
          if (tokenURI.includes('supabase.co/functions')) {
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (anonKey) {
              headers['Authorization'] = `Bearer ${anonKey}`;
            }
          }
          const response = await fetch(tokenURI, { headers });
          const metadata = await response.json();
          setMetadata(metadata);
        }
      } catch (err) {
        console.error('Error fetching card metadata:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [card.cardId, publicClient]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900">Card #{card.cardId.toString()}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {metadata?.image ? (
          <img 
            src={metadata.image} 
            alt={metadata.name || `Card #${card.cardId.toString()}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 w-full h-full flex items-center justify-center">
            <span className="text-6xl text-white font-bold">
              {card.tier || '?'}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">
          {metadata?.name || `Card #${card.cardId.toString()}`}
        </h3>
        {metadata?.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{metadata.description}</p>
        )}
        {card.tier > 0 && (
          <p className="text-sm text-gray-600 mt-1">Tier {card.tier}</p>
        )}
        {card.issuer !== '0x0000000000000000000000000000000000000000' && (
          <p className="text-xs text-gray-500 mt-2">
            Issuer: {card.issuer.slice(0, 6)}...{card.issuer.slice(-4)}
          </p>
        )}
      </div>
    </div>
  );
}

interface ProfileViewProps {
  address?: Address;
}

export function ProfileView({ address: propAddress }: ProfileViewProps) {
  const { address: connectedAddress } = useAccount();
  const address = propAddress || connectedAddress;
  const { profile, profileId, score, cards, loading, error } = useProfile(address);

  const isOwnProfile = connectedAddress && address && connectedAddress.toLowerCase() === address.toLowerCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading profile: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!profile || !profileId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No profile found for this address.</p>
          {isOwnProfile && (
            <p className="text-yellow-700 mt-2">
              <a href="/create-profile" className="underline">Create your profile</a> to get started.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Banner */}
      <div className="relative">
        <div
          className="w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"
          style={
            profile.bannerUrl
              ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        />
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <span className="text-4xl text-white font-bold">
                  {profile.displayName?.[0]?.toUpperCase() || address?.slice(2, 4).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edit Button */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <a
              href="/profile/edit"
              className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </a>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="mt-20 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {profile.displayName || `Profile #${profileId.toString()}`}
        </h1>
        
        <p className="text-gray-600 mt-1">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>

        {profile.bio && (
          <p className="text-gray-700 mt-4">{profile.bio}</p>
        )}

        {/* Social Links */}
        {(profile.twitterHandle || profile.discordHandle || profile.websiteUrl) && (
          <div className="flex gap-4 mt-4">
            {profile.twitterHandle && (
              <a
                href={`https://twitter.com/${profile.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
            )}
            {profile.discordHandle && (
              <span className="text-indigo-500 flex items-center gap-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                {profile.discordHandle}
              </span>
            )}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Reputation Score */}
      {isOwnProfile ? (
        <div className="mb-8">
          <ScoreRecalculate />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Reputation Score</h2>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
                {score.toString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reputation Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Reputation Cards ({cards.length})
        </h2>

        {cards.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No reputation cards yet.</p>
            {isOwnProfile && (
              <a
                href="/discover"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Discover Collectibles
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <CardDisplay key={card.cardId.toString()} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
