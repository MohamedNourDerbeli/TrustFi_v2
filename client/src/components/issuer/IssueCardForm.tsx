import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useTemplates } from '../../hooks/useTemplates';
import { useReputationCards } from '../../hooks/useReputationCards';
import { usePublicClient } from 'wagmi';
import { type Address, isAddress } from 'viem';
import { Link, useSearchParams } from 'react-router-dom';
import { PROFILE_NFT_CONTRACT_ADDRESS } from '../../lib/contracts';
import ProfileNFTAbi from '../../lib/ProfileNFT.abi.json';
import { parseContractError } from '../../lib/errors';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';
import { uploadToPinata, uploadJSONToPinata, validateImageFile } from '../../lib/pinata';

export const IssueCardForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedTemplateId = searchParams.get('templateId');

  const queryClient = useQueryClient();
  const { address, isIssuer, isLoading: authLoading } = useAuth();
  const { templates, loading: templatesLoading } = useTemplates();
  const { issueDirect, isProcessing, error: issueError, clearError } = useReputationCards();
  const publicClient = usePublicClient();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ cardId: bigint; txHash: string } | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  
  // New fields for Quick Mode
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter templates where issuer matches connected wallet
  const issuerTemplates = templates.filter(
    (template) => template.issuer.toLowerCase() === address?.toLowerCase()
  );

  // Set preselected template if provided in URL
  useEffect(() => {
    if (preselectedTemplateId && issuerTemplates.length > 0) {
      const template = issuerTemplates.find(
        (t) => t.templateId.toString() === preselectedTemplateId
      );
      if (template) {
        setSelectedTemplateId(preselectedTemplateId);
      }
    }
  }, [preselectedTemplateId, issuerTemplates.length]);

  const validateRecipientAddress = (addr: string): boolean => {
    if (!addr) {
      setValidationError('Recipient address is required');
      return false;
    }
    if (!isAddress(addr)) {
      setValidationError('Invalid Ethereum address format');
      return false;
    }
    return true;
  };

  const checkRecipientProfile = async (addr: Address): Promise<boolean> => {
    if (!publicClient) {
      setValidationError('Wallet not connected');
      return false;
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
        setValidationError('Recipient does not have a profile. They must create one first.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error checking recipient profile:', err);
      setValidationError('Failed to verify recipient profile');
      return false;
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file, 5);
    if (error) {
      setValidationError(error);
      return;
    }

    setImageFile(file);
    setValidationError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateMetadataAndUpload = async (): Promise<string> => {
    if (!imageFile) {
      throw new Error('No image file selected');
    }

    setIsUploading(true);
    try {
      // Upload image to IPFS
      const imageUrl = await uploadToPinata(imageFile);

      // Get template info for metadata
      const template = issuerTemplates.find(
        (t) => t.templateId.toString() === selectedTemplateId
      );

      // Create NFT metadata
      const metadata = {
        name: title,
        description: description,
        image: imageUrl,
        attributes: [
          {
            trait_type: 'Tier',
            value: template?.tier || 1,
          },
          {
            trait_type: 'Template ID',
            value: selectedTemplateId,
          },
          {
            trait_type: 'Issuer',
            value: address,
          },
        ],
      };

      // Upload metadata to IPFS
      const metadataUrl = await uploadJSONToPinata(metadata);
      return metadataUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(null);
    clearError();

    // Validate inputs
    if (!validateRecipientAddress(recipientAddress)) {
      return;
    }

    if (!selectedTemplateId) {
      setValidationError('Please select a template');
      return;
    }

    // Validate based on mode
    let finalTokenURI = tokenURI;
    
    if (mode === 'quick') {
      if (!title.trim()) {
        setValidationError('Title is required in Quick Mode');
        return;
      }
      if (!description.trim()) {
        setValidationError('Description is required in Quick Mode');
        return;
      }
      if (!imageFile) {
        setValidationError('Image is required in Quick Mode');
        return;
      }

      // Generate and upload metadata
      try {
        finalTokenURI = await generateMetadataAndUpload();
      } catch (err: any) {
        setValidationError(err.message || 'Failed to upload metadata');
        return;
      }
    } else {
      if (!tokenURI.trim()) {
        setValidationError('Token URI is required in Custom Mode');
        return;
      }
    }

    // Check if recipient has a profile
    const hasProfile = await checkRecipientProfile(recipientAddress as Address);
    if (!hasProfile) {
      return;
    }

    // Find selected template
    const template = issuerTemplates.find(
      (t) => t.templateId.toString() === selectedTemplateId
    );

    if (!template) {
      setValidationError('Selected template not found');
      return;
    }

    // Check if template is paused
    if (template.isPaused) {
      setValidationError('This template is currently paused. Please unpause it first.');
      return;
    }

    // Check if max supply reached
    if (template.currentSupply >= template.maxSupply) {
      setValidationError('This template has reached its maximum supply.');
      return;
    }

    try {
      const result = await issueDirect({
        recipient: recipientAddress as Address,
        templateId: BigInt(selectedTemplateId),
        tokenURI: finalTokenURI.trim(),
      });

      setSuccess({ cardId: result.cardId, txHash: result.txHash });
      
      // Show success notification
      showSuccessNotification({
        title: 'Card Issued Successfully!',
        message: `Card #${result.cardId.toString()} has been issued to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        txHash: result.txHash,
        duration: 6000,
      });

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      await queryClient.invalidateQueries({ queryKey: ['collectibles'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Reset form
      setRecipientAddress('');
      setSelectedTemplateId(preselectedTemplateId || '');
      setTokenURI('');
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Error issuing card:', err);
      // Show error notification
      if (err.message) {
        showErrorNotification('Card Issuance Failed', err.message);
      }
      // Error is also handled by the hook
    }
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
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Issue Card</h1>
            <p className="text-gray-600 mt-2">Directly issue a reputation card to a user</p>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Metadata Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('quick')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      mode === 'quick'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="font-semibold text-gray-900">Quick Mode</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Upload image & auto-generate metadata
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('custom')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      mode === 'custom'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔗</div>
                      <div className="font-semibold text-gray-900">Custom IPFS</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Use your own pre-made token URI
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  id="recipient"
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    setValidationError(null);
                    clearError();
                  }}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing || checkingProfile || isUploading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  The wallet address of the user who will receive the card
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
                    clearError();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing || checkingProfile || isUploading}
                >
                  <option value="">Select a template</option>
                  {issuerTemplates.map((template) => (
                    <option key={template.templateId.toString()} value={template.templateId.toString()}>
                      Template #{template.templateId.toString()} - Tier {template.tier} (
                      {template.currentSupply.toString()}/{template.maxSupply.toString()})
                      {template.isPaused ? ' - PAUSED' : ''}
                    </option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    {(() => {
                      const template = issuerTemplates.find(
                        (t) => t.templateId.toString() === selectedTemplateId
                      );
                      if (!template) return null;
                      return (
                        <div className="text-sm">
                          <p className="text-gray-700">
                            <span className="font-medium">Description:</span> {template.description}
                          </p>
                          <p className="text-gray-700 mt-1">
                            <span className="font-medium">Status:</span>{' '}
                            <span
                              className={
                                template.isPaused ? 'text-red-600 font-semibold' : 'text-green-600'
                              }
                            >
                              {template.isPaused ? 'Paused' : 'Active'}
                            </span>
                          </p>
                          <p className="text-gray-700 mt-1">
                            <span className="font-medium">Remaining:</span>{' '}
                            {(template.maxSupply - template.currentSupply).toString()} cards
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quick Mode Fields */}
              {mode === 'quick' && (
                <>
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Card Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="e.g., Early Adopter Badge"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing || checkingProfile || isUploading}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setValidationError(null);
                      }}
                      rows={3}
                      placeholder="Describe what this card represents..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing || checkingProfile || isUploading}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Image
                    </label>
                    <div className="flex items-start gap-4">
                      {imagePreview && (
                        <div className="flex-shrink-0">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isProcessing || checkingProfile || isUploading}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Upload an image (JPEG, PNG, GIF, or WebP, max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Custom Mode Fields */}
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
                      clearError();
                    }}
                    placeholder="ipfs://... or https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing || checkingProfile || isUploading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The metadata URI for this card (IPFS or HTTP URL)
                  </p>
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{validationError}</p>
                </div>
              )}

              {/* Issue Error */}
              {issueError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{issueError.message}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-semibold">Card issued successfully!</p>
                  <p className="text-green-600 mt-1">Card ID: {success.cardId.toString()}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || checkingProfile || isUploading}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                  isProcessing || checkingProfile || isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUploading
                  ? 'Uploading to IPFS...'
                  : checkingProfile
                  ? 'Verifying Profile...'
                  : isProcessing
                  ? 'Issuing Card...'
                  : 'Issue Card'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
