import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabaseClient';

// --- WAGMI, VIEM & CONTRACT IMPORTS ---
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import ProfileNFTAbi from '@/lib/ProfileNFT.abi.json';

// Validation schema
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

export default function CreateProfilePage() {
  const [, setLocation] = useLocation();
  const { user, refetchProfile } = useUser();

  const [status, setStatus] = useState<'idle' | 'uploading' | 'minting' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: hash, writeContract, isPending: isMinting, reset: resetWriteContract } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      setError("User not authenticated.");
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setError(null);
    resetWriteContract();

    try {
      const metadataPayload = {
        name: data.username,
        description: data.bio || '',
        attributes: [{ trait_type: "Reputation Score", value: 0 }]
      };

      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('pin-metadata', {
        body: { metadata: metadataPayload },
      });

      if (functionError) throw functionError;
      if (functionResponse?.error) throw new Error(functionResponse.error);
      if (!functionResponse?.IpfsHash) throw new Error('No IPFS hash returned from pin-metadata function');

      const metadataURI = `ipfs://${functionResponse.IpfsHash}`;

      setStatus('minting');
      console.log('Calling createProfile with URI:', metadataURI);
      console.log('Contract address:', PROFILE_NFT_CONTRACT_ADDRESS);
      
      writeContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS,
        abi: ProfileNFTAbi,
        functionName: 'createProfile',
        args: [metadataURI],
      }, {
        onError: (error) => {
          console.error('Transaction error:', error);
          setError(error.message || 'Transaction failed');
          setStatus('error');
        }
      });

    } catch (e: any) {
      console.error("Creation failed at upload/mint stage:", e);
      setError(e.message || "Failed to create profile.");
      setStatus('error');
    }
  };

  // This useEffect hook listens for the transaction to be confirmed and saves the profile
  useEffect(() => {
    console.log('useEffect triggered - isConfirmed:', isConfirmed, 'receipt:', !!receipt, 'user:', !!user);
    
    const saveProfile = async () => {
      if (isConfirmed && receipt && user) {
        console.log('Transaction confirmed! Hash:', receipt.transactionHash);
        console.log('Receipt logs:', receipt.logs);
        setStatus('saving');
        try {
          // --- PARSE THE TOKEN ID FROM THE LOGS (ROBUST VERSION) ---
          let mintedTokenId: bigint | null = null;
          for (const log of receipt.logs) {
            try {
              const decodedEvent = decodeEventLog({
                abi: ProfileNFTAbi,
                data: log.data,
                topics: log.topics,
              });

              if (decodedEvent.eventName === 'ProfileCreated') {
                // Access the argument by its NAME from the ABI, not by index.
                // The event in ProfileNFT.sol is: event ProfileCreated(uint256 tokenId, address owner);
                mintedTokenId = (decodedEvent.args as unknown as { tokenId: bigint; owner: string }).tokenId;
                
                console.log(`Found ProfileCreated event! Token ID: ${mintedTokenId}`);
                break; // Exit loop once we find our event
              }
            } catch (e) {
              // Ignore logs that don't match our ABI
            }
          }

          if (mintedTokenId === null || typeof mintedTokenId === 'undefined') {
            throw new Error("Could not find or parse tokenId from ProfileCreated event.");
          }
          // --- END PARSING ---

          const currentFormData = getValues();
          
          console.log('Saving profile to database with Token ID:', Number(mintedTokenId));
          
          const { error: dbError } = await supabase.from('profiles').insert({
            user_id: user.id,
            username: currentFormData.username,
            bio: currentFormData.bio,
            profile_nft_id: Number(mintedTokenId), 
          }).select().single();

          if (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
          }

          console.log('Profile saved successfully!');
          await refetchProfile();
          setLocation('/dashboard');

        } catch (e: any) {
          console.error("Failed to parse logs or save profile to DB:", e);
          setError("NFT was minted, but we failed to record the ID. Please contact support.");
          setStatus('error');
        }
      }
    };
    saveProfile();
  }, [isConfirmed, receipt, user, setLocation, refetchProfile, getValues]);

  // Log transaction status changes
  useEffect(() => {
    if (hash) {
      console.log('Transaction sent! Hash:', hash);
      console.log('Confirming:', isConfirming);
      console.log('Confirmed:', isConfirmed);
    }
  }, [hash, isConfirming, isConfirmed]);

  const isLoading = isMinting || isConfirming || status === 'uploading' || status === 'saving';
  let statusText = "Create Profile & Mint NFT";
  if (status === 'uploading') statusText = "Uploading metadata...";
  if (isMinting) statusText = "Waiting for signature...";
  if (isConfirming) statusText = "Minting your Profile NFT...";
  if (status === 'saving') statusText = "Saving profile...";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Your TrustFi Profile</h1>
          <p className="text-lg text-gray-400">This will be your on-chain identity.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input id="username" {...register('username')} className="w-full px-4 py-3 rounded-lg bg-[#1A202C] border border-[#374151] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none" />
            {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio (Optional)</label>
            <textarea id="bio" {...register('bio')} rows={3} className="w-full px-4 py-3 rounded-lg bg-[#1A202C] border border-[#374151] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none" />
            {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 px-6 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />{statusText}</>) : (statusText)}
          </button>
        </form>

        {hash && isConfirming && (
          <div className="mt-6 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
            <p className="font-semibold text-center mb-2">Transaction Submitted</p>
            <p className="text-sm text-gray-300 text-center mb-2">Waiting for confirmation on Moonbase Alpha testnet...</p>
            <a 
              href={`https://moonbase.moonscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 underline block text-center"
            >
              View on Block Explorer
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-center">
            <p className="font-semibold">An Error Occurred</p>
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
