import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '@/lib/contracts';
import ProfileNFTAbi from '@/lib/ProfileNFT.abi.json';
import ReputationCardAbi from '@/lib/ReputationCard.abi.json';

export default function DashboardPage() {
  const { profile, isLoading: isProfileLoading } = useUser();
  const { signOut, user } = useAuth();
  const [, setLocation] = useLocation();
  const publicClient = usePublicClient();

  // State for the score calculated by the front-end
  const [localReputationScore, setLocalReputationScore] = useState(0);
  const [isCalculatingScore, setIsCalculatingScore] = useState(true);

  // --- NEW: Wagmi hooks for the on-chain recalculation ---
  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isRecalculating, isSuccess: isRecalculated } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const calculateScore = async () => {
      if (!profile || !publicClient) return;

      setIsCalculatingScore(true);
      try {
        // Get current block number and fetch recent events (last 1000 blocks to stay under limit)
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > 1000n ? latestBlock - 1000n : 0n;
        
        const logs = await publicClient.getLogs({
          address: REPUTATION_CARD_CONTRACT_ADDRESS,
          event: { type: 'event', name: 'CardIssued', inputs: [ { type: 'uint256', name: 'profileId', indexed: true }, { type: 'uint256', name: 'cardId', indexed: true }, { type: 'address', name: 'issuer', indexed: true }, { type: 'uint8', name: 'tier' } ] },
          args: { profileId: BigInt(profile.profile_nft_id || 0) },
          fromBlock,
          toBlock: 'latest',
        });

        if (logs.length === 0) {
          setLocalReputationScore(0);
          setIsCalculatingScore(false);
          return;
        }

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

        let totalScore = 0;
        for (const log of logs) {
          const tier = (log.args as any).tier as number;
          totalScore += scoreMap[tier as keyof typeof scoreMap] || 0;
        }
        setLocalReputationScore(totalScore);

      } catch (error) {
        console.error("Failed to calculate score:", error);
        setLocalReputationScore(0);
      } finally {
        setIsCalculatingScore(false);
      }
    };

    calculateScore();
  }, [profile, publicClient]);

  // --- NEW: Handler for the recalculate button ---
  const handleRecalculate = () => {
    writeContract({
      address: PROFILE_NFT_CONTRACT_ADDRESS,
      abi: ProfileNFTAbi,
      functionName: 'recalculateMyScore',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  // Redirect to create profile if user has no profile
  useEffect(() => {
    if (!isProfileLoading && user && !profile) {
      setLocation('/create-profile');
    }
  }, [isProfileLoading, user, profile, setLocation]);

  if (isProfileLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading your dashboard...</div>;
  }

  if (user && !profile) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Redirecting...</div>;
  }

  const isRecalculateLoading = isRecalculating;
  let recalculateButtonText = "Update Score On-Chain";
  if (isRecalculating) recalculateButtonText = "Updating...";
  if (isRecalculated) recalculateButtonText = "Updated Successfully!";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome, {profile?.username || 'User'}!</h1>
        
        <div className="bg-[#1A202C] border border-[#374151] rounded-lg p-6 space-y-4">
          <div className="text-center">
            <p className="text-lg text-gray-400">Your Reputation Score</p>
            {isCalculatingScore ? (
              <div className="text-6xl font-bold text-indigo-400 animate-pulse">...</div>
            ) : (
              <div className="text-6xl font-bold text-indigo-400">{localReputationScore}</div>
            )}
          </div>

          {/* --- NEW: Recalculate Button --- */}
          <div className="pt-4 border-t border-gray-700">
            <button 
              onClick={handleRecalculate}
              disabled={isRecalculateLoading || isRecalculated}
              className="w-full py-2 px-4 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recalculateButtonText}
            </button>
            {isRecalculated && <p className="text-xs text-green-400 mt-1">Your on-chain score is now up to date!</p>}
          </div>
          
          <div className="text-left text-sm space-y-2 pt-4 border-t border-gray-700">
            <div><span className="font-semibold text-gray-300">Profile NFT ID: </span><span className="font-mono">#{profile?.profile_nft_id}</span></div>
            <div><span className="font-semibold text-gray-300">Wallet Address: </span><span className="font-mono break-all">{user?.user_metadata.address}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Link href="/profile" className="block py-3 px-4 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-center">View My Profile</Link>
          <Link href="/collectibles" className="block py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors text-center">Discover</Link>
        </div>

        <button onClick={handleSignOut} className="mt-4 w-full py-3 px-6 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
