// components/user/CreateProfile.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { useAuth } from '../../hooks/useAuth';
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
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
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
  const [checkingExistingProfile, setCheckingExistingProfile] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const { write: writeContract, data: txData, isLoading: isPending } = useContractWrite({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI,
    functionName: 'createProfile',
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
  });

  // Check if profile already exists on-chain and sync to Supabase if needed
  useEffect(() => {
    const checkAndSyncProfile = async () => {
      if (!address || !publicClient) {
        setCheckingExistingProfile(false);
        return;
      }

      try {
        console.log('[CreateProfile] Checking for existing on-chain profile...');
        const profileId = await publicClient.readContract({
          address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: ProfileNFTABI,
          functionName: 'addressToProfileId',
          args: [address],
        }) as bigint;

        console.log('[CreateProfile] Profile ID from contract:', profileId.toString());

        if (profileId && profileId > 0n) {
          // Profile exists on-chain, check if it's in Supabase
          console.log('[CreateProfile] Profile exists on-chain, checking Supabase...');
          
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('wallet', address.toLowerCase())
            .maybeSingle();

          if (existingProfile) {
            // Already in Supabase, redirect to dashboard
            console.log('[CreateProfile] Profile already in Supabase, redirecting...');
            showErrorNotification('Profile Already Exists', 'Redirecting to dashboard...');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          } else {
            // Exists on-chain but not in Supabase, need to sync
            console.log('[CreateProfile] Profile exists on-chain but not in Supabase. Please fill in your details to complete setup.');
            setCheckingExistingProfile(false);
            // Show a message that they need to complete their profile setup
            setError('Profile found on-chain! Please fill in your details to complete your profile setup.');
          }
        } else {
          // No profile on-chain, proceed with normal creation
          setCheckingExistingProfile(false);
        }
      } catch (err) {
        console.error('[CreateProfile] Error checking existing profile:', err);
        setCheckingExistingProfile(false);
      }
    };

    checkAndSyncProfile();
  }, [address, publicClient]);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle();

      if (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } else {
        setUsernameAvailable(!data); // Available if no data found
      }
    } catch (err) {
      console.error('Exception checking username:', err);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username);
      } else {
        setUsernameAvailable(null);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability]);

  // Generate metadata and upload to IPFS
  const generateMetadata = async (): Promise<string> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // Generate and upload metadata to IPFS (or fallback to data URI)
    const tokenURI = await generateAndUploadMetadata({
      displayName: formData.displayName,
      bio: '', // Bio is empty on creation, can be added later
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

    // Check for spaces
    if (formData.username.includes(' ')) {
      return 'Username cannot contain spaces';
    }

    // Validate username format (lowercase, letters, numbers, underscores only)
    if (!/^[a-z0-9_]+$/.test(formData.username)) {
      return 'Username can only contain lowercase letters, numbers, and underscores';
    }

    if (usernameAvailable === false) {
      return 'Username is already taken';
    }

    if (isCheckingUsername) {
      return 'Checking username availability...';
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
      
      // First check if profile exists on-chain
      const profileId = await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTABI,
        functionName: 'addressToProfileId',
        args: [address],
      }) as bigint;

      if (profileId && profileId > 0n) {
        // Profile exists on-chain, sync to Supabase instead of creating new one
        console.log('[CreateProfile] Syncing existing on-chain profile to Supabase...');
        
        // Get token URI from contract
        const tokenURI = await publicClient.readContract({
          address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: ProfileNFTABI,
          functionName: 'tokenURI',
          args: [profileId],
        }) as string;

        // Insert into Supabase
        const insertData = {
          wallet: address.toLowerCase(),
          profile_id: profileId.toString(),
          token_uri: tokenURI,
          display_name: formData.displayName,
          username: formData.username,
          bio: null,
          avatar_url: formData.avatarUrl || null,
          banner_url: formData.bannerUrl || null,
          twitter_handle: null,
          discord_handle: null,
          website_url: null,
        };

        const { error: dbError } = await supabase
          .from('profiles')
          .insert(insertData);

        if (dbError) {
          console.error('[CreateProfile] Supabase error:', dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }

        setSuccess('Profile synced successfully! Redirecting to dashboard...');
        showProfileCreatedNotification(profileId, '0x0'); // No tx hash for sync
        
        // Refresh the auth context to update hasProfile
        await refreshProfile();
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        // No profile on-chain, create new one
        const tokenURI = await generateMetadata();
        setGeneratedTokenURI(tokenURI);
        
        console.log('[CreateProfile] Creating new profile on-chain...');
        
        // Call createProfile on the contract
        writeContract({
          args: [tokenURI],
        });
      }
    } catch (err) {
      console.error('Error creating/syncing profile:', err);
      const parsedError = parseContractError(err);
      
      // Check if profile already exists
      if (parsedError.message.includes('Profile exists')) {
        showErrorNotification('Profile Already Exists', 'You already have a profile. Redirecting to dashboard...');
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setError(parsedError.message);
        showErrorNotification('Profile Creation Failed', parsedError.message);
      }
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
        username: formData.username,
        bio: null, // Bio can be added later when editing profile
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
        setSuccess(`Profile created successfully! Redirecting to dashboard...`);
        showProfileCreatedNotification(profileId, txData.hash);
        
        // Refresh the auth context to update hasProfile
        await refreshProfile();
        
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
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

  // Show loading while checking for existing profile
  if (checkingExistingProfile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking profile status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Create Profile</h1>
          <p className="text-gray-600">
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
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g., Akira"
                maxLength={50}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                disabled={isLoading}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the main name shown on your profile
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="flex relative">
                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600">
                  @
                </span>
                <div className="flex-1 relative">
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="your_username"
                    minLength={3}
                    maxLength={20}
                    pattern="[a-z0-9_]+"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 pr-10"
                    disabled={isLoading}
                    required
                  />
                  {/* Username availability indicator */}
                  {formData.username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isCheckingUsername ? (
                        <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : usernameAvailable === true ? (
                        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : usernameAvailable === false ? (
                        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
                <p className="mt-1 text-xs text-gray-500">
                  3-20 characters, lowercase, letters, numbers, and underscores only
                </p>
                {formData.username.length >= 3 && usernameAvailable === false && (
                  <p className="mt-1 text-xs text-red-600">
                    This username is already taken
                  </p>
                )}
                {formData.username.length >= 3 && usernameAvailable === true && (
                  <p className="mt-1 text-xs text-green-600">
                    Username is available!
                  </p>
                )}
              </div>
            </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
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
