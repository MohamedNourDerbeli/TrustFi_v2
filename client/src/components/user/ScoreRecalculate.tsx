// components/user/ScoreRecalculate.tsx
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Hash } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS } from '../../lib/contracts';
import ProfileNFTABI from '../../lib/ProfileNFT.abi.json';
import { useProfile } from '../../hooks/useProfile';
import { showScoreUpdatedNotification, showErrorNotification } from '../../lib/notifications';

export function ScoreRecalculate() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { profileId, score, refreshProfile } = useProfile(address);

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [newScore, setNewScore] = useState<bigint | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Wait for transaction and listen for ScoreUpdated event
  useEffect(() => {
    if (!publicClient || !profileId || !txHash) return;

    let unwatchEvent: (() => void) | undefined;
    let timeoutId: NodeJS.Timeout;

    const waitForTransaction = async () => {
      try {
        setIsConfirming(true);
        
        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        // Parse logs to find ScoreUpdated event
        let updatedScore: bigint | null = null;
        for (const log of receipt.logs) {
          try {
            // Check if this log is from our contract
            if (log.address.toLowerCase() !== PROFILE_NFT_CONTRACT_ADDRESS.toLowerCase()) {
              continue;
            }
            
            // Try to decode the log
            const decoded = (publicClient as any).decodeEventLog({
              abi: ProfileNFTABI,
              data: log.data,
              topics: (log as any).topics,
            });
            
            if (decoded.eventName === 'ScoreUpdated') {
              updatedScore = (decoded.args as any).newScore as bigint;
              break;
            }
          } catch {
            // Skip logs that don't match
          }
        }

        setIsConfirmed(true);
        setIsConfirming(false);

        if (updatedScore !== null) {
          setNewScore(updatedScore);
          setLastUpdated(new Date());
          showScoreUpdatedNotification(score, updatedScore, txHash);
          
          // Refresh profile data after a short delay
          setTimeout(() => {
            refreshProfile();
          }, 1000);
        } else {
          // If we couldn't find the event in logs, just refresh the profile
          setTimeout(() => {
            refreshProfile();
          }, 1000);
        }

        // Reset states after 5 seconds
        timeoutId = setTimeout(() => {
          setIsRecalculating(false);
          setTxHash(null);
          setIsConfirmed(false);
        }, 5000);
      } catch (err) {
        console.error('Error waiting for transaction:', err);
        setIsConfirming(false);
        setIsRecalculating(false);
      }
    };

    waitForTransaction();

    return () => {
      if (unwatchEvent) {
        unwatchEvent();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [publicClient, profileId, txHash, score, refreshProfile]);



  const handleRecalculate = async () => {
    if (!address || !walletClient || !publicClient) {
      setError('Please connect your wallet');
      return;
    }

    if (!profileId || profileId === 0n) {
      setError('No profile found. Please create a profile first.');
      return;
    }

    try {
      setIsRecalculating(true);
      setError(null);
      setNewScore(null);

      // Check if reputation contract is set
      const reputationContract = (await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTABI,
        functionName: 'reputationContract',
      } as any)) as `0x${string}`;

      if (!reputationContract || reputationContract === '0x0000000000000000000000000000000000000000') {
        setError('Reputation contract not set. Please contact the administrator.');
        setIsRecalculating(false);
        return;
      }

      // Call recalculateMyScore
      const hash = (await walletClient.writeContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTABI,
        functionName: 'recalculateMyScore',
        args: [],
      } as any)) as Hash;

      setTxHash(hash);
    } catch (err: any) {
      console.error('Error recalculating score:', err);
      
      // Parse error message
      let errorMessage = 'Failed to recalculate score';
      
      if (err.message) {
        if (err.message.includes('User rejected') || err.message.includes('User denied')) {
          errorMessage = 'Transaction was rejected';
        } else if (err.message.includes('No profile')) {
          errorMessage = 'No profile found. Please create a profile first.';
        } else if (err.message.includes('Reputation contract not set')) {
          errorMessage = 'Reputation contract not set. Please contact the administrator.';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      showErrorNotification('Score Recalculation Failed', errorMessage);
      setIsRecalculating(false);
      setTxHash(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-700">Reputation Score</h2>
          <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
            {newScore !== null ? newScore.toString() : score.toString()}
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
          {newScore !== null && newScore !== score && (
            <p className="text-sm text-green-600 mt-1">
              Score updated! (+{(newScore - score).toString()})
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating || isConfirming || !profileId}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRecalculating || isConfirming || !profileId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRecalculating || isConfirming ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isConfirming ? 'Confirming...' : 'Recalculating...'}
              </span>
            ) : (
              'Recalculate Score'
            )}
          </button>

          {txHash && (
            <a
              href={`https://moonbase.moonscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              View transaction
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isConfirmed && newScore !== null && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-green-800 font-medium">Success!</p>
              <p className="text-green-700 text-sm mt-1">
                Your reputation score has been recalculated successfully.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
