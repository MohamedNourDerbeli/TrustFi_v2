// components/user/CreateProfile.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { PROFILE_NFT_CONTRACT_ADDRESS } from '../../lib/contracts';
import ProfileNFTABI from '../../lib/ProfileNFT.abi.json';
import { supabase } from '../../lib/supabase';
import { parseContractError } from '../../lib/errors';
import { showProfileCreatedNotification, showErrorNotification } from '../../lib/notifications';
import { generateAndUploadMetadata } from '../../lib/metadata';

interface ProfileFormData {
  displayName: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
}

export function CreateProfile() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    avatarUrl: '',
    bannerUrl: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedTokenURI, setGeneratedTokenURI] = useState<string | null>(null);

  const { write: writeContract, data: txData, isLoading: isPending } = useContractWrite({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'createProfile',
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
  });

  // Generate metadata and upload to IPFS
  const generateMetadata = async (): Promise<string> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Generate and upload metadata to IPFS (or fallback to data URI)
    const tokenURI = await generateAndUploadMetadata({
      displayName: formData.displayName,
      bio: `@${formData.username}`,
      avatarUrl: formData.avatarUrl,
      bannerUrl: formData.bannerUrl,
      websiteUrl: '',
      walletAddress: address,
    }, true); // Set to true to use IPFS, false for data URI only
    
    return tokenURI;
  };

  const validateForm = (): string | null => {
    if (!formData.displayName.trim()) {
      return 'Display name is required';
    }
    
    if (formData.displayName.length > 50) {
      return 'Display name must be 50 characters or less';
    }

    if (!formData.username.trim()) {
      return 'Username is required';
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      return 'Username must be between 3-20 characters';
    }

    // Validate username format (lowercase, letters, numbers, underscores only)
    if (!/^[a-z0-9_]+$/.test(formData.username)) {
      return 'Username can only contain lowercase letters, numbers, and underscores';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsProcessing(true);
      
      // Generate metadata
      const tokenURI = await generateMetadata();
      setGeneratedTokenURI(tokenURI);
      
      console.log('Creating profile with generated metadata');
      
      // Call createProfile on the contract
      writeContract({
        args: [tokenURI],
      });
    } catch (err) {
      console.error('Error creating profile:', err);
      const parsedError = parseContractError(err);
      setError(parsedError.message);
      showErrorNotification('Profile Creation Failed', parsedError.message);
      setIsProcessing(false);
    }
  };

  // Listen for transaction confirmation and extract profileId from event
  const handleTransactionConfirmed = useCallback(async () => {
    if (!isConfirmed || !txData?.hash || !address || !publicClient) return;

    console.log('Transaction confirmed, processing...');

    try {
      // Get transaction receipt
      const receipt = await publicClient.getTransactionReceipt({ hash: txData.hash });
      
      console.log('Transaction receipt:', receipt);
      console.log('Number of logs:', receipt.logs.length);
      
      // Try to find ProfileCreated event using the contract ABI
      let profileId: bigint | null = null;
      
      // Method 1: Try parsing with full ABI
      try {
        const decoded = await publicClient.readContract({
          address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: ProfileNFTABI,
          functionName: 'addressToProfileId',
          args: [address],
        }) as bigint;
        
        if (decoded && decoded > 0n) {
          profileId = decoded;
          console.log('Profile ID from contract read:', profileId.toString());
        }
      } catch (readError) {
        console.warn('Could not read profile ID from contract:', readError);
      }
      
      // Method 2: Parse events from logs if Method 1 failed
      if (!profileId) {
        console.log('Attempting to parse ProfileCreated event from logs...');
        
        for (const log of receipt.logs) {
          try {
            // Check if this log is from the ProfileNFT contract
            if (log.address.toLowerCase() === PROFILE_NFT_CONTRACT_ADDRESS.toLowerCase()) {
              console.log('Found log from ProfileNFT contract:', log);
              
              // Try to decode with the ABI
              const decoded = await publicClient.readContract({
                address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
                abi: ProfileNFTABI,
                functionName: 'addressToProfileId',
                args: [address],
              }) as bigint;
              
              if (decoded && decoded > 0n) {
                profileId = decoded;
                console.log('Profile ID found:', profileId.toString());
                break;
              }
            }
          } catch (logError) {
            console.warn('Error processing log:', logError);
          }
        }
      }

      if (!profileId) {
        throw new Error('Could not determine profile ID from transaction. The profile was created on-chain, but we need to refresh to get the ID.');
      }
      
      console.log('Profile created with ID:', profileId.toString());

      // Store in Supabase with profile data
      const insertData = {
        wallet: address.toLowerCase(),
        profile_id: profileId.toString(),
        token_uri: generatedTokenURI || '',
        display_name: formData.displayName,
        bio: `@${formData.username}`,
        avatar_url: formData.avatarUrl || null,
        banner_url: formData.bannerUrl || null,
        twitter_handle: null,
        discord_handle: null,
        website_url: null,
      };
      
      console.log('Inserting into Supabase:', insertData);

      const { data: insertedData, error: dbError } = await supabase
        .from('profiles')
        .insert(insertData)
        .select();

      if (dbError) {
        console.error('Supabase error details:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
        });
        
        // Check if it's a duplicate key error
        if (dbError.code === '23505') {
          console.log('Profile already exists in database, this is okay');
          setSuccess(`Profile created successfully! Profile ID: ${profileId.toString()}`);
          showProfileCreatedNotification(profileId, txData.hash);
        } else {
          throw new Error(`Database error: ${dbError.message} (${dbError.code})`);
        }
      } else {
        console.log('Profile stored in database successfully:', insertedData);
        setSuccess(`Profile created successfully! Profile ID: ${profileId.toString()}`);
        showProfileCreatedNotification(profileId, txData.hash);
      }

      // Reset form
      setFormData({
        displayName: '',
        username: '',
        avatarUrl: '',
        bannerUrl: '',
      });
      setGeneratedTokenURI(null);
    } catch (err) {
      console.error('Error processing transaction:', err);
      const errorMsg = err instanceof Error ? err.message : 'Profile created on-chain but failed to store in database. Please refresh the page.';
      setError(errorMsg);
      showErrorNotification('Database Error', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [isConfirmed, txData, address, publicClient, generatedTokenURI, formData]);

  // Effect to handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && isProcessing) {
      handleTransactionConfirmed();
    }
  }, [isConfirmed, isProcessing, handleTransactionConfirmed]);

  const isLoading = isPending || isConfirming || isProcessing;

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be less than 5MB');
      return;
    }

    try {
      const { uploadToPinata } = await import('../../lib/pinata');
      const ipfsUrl = await uploadToPinata(file);
      setFormData({ ...formData, avatarUrl: ipfsUrl });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
    }
  };

  // Handle banner file selection
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must be less than 10MB');
      return;
    }

    try {
      const { uploadToPinata } = await import('../../lib/pinata');
      const ipfsUrl = await uploadToPinata(file);
      setFormData({ ...formData, bannerUrl: ipfsUrl });
    } catch (err) {
      console.error('Error uploading banner:', err);
      setError('Failed to upload banner');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Profile</h1>
          <p className="text-gray-400">
            Set up your TrustFi profile to start building your on-chain reputation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Banner and Avatar Section */}
          <div className="relative">
            {/* Banner */}
            <div className="relative h-48 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg overflow-hidden">
              {formData.bannerUrl ? (
                <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <label htmlFor="banner-upload" className="cursor-pointer flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
                    <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-white/80">Upload Banner</span>
                  </label>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
              )}
              {formData.bannerUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bannerUrl: '' })}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-950 overflow-hidden">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="pt-20 space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g., Akira"
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                disabled={isLoading}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the main name shown on your profile
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-700 bg-gray-800 text-gray-400">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  placeholder="your_username"
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9_]+"
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, lowercase, letters, numbers, and underscores only
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading || !address}
              className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                  {isPending ? 'Confirm in wallet...' : isConfirming ? 'Creating profile...' : 'Processing...'}
                </span>
              ) : (
                'Create Profile'
              )}
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            Creating a profile requires a one-time blockchain transaction. 
            You can add more details like bio and social links later for free.
          </p>
        </form>
      </div>
    </div>
  );
}
