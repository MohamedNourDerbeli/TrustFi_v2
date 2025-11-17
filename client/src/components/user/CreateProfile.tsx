// components/user/CreateProfile.tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAccount,
  useContractWrite,
  useWaitForTransaction,
  usePublicClient
} from 'wagmi'
import { useAuth } from '../../hooks/useAuth'
import { PROFILE_NFT_CONTRACT_ADDRESS } from '../../lib/contracts'
import ProfileNFTABI from '../../lib/ProfileNFT.abi.json'
import { supabase } from '../../lib/supabase'
import { showErrorNotification } from '../../lib/notifications'
import {
  createProfileFlow,
  handleTransactionConfirmed,
  createInitialState,
  type CreateProfileState
} from '../../lib/createProfileFlow'
import { validateDisplayName, validateUsername } from '../../lib/validation'

interface ProfileFormData {
  displayName: string
  username: string
  avatarUrl: string
  bannerUrl: string
}

export function CreateProfile () {
  const { address } = useAccount()
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const publicClient = usePublicClient()

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    avatarUrl: '',
    bannerUrl: ''
  })

  const [flowState, setFlowState] =
    useState<CreateProfileState>(createInitialState)
  const [generatedTokenURI, setGeneratedTokenURI] = useState<string | null>(
    null
  )
  const [checkingExistingProfile, setCheckingExistingProfile] = useState(true)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  )

  const {
    write: writeContract,
    data: txData,
    isLoading: isPending
  } = useContractWrite({
    address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
    abi: ProfileNFTABI as any,
    functionName: 'createProfile'
  } as any)

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransaction({
      hash: txData?.hash
    })

  // Check existing profile on-chain & Supabase
  useEffect(() => {
    const checkAndSyncProfile = async () => {
      if (!address || !publicClient) return setCheckingExistingProfile(false)

      try {
        const profileId = (await publicClient.readContract({
          address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: ProfileNFTABI as any,
          functionName: 'addressToProfileId',
          args: [address]
        } as any)) as bigint

        if (profileId && profileId > 0n) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('wallet', address.toLowerCase())
            .maybeSingle()

          if (existingProfile) {
            showErrorNotification(
              'Profile Already Exists',
              'Redirecting to dashboard...'
            )
            setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
          } else {
            setFlowState(prev => ({
              ...prev,
              error:
                'Profile found on-chain! Please fill in your details to complete your profile setup.'
            }))
          }
        }
      } catch (err) {
        console.error('[CreateProfile] Error checking existing profile:', err)
      } finally {
        setCheckingExistingProfile(false)
      }
    }
    checkAndSyncProfile()
  }, [address, publicClient, navigate])

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) return setUsernameAvailable(null)
    setIsCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle()
      setUsernameAvailable(!data)
    } catch {
      setUsernameAvailable(null)
    } finally {
      setIsCheckingUsername(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) checkUsernameAvailability(formData.username)
      else setUsernameAvailable(null)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.username, checkUsernameAvailability])

  const validateForm = (): string | null => {
    // Validate display name
    const displayNameResult = validateDisplayName(formData.displayName);
    if (!displayNameResult.isValid) {
      return displayNameResult.error;
    }

    // Validate username
    const usernameResult = validateUsername(formData.username);
    if (!usernameResult.isValid) {
      return usernameResult.error;
    }

    // Additional username checks
    if (!formData.username.trim()) {
      return 'Username is required';
    }

    // Username must be lowercase
    if (formData.username !== formData.username.toLowerCase()) {
      return 'Username must be lowercase';
    }

    // Check username availability
    if (usernameAvailable === false) {
      return 'Username is already taken';
    }

    if (isCheckingUsername) {
      return 'Checking username availability...';
    }

    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFlowState(createInitialState)

    if (!address)
      return setFlowState({
        step: 'error',
        message: 'Please connect your wallet first',
        error: 'Please connect your wallet first'
      })
    if (!publicClient)
      return setFlowState({
        step: 'error',
        message: 'Network not ready',
        error: 'Network not ready'
      })

    const validationError = validateForm()
    if (validationError)
      return setFlowState({
        step: 'error',
        message: validationError,
        error: validationError
      })

    try {
      const tokenURI = await createProfileFlow(
        {
          address,
          publicClient,
          formData,
          writeContract,
          refreshProfile,
          navigate
        },
        setFlowState
      )
      if (tokenURI) setGeneratedTokenURI(tokenURI as string)
    } catch (err) {
      console.error('[CreateProfile] Flow error:', err)
    }
  }

  useEffect(() => {
    if (
      isConfirmed &&
      txData?.hash &&
      address &&
      publicClient &&
      generatedTokenURI
    ) {
      handleTransactionConfirmed(
        {
          address,
          publicClient,
          formData,
          writeContract,
          refreshProfile,
          navigate
        },
        txData.hash,
        generatedTokenURI,
        setFlowState
      )
    }
  }, [
    isConfirmed,
    txData,
    address,
    publicClient,
    generatedTokenURI,
    formData,
    refreshProfile,
    navigate
  ])

  const isLoading =
    isPending ||
    isConfirming ||
    [
      'validating',
      'checking',
      'generating_metadata',
      'uploading',
      'preparing',
      'signing',
      'confirming',
      'syncing_db'
    ].includes(flowState.step)

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize)
      return setFlowState({
        step: 'error',
        message: `${
          type === 'avatar' ? 'Avatar' : 'Banner'
        } image must be smaller than ${maxSize / 1024 / 1024}MB`,
        error: 'File too large'
      })
    
    // Create local preview URL immediately for instant feedback
    const localUrl = URL.createObjectURL(file)
    setFormData(prev => ({ ...prev, [type + 'Url']: localUrl }))
    
    // Upload to IPFS in background (non-blocking)
    try {
      const { uploadToPinata } = await import('../../lib/pinata')
      const ipfsUrl = await uploadToPinata(file)
      // Replace local URL with IPFS URL once uploaded
      setFormData(prev => ({ ...prev, [type + 'Url']: ipfsUrl }))
      // Clean up local URL
      URL.revokeObjectURL(localUrl)
    } catch {
      setFlowState({
        step: 'error',
        message: `Failed to upload ${type} to IPFS`,
        error: 'Upload failed'
      })
      // Keep the local preview even if IPFS upload fails
    }
  }

  if (checkingExistingProfile)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-900'>
        <div className='text-center text-white'>
          <div className='animate-spin border-b-2 border-blue-400 w-12 h-12 rounded-full mx-auto mb-4'></div>
          <p>Checking profile status...</p>
        </div>
      </div>
    )

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4'>
      <div className='max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-8'>
        {/* Header */}
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Create Your Profile
          </h1>
          <p className='text-gray-600'>
            Set up your TrustFi profile to start building your on-chain
            reputation
          </p>
        </div>

        {/* Progress Stepper */}
        {flowState.step !== 'idle' && (
          <div className='flex items-center space-x-4'>
            <span
              className={`px-3 py-1 rounded-full ${
                flowState.step === 'signing'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              1. Details
            </span>
            <span
              className={`px-3 py-1 rounded-full ${
                flowState.step === 'confirming'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              2. Confirm
            </span>
            <span
              className={`px-3 py-1 rounded-full ${
                flowState.step === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              3. Done
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className='grid md:grid-cols-2 gap-8'>
          {/* Banner + Avatar */}
          <div className='relative md:col-span-1 mb-16'>
            {/* Banner */}
            <div className='relative h-48 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-blue-800 to-purple-700 hover:scale-105 transition-transform'>
              {formData.bannerUrl ? (
                <img
                  src={formData.bannerUrl}
                  className='w-full h-full object-cover'
                  alt='Banner'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-white font-medium'>
                  Upload Banner
                </div>
              )}
              <input
                type='file'
                accept='image/*'
                onChange={e =>
                  e.target.files &&
                  handleFileUpload(e.target.files[0], 'banner')
                }
                className='absolute inset-0 opacity-0 cursor-pointer'
              />
            </div>

            {/* Avatar */}
            <div className='absolute -bottom-14 left-8 w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-lg bg-gray-300 hover:scale-105 transition-transform'>
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  className='w-full h-full object-cover'
                  alt='Avatar'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-gray-500 text-xs'>
                  Avatar
                </div>
              )}
              <input
                type='file'
                accept='image/*'
                onChange={e =>
                  e.target.files &&
                  handleFileUpload(e.target.files[0], 'avatar')
                }
                className='absolute inset-0 opacity-0 cursor-pointer'
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className='md:col-span-1 flex flex-col justify-center space-y-6'>
            {/* Display Name */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Display Name <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.displayName}
                onChange={e =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder='Your name'
                maxLength={50}
                className='mt-1 w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {/* Username */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Username <span className='text-red-500'>*</span>
              </label>
              <div className='relative mt-1'>
                <span className='absolute left-2 top-1/2 -translate-y-1/2 text-gray-500'>
                  @
                </span>
                <input
                  type='text'
                  value={formData.username}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      username: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '')
                    })
                  }
                  placeholder='username'
                  minLength={3}
                  maxLength={20}
                  className='pl-6 w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  {isCheckingUsername ? (
                    <div className='animate-spin h-5 w-5 border-2 border-gray-400 rounded-full'></div>
                  ) : usernameAvailable === true ? (
                    <span className='text-green-500 font-bold'>✓</span>
                  ) : usernameAvailable === false ? (
                    <span className='text-red-500 font-bold'>✕</span>
                  ) : null}
                </div>
              </div>
              {usernameAvailable === false && (
                <p className='text-xs text-red-600 mt-1'>
                  Username already taken
                </p>
              )}
              {usernameAvailable === true && (
                <p className='text-xs text-green-600 mt-1'>
                  Username is available!
                </p>
              )}
            </div>

            {/* Flow Messages */}
            {flowState.step !== 'idle' &&
              flowState.step !== 'error' &&
              flowState.message && (
                <div className='p-3 bg-blue-50 text-blue-600 rounded-lg flex items-center space-x-2'>
                  <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                      fill='none'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  <span>{flowState.message}</span>
                </div>
              )}

            {flowState.step === 'error' && (
              <div className='p-3 bg-red-50 text-red-600 rounded-lg'>
                {flowState.error}
              </div>
            )}
            {flowState.step === 'success' && (
              <div className='p-3 bg-green-50 text-green-600 rounded-lg'>
                {flowState.message}
              </div>
            )}

            {/* Submit */}
            <button
              type='submit'
              disabled={isLoading || !address}
              className='w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 transition-colors'
            >
              {isLoading ? 'Processing...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
