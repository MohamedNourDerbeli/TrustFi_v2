import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { usePublicClient } from 'wagmi';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '@/lib/contracts';
import ReputationCardAbi from '@/lib/ReputationCard.abi.json';

export default function DashboardPage() {
  const { profile, isLoading: isProfileLoading } = useUser();
  const { signOut, user } = useAuth();
  const [, setLocation] = useLocation();
  const publicClient = usePublicClient();

  const [reputationScore, setReputationScore] = useState(0);
  const [isCalculatingScore, setIsCalculatingScore] = useState(true);

  const calculateScore = async () => {
    if (!profile || !publicClient) return;

    setIsCalculatingScore(true);
    try {
      console.log('Calculating score for profile:', profile.profile_nft_id);
      
      // 1. Fetch all 'CardIssued' events for this user
      const logs = await publicClient.getLogs({
        address: REPUTATION_CARD_CONTRACT_ADDRESS,
        event: { type: 'event', name: 'CardIssued', inputs: [ { type: 'uint256', name: 'profileId', indexed: true }, { type: 'uint256', name: 'cardId', indexed: true }, { type: 'address', name: 'issuer', indexed: true }, { type: 'uint8', name: 'tier' } ] },
        args: { profileId: BigInt(profile.profile_nft_id || 0) },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      console.log('Found', logs.length, 'CardIssued events');

      if (logs.length === 0) {
        setReputationScore(0);
        return;
      }

      // 2. Fetch the score for each tier from the contract
      const tierScores = await publicClient.multicall({
        contracts: [
          { address: REPUTATION_CARD_CONTRACT_ADDRESS, abi: ReputationCardAbi, functionName: 'tierToScore', args: [1] },
          { address: REPUTATION_CARD_CONTRACT_ADDRESS, abi: ReputationCardAbi, functionName: 'tierToScore', args: [2] },
          { address: REPUTATION_CARD_CONTRACT_ADDRESS, abi: ReputationCardAbi, functionName: 'tierToScore', args: [3] },
        ]
      });

      const scoreMap = {
        1: Number(tierScores[0].result || 0),
        2: Number(tierScores[1].result || 0),
        3: Number(tierScores[2].result || 0),
      };

      console.log('Tier score map:', scoreMap);

      // 3. Calculate the total score
      let totalScore = 0;
      for (const log of logs) {
        const tier = (log.args as any).tier as number;
        console.log('Processing card with tier:', tier);
        totalScore += scoreMap[tier as keyof typeof scoreMap] || 0;
      }
      
      console.log('Total reputation score:', totalScore);
      setReputationScore(totalScore);

    } catch (error) {
      console.error("Failed to calculate score:", error);
      setReputationScore(0); // Default to 0 on error
    } finally {
      setIsCalculatingScore(false);
    }
  };

  useEffect(() => {
    calculateScore();
  }, [profile, publicClient]);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  if (isProfileLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading your dashboard...</div>;
  }

  if (user && !profile) {
    setLocation('/create-profile');
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome, {profile?.username || 'User'}!</h1>
        
        <div className="bg-[#1A202C] border border-[#374151] rounded-lg p-6 space-y-4">
          <div className="text-center">
            <p className="text-lg text-gray-400">Your Reputation Score</p>
            {isCalculatingScore ? (
              <div className="text-4xl font-bold text-indigo-400 animate-pulse">...</div>
            ) : (
              <div className="text-6xl font-bold text-indigo-400">{reputationScore}</div>
            )}
            <button 
              onClick={calculateScore} 
              disabled={isCalculatingScore}
              className="mt-3 text-sm text-indigo-300 hover:text-indigo-200 underline disabled:opacity-50"
            >
              Refresh Score
            </button>
          </div>
          <div className="text-left text-sm space-y-2 pt-4 border-t border-gray-700">
            <div><span className="font-semibold text-gray-300">Profile NFT ID: </span><span className="font-mono">#{profile?.profile_nft_id}</span></div>
            <div><span className="font-semibold text-gray-300">Wallet Address: </span><span className="font-mono break-all">{user?.user_metadata.address}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Link href="/profile" className="block py-3 px-4 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-center">
            View My Profile
          </Link>
          <Link href="/collectibles" className="block py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors text-center">
            Discover
          </Link>
        </div>

        <button onClick={handleSignOut} className="mt-4 w-full py-3 px-6 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
