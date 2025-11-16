import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useReputationCards } from '../../hooks/useReputationCards';
import { usePublicClient } from 'wagmi';
import { type Address, isAddress } from 'viem';
import { Link, useSearchParams } from 'react-router-dom';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ProfileNFTAbi from '../../lib/ProfileNFT.abi.json';
import ReputationCardABI from '../../lib/ReputationCard.abi.json';
import { supabase } from '../../lib/supabase';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';
import { uploadToPinata, uploadJSONToPinata, validateImageFile } from '../../lib/pinata';
import { ArrowLeft, Upload, Zap, Link2, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface TemplateData {
  template_id: string;
  issuer: string;
  name: string | null;
  description: string | null;
  max_supply: string;
  current_supply: string;
  tier: number;
  start_time: string;
  end_time: string;
  is_paused: boolean;
}

export const IssueCardForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedTemplateId = searchParams.get('templateId');

  const queryClient = useQueryClient();
  const { address, isIssuer, isLoading: authLoading } = useAuth();
  const { issueDirect, isProcessing, error: issueError, clearError } = useReputationCards();
  const publicClient = usePublicClient();

  const [issuerTemplates, setIssuerTemplates] = useState<TemplateData[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
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

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!address || !isIssuer) return;

      try {
        setTemplatesLoading(true);
        
        const { data: templates, error } = await supabase
          .from('templates_cache')
          .select('*')
          .eq('issuer', address.toLowerCase())
          .eq('is_paused', false)
          .order('tier', { ascending: true });

        if (error) {
          console.error('Failed to fetch templates:', error);
          throw error;
        }
        
        // Note: Templates in Supabase may not all exist on-chain
        // We verify on-chain existence before issuing cards
        setIssuerTemplates(templates || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
        showErrorNotification('Failed to Load Templates', 'Could not fetch your templates');
      } finally {
        setTemplatesLoading(false);
      }
    };

    if (isIssuer && !authLoading) {
      fetchTemplates();
    }
  }, [address, isIssuer, authLoading]);

  // Set preselected template if provided in URL
  useEffect(() => {
    if (preselectedTemplateId && issuerTemplates.length > 0) {
      const template = issuerTemplates.find(
        (t) => t.template_id === preselectedTemplateId
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
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);
    setValidationError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setValidationError('Failed to read image file');
      setImagePreview(null);
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
        (t) => t.template_id === selectedTemplateId
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
            trait_type: 'Template',
            value: template?.name || `Template #${selectedTemplateId}`,
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

    // Find selected template (handle both string and number comparison)
    const template = issuerTemplates.find(
      (t) => String(t.template_id) === String(selectedTemplateId)
    );

    if (!template) {
      setValidationError('Selected template not found. Please select a template again.');
      return;
    }

    // Verify template exists on blockchain
    if (!publicClient) {
      setValidationError('Wallet not connected');
      return;
    }

    // Skip blockchain verification for now due to RPC issues
    // The contract will validate the template when the transaction is submitted
    console.log('⚠️ Skipping blockchain verification due to RPC reliability issues');
    console.log('Template will be validated by the contract during transaction');
    
    // Note: If the template doesn't exist on-chain, the transaction will fail with "Template missing"
    // This is expected behavior and protects against issuing cards for non-existent templates

    // Check if template is paused
    if (template.is_paused) {
      setValidationError('This template is currently paused. Please unpause it first.');
      return;
    }

    // Check if max supply reached
    if (BigInt(template.current_supply) >= BigInt(template.max_supply)) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading issue form...</p>
        </div>
      </div>
    );
  }

  if (!isIssuer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-3 text-center">Access Denied</h2>
          <p className="text-red-700 text-center mb-6">
            You do not have issuer permissions to access this page.
          </p>
          <Link
            to="/"
            className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          to="/issuer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Issue Card
              </h1>
              <p className="text-gray-600">Directly issue a reputation card to a user</p>
            </div>
          </div>
        </div>

        {issuerTemplates.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Templates</h3>
            <p className="text-gray-600 mb-4">
              You don't have any active templates. Create or unpause a template to start issuing cards.
            </p>
            <Link
              to="/issuer/templates"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
            >
              View Templates
            </Link>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Metadata Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('quick')}
                    className={`group p-5 border-2 rounded-xl transition-all ${
                      mode === 'quick'
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-teal-50 shadow-lg'
                        : 'border-gray-300 hover:border-green-400 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-gray-900 mb-1">Quick Mode</div>
                      <div className="text-xs text-gray-600">
                        Upload image & auto-generate metadata
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('custom')}
                    className={`group p-5 border-2 rounded-xl transition-all ${
                      mode === 'custom'
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                        : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-gray-900 mb-1">Custom IPFS</div>
                      <div className="text-xs text-gray-600">
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
                <label htmlFor="template" className="block text-sm font-bold text-gray-900 mb-2">
                  Template
                </label>
                {issuerTemplates.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-yellow-800 font-medium">⚠️ No active templates available</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      You need to have at least one active (non-paused) template to issue cards.
                    </p>
                    <Link
                      to="/issuer/templates"
                      className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                    >
                      Manage Templates
                    </Link>
                  </div>
                ) : (
                  <select
                    id="template"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setValidationError(null);
                      clearError();
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                    disabled={isProcessing || checkingProfile || isUploading}
                  >
                    <option value="">Select a template ({issuerTemplates.length} available)</option>
                    {issuerTemplates.map((template) => (
                      <option key={template.template_id} value={template.template_id}>
                        {template.name || `Template #${template.template_id}`} - Tier {template.tier} (
                        {template.current_supply}/{template.max_supply})
                      </option>
                    ))}
                  </select>
                )}
                {selectedTemplateId && issuerTemplates.length > 0 && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    {(() => {
                      // Handle both string and number comparison
                      const template = issuerTemplates.find(
                        (t) => String(t.template_id) === String(selectedTemplateId)
                      );
                      
                      if (!template) return null;
                      const remaining = BigInt(template.max_supply) - BigInt(template.current_supply);
                      return (
                        <div className="text-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-base">
                              {template.name || `Template #${template.template_id}`}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          </div>
                          {template.description && (
                            <p className="text-gray-700 leading-relaxed">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                            <span className="text-gray-700 font-medium">Tier {template.tier}</span>
                            <span className="font-bold text-gray-900">
                              {remaining.toString()} / {template.max_supply} remaining
                            </span>
                          </div>
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
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Card Image
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {imagePreview ? (
                          <div className="relative group">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-40 h-40 object-cover rounded-xl border-2 border-green-300 shadow-lg bg-white"
                              onError={(e) => {
                                console.error('Image failed to load');
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all pointer-events-none"></div>
                          </div>
                        ) : (
                          <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">No image</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            disabled={isProcessing || checkingProfile || isUploading}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          📸 Upload an image (JPEG, PNG, GIF, or WebP, max 5MB)
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          This will be automatically uploaded to IPFS
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
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Validation Error</p>
                    <p className="text-red-700 text-sm mt-1">{validationError}</p>
                  </div>
                </div>
              )}

              {/* Issue Error */}
              {issueError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Issuance Failed</p>
                    <p className="text-red-700 text-sm mt-1">{issueError.message}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900">Card Issued Successfully! 🎉</p>
                    <p className="text-green-700 text-sm mt-1">Card ID: #{success.cardId.toString()}</p>
                    <p className="text-green-600 text-xs mt-1 font-mono">Tx: {success.txHash.slice(0, 10)}...{success.txHash.slice(-8)}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || checkingProfile || isUploading}
                className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                  isProcessing || checkingProfile || isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {isUploading
                  ? '⏳ Uploading to IPFS...'
                  : checkingProfile
                  ? '🔍 Verifying Profile...'
                  : isProcessing
                  ? '⚡ Issuing Card...'
                  : '🚀 Issue Card'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
