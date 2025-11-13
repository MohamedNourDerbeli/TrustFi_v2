import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabaseClient';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PROFILE_NFT_CONTRACT_ADDRESS } from '@/lib/contracts';
import ProfileNFTAbi from '@/lib/ProfileNFT.abi.json';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';

// Validation schema
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { profile, refetchProfile } = useUser();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'updating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { register, handleSubmit, reset, getValues, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Pre-fill the form with the user's current profile data
  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username,
        bio: profile.bio || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) {
      setError("Profile not loaded.");
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setError(null);

    try {
      // 1. Upload NEW metadata to IPFS
      const metadataPayload = {
        name: data.username,
        description: data.bio || '',
        attributes: [] // Attributes will be updated by the contract
      };

      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('pin-metadata', {
        body: { metadata: metadataPayload },
      });

      if (functionError || functionResponse.error) throw new Error(functionError?.message || functionResponse.error);
      const newMetadataURI = `ipfs://${functionResponse.IpfsHash}`;

      // 2. Call the updateProfileMetadata function on the smart contract
      setStatus('updating');
      writeContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS,
        abi: ProfileNFTAbi,
        functionName: 'updateProfileMetadata',
        args: [newMetadataURI],
      });

    } catch (e: any) {
      console.error("Update failed:", e);
      setError(e.message || "Failed to update profile.");
      setStatus('error');
    }
  };
  
  // This useEffect handles the final step: updating the Supabase DB
  useEffect(() => {
    const updateDatabase = async () => {
      if (isSuccess && profile) {
        setStatus('success');
        const formData = getValues(); // Assuming you have getValues from useForm
        await supabase
          .from('profiles')
          .update({ username: formData.username, bio: formData.bio })
          .eq('user_id', profile.user_id);
        
        // Refetch the user profile to update the UI across the app
        await refetchProfile();
      }
    };
    updateDatabase();
  }, [isSuccess, profile, refetchProfile]);


  const isLoading = isPending || isConfirming || status === 'uploading';
  let buttonText = "Save Changes";
  if (status === 'uploading') buttonText = "Uploading...";
  if (isPending) buttonText = "Waiting for signature...";
  if (isConfirming) buttonText = "Updating on-chain...";
  if (status === 'success') buttonText = "Updated Successfully!";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-1">Settings</h1>
          <p className="text-lg text-gray-400">Manage your profile and account settings.</p>
        </div>

        <div className="bg-[#1A202C] border border-[#374151] rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Update Profile</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input id="username" {...register('username')} className="w-full px-4 py-3 rounded-lg bg-[#1A202C] border border-[#374151] text-white" />
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea id="bio" {...register('bio')} rows={3} className="w-full px-4 py-3 rounded-lg bg-[#1A202C] border border-[#374151] text-white" />
              {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
            </div>
            <div className="flex justify-end gap-4">
              <Link href="/profile" className="py-2 px-4 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-colors">
                Cancel
              </Link>
              <button type="submit" disabled={!isDirty || isLoading || isSuccess} className="py-2 px-4 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {buttonText}
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
