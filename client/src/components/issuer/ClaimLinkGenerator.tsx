import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWalletClient, usePublicClient } from 'wagmi';
import { type Address, isAddress } from 'viem';
import { Link } from 'react-router-dom';
import { REPUTATION_CARD_CONTRACT_ADDRESS, PROFILE_NFT_CONTRACT_ADDRESS } from '../../lib/contracts';
import ProfileNFTAbi from '../../lib/ProfileNFT.abi.json';
import { getClaimTypedData, generateClaimLink } from '../../lib/signature';
import type { ClaimParams } from '../../types/claim';
import { supabase } from '../../lib/supabase';
import { uploadToPinata, uploadJSONToPinata, validateImageFile } from '../../lib/pinata';
import { Zap, Link2, Upload, Image as ImageIcon } from 'lucide-react';

// Lazy load QRCode library
const loadQRCode = () => import('qrcode');

interface Template {
  template_id: number;
  issuer: string;
  name: string;
  description: string;
  tier: number;
  max_supply: number;
  current_supply: number;
  is_paused: boolean;
}

export const ClaimLinkGenerator: React.FC = () => {
  const { address, isIssuer, isLoading: authLoading } = useAuth();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [userAddress, setUserAddress] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [nonce, setNonce] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  
  // Mode selection and Quick Mode fields
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!address) {
        setTemplatesLoading(false);
        return;
      }

      try {
        setTemplatesLoading(true);
        const { data, error } = await supabase
          .from('templates_cache')
          .select('*')
          .eq('issuer', address.toLowerCase())
          .order('template_id', { ascending: true });

        if (error) {
          console.error('[ClaimLinkGenerator] Error fetching templates:', error);
          setTemplates([]);
        } else {
          setTemplates(data || []);
        }
      } catch (err) {
        console.error('[ClaimLinkGenerator] Error fetching templates:', err);
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [address]);

  // Filter templates where issuer matches connected wallet
  const issuerTemplates = templates;

  const validateUserAddress = (addr: string): boolean => {
    if (!addr) {
      setValidationError('User address is required');
      return false;
    }
    if (!isAddress(addr)) {
      setValidationError('Invalid Ethereum address format');
      return false;
    }
    return true;
  };

  const checkUserProfile = async (addr: Address): Promise<Address | null> => {
    if (!publicClient) {
      setValidationError('Wallet not connected');
      return null;
    }

    try {
      setCheckingProfile(true);
      const profileId = (await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as Address,
        abi: ProfileNFTAbi,
        functionName: 'addressToProfileId',
        args: [addr],
      })) as bigint;

      if (profileId === 0n) {
        setValidationError('User does not have a profile. They must create one first.');
        return null;
      }

      // Get profile owner (should be the same as user address for ProfileNFT)
      const profileOwner = (await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as Address,
        abi: ProfileNFTAbi,
        functionName: 'ownerOf',
        args: [profileId],
      })) as Address;

      return profileOwner;
    } catch (err) {
      console.error('Error checking user profile:', err);
      setValidationError('Failed to verify user profile');
      return null;
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setGeneratedLink(null);
    setQrCodeDataUrl(null);

    // Validate inputs
    if (!validateUserAddress(userAddress)) {
      return;
    }

    if (!selectedTemplateId) {
      setValidationError('Please select a template');
      return;
    }

    // Mode-specific validation
    if (mode === 'quick') {
      if (!title.trim()) {
        setValidationError('Card title is required');
        return;
      }
      if (!description.trim()) {
        setValidationError('Description is required');
        return;
      }
      if (!imageFile) {
        setValidationError('Please upload an image');
        return;
      }
    } else {
      if (!tokenURI.trim()) {
        setValidationError('Token URI is required');
        return;
      }
    }

    // Check if user has a profile
    const profileOwner = await checkUserProfile(userAddress as Address);
    if (!profileOwner) {
      return;
    }

    // Find selected template
    const template = issuerTemplates.find(
      (t) => t.template_id.toString() === selectedTemplateId
    );

    if (!template) {
      setValidationError('Selected template not found');
      return;
    }

    // Check if template is paused
    if (template.is_paused) {
      setValidationError('This template is currently paused and cannot be used');
      return;
    }

    if (!walletClient || !address) {
      setValidationError('Wallet not connected');
      return;
    }

    try {
      let finalTokenURI = tokenURI;

      // Handle Quick Mode - upload to IPFS
      if (mode === 'quick' && imageFile) {
        setIsUploading(true);
        
        try {
          // Upload image to Pinata
          const imageUrl = await uploadToPinata(imageFile);
          
          // Create metadata JSON
          const metadata = {
            name: title,
            description: description,
            image: imageUrl,
            attributes: [
              {
                trait_type: 'Template',
                value: template.name || `Template #${template.template_id}`,
              },
              {
                trait_type: 'Tier',
                value: template.tier,
              },
              {
                trait_type: 'Issuer',
                value: address,
              },
            ],
          };

          // Upload metadata JSON to Pinata
          finalTokenURI = await uploadJSONToPinata(metadata, `${title}-metadata`);
        } catch (uploadError: any) {
          console.error('Error uploading to IPFS:', uploadError);
          setValidationError(`Failed to upload to IPFS: ${uploadError.message}`);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      setIsSigning(true);

      // Generate unique nonce
      const generatedNonce = BigInt(Date.now());

      // Construct claim parameters
      const claimParams: ClaimParams = {
        user: userAddress as Address,
        profileOwner: profileOwner,
        templateId: BigInt(selectedTemplateId),
        nonce: generatedNonce,
        tokenURI: finalTokenURI.trim(),
      };

      // Get typed data for EIP712 signature
      const typedData = getClaimTypedData(claimParams, REPUTATION_CARD_CONTRACT_ADDRESS as Address);

      // Sign the typed data
      const signature = await walletClient.signTypedData({
        account: address,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      // Generate claim link
      const baseUrl = window.location.origin;
      const claimLink = generateClaimLink(baseUrl, claimParams, signature);

      setGeneratedLink(claimLink);

      // Generate QR code (lazy loaded)
      try {
        const QRCode = await loadQRCode();
        const qrDataUrl = await QRCode.default.toDataURL(claimLink, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // QR code generation is optional, so we don't fail the whole operation
      }
    } catch (err: any) {
      console.error('Error generating claim link:', err);
      if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
        setValidationError('Signature request was rejected');
      } else {
        setValidationError('Failed to generate claim link. Please try again.');
      }
    } finally {
      setIsSigning(false);
      setIsUploading(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        // Could add a toast notification here
        alert('Claim link copied to clipboard!');
      } catch (err) {
        console.error('Error copying to clipboard:', err);
        alert('Failed to copy link. Please copy manually.');
      }
    }
  };

  const handleReset = () => {
    setUserAddress('');
    setSelectedTemplateId('');
    setNonce('');
    setTokenURI('');
    setTitle('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setGeneratedLink(null);
    setQrCodeDataUrl(null);
    setValidationError(null);
  };

  if (authLoading || templatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isIssuer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            You do not have issuer permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate Claim Link</h1>
            <p className="text-gray-600 mt-2">Create a shareable link for users to claim cards</p>
          </div>
          <Link
            to="/issuer"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {issuerTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates available</h3>
            <p className="mt-2 text-gray-600">
              You don't have any templates yet. Contact an admin to create templates for you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Link Details</h2>
              <form onSubmit={handleGenerateLink} className="space-y-4">
                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Metadata Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('quick')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        mode === 'quick'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Zap className={`w-6 h-6 mx-auto mb-2 ${mode === 'quick' ? 'text-green-600' : 'text-gray-400'}`} />
                      <p className={`font-semibold text-sm ${mode === 'quick' ? 'text-green-900' : 'text-gray-700'}`}>
                        Quick Mode
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Upload image & auto-generate metadata</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('custom')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        mode === 'custom'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Link2 className={`w-6 h-6 mx-auto mb-2 ${mode === 'custom' ? 'text-purple-600' : 'text-gray-400'}`} />
                      <p className={`font-semibold text-sm ${mode === 'custom' ? 'text-purple-900' : 'text-gray-700'}`}>
                        Custom IPFS
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Use your own pre-made token URI</p>
                    </button>
                  </div>
                </div>

                {/* User Address */}
                <div>
                  <label htmlFor="userAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    id="userAddress"
                    value={userAddress}
                    onChange={(e) => {
                      setUserAddress(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSigning || checkingProfile || isUploading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The wallet address of the user who can claim this card
                  </p>
                </div>

                {/* Template Selection */}
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    id="template"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSigning || checkingProfile || isUploading}
                  >
                    <option value="">Select a template ({issuerTemplates.length} available)</option>
                    {issuerTemplates.map((template) => (
                      <option 
                        key={template.template_id} 
                        value={template.template_id}
                        disabled={template.is_paused}
                      >
                        {template.name} - Tier {template.tier} {template.is_paused ? '(Paused)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Mode Fields */}
                {mode === 'quick' && (
                  <>
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Card Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Early Adopter Badge"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSigning || checkingProfile || isUploading}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this card represents..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={isSigning || checkingProfile || isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        {imagePreview ? (
                          <div className="space-y-3">
                            <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                              disabled={isSigning || checkingProfile || isUploading}
                            >
                              Remove Image
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const validationError = validateImageFile(file, 10);
                                  if (validationError) {
                                    setValidationError(validationError);
                                    return;
                                  }
                                  setImageFile(file);
                                  setImagePreview(URL.createObjectURL(file));
                                  setValidationError(null);
                                }
                              }}
                              className="hidden"
                              disabled={isSigning || checkingProfile || isUploading}
                            />
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Click to upload image</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                          </label>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Custom IPFS Mode Fields */}
                {mode === 'custom' && (
                  <div>
                    <label htmlFor="tokenURI" className="block text-sm font-medium text-gray-700 mb-2">
                      Token URI
                    </label>
                    <input
                      type="text"
                      id="tokenURI"
                      value={tokenURI}
                      onChange={(e) => {
                        setTokenURI(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="ipfs://... or https://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSigning || checkingProfile || isUploading}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      The metadata URI for this card
                    </p>
                  </div>
                )}

                {/* Validation Error */}
                {validationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{validationError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSigning || checkingProfile || isUploading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                    isSigning || checkingProfile || isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUploading
                    ? 'Uploading to IPFS...'
                    : checkingProfile
                    ? 'Verifying Profile...'
                    : isSigning
                    ? 'Signing...'
                    : 'Generate Claim Link'}
                </button>
              </form>
            </div>

            {/* Generated Link Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Link</h2>
              {!generatedLink ? (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <p className="mt-2">Fill out the form to generate a claim link</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* QR Code */}
                  {qrCodeDataUrl && (
                    <div className="flex justify-center">
                      <img src={qrCodeDataUrl} alt="Claim Link QR Code" className="rounded-lg" />
                    </div>
                  )}

                  {/* Link Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Claim Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Share this link with the user</li>
                      <li>They can scan the QR code or click the link</li>
                      <li>The user must connect their wallet to claim</li>
                      <li>Each link can only be used once</li>
                    </ul>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Generate Another Link
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
