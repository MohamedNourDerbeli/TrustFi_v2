import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWalletClient } from 'wagmi';
import { type Address } from 'viem';
import { Link } from 'react-router-dom';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import { getClaimTypedData, generateClaimLink } from '../../lib/signature';
import type { ClaimParams } from '../../types/claim';
import { supabase } from '../../lib/supabase';
import { useTemplates } from '../../hooks/useTemplates';
import { uploadToPinata, uploadJSONToPinata, validateImageFile } from '../../lib/pinata';
import { Zap, Link2, Image as ImageIcon, Copy, Check, QrCode, ArrowLeft, Upload, FileText, Sparkles, AlertCircle, X } from 'lucide-react';

// Lazy load QRCode library
const loadQRCode = () => import('qrcode');

export const ClaimLinkGenerator: React.FC = () => {
  const { address, isIssuer, isLoading: authLoading } = useAuth();
  const { data: walletClient } = useWalletClient();
  // Use on-chain templates (includeAll=true for issuer to view paused templates too)
  const { templates: chainTemplates, loading: templatesLoading } = useTemplates(null, true);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [nonce, setNonce] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mode selection and Quick Mode fields
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter templates for this issuer directly from on-chain data
  const issuerTemplates = (chainTemplates || []).filter(t => t.issuer.toLowerCase() === address?.toLowerCase());

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setGeneratedLink(null);
    setQrCodeDataUrl(null);

    if (!selectedTemplateId) {
      setValidationError('Please select a template');
      return;
    }

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

    if (!walletClient || !address) {
      setValidationError('Wallet not connected');
      return;
    }

    try {
      setIsSigning(true);

      let finalTokenURI = tokenURI;

      // Handle Quick Mode - upload image & metadata to IPFS
      if (mode === 'quick' && imageFile) {
        setIsUploading(true);
        try {
          const imageUrl = await uploadToPinata(imageFile);
          const metadata = {
            name: title,
            description: description,
            image: imageUrl,
            attributes: [
              { trait_type: 'Template', value: selectedTemplateId },
              { trait_type: 'Issuer', value: address },
            ],
          };
          finalTokenURI = await uploadJSONToPinata(metadata);
        } catch (err: any) {
          console.error('IPFS upload error:', err);
          setValidationError(`Failed to upload: ${err.message}`);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Generate unique nonce
      const generatedNonce = BigInt(Date.now());
      setNonce(generatedNonce.toString());

      // Placeholder address (users claim via link, not pre-defined)
      const placeholderUser = '0x0000000000000000000000000000000000000000' as Address;

      // Construct claim params
      const claimParams: ClaimParams = {
        user: placeholderUser,
        profileOwner: placeholderUser,
        templateId: BigInt(selectedTemplateId),
        nonce: generatedNonce,
        tokenURI: finalTokenURI.trim(),
      };

      // Get typed data & sign
      const typedData = getClaimTypedData(claimParams, REPUTATION_CARD_CONTRACT_ADDRESS as Address);
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

      // Save to Supabase
      const { error: dbError } = await supabase.from('claim_links').insert([
        {
          template_id: Number(selectedTemplateId),
          title,
          description,
          image_url: mode === 'quick' && imageFile ? URL.createObjectURL(imageFile) : null,
          token_uri: finalTokenURI,
          claim_url: claimLink,
          nonce: generatedNonce.toString(),
          signature,
          created_by: address,
        },
      ]);

      if (dbError) {
        console.error('Error inserting claim link into DB:', dbError);
        setValidationError('Failed to save claim link to DB.');
      }

      // Generate QR code (optional)
      try {
        const QRCode = await loadQRCode();
        const qrDataUrl = await QRCode.default.toDataURL(claimLink, { width: 300, margin: 2 });
        setQrCodeDataUrl(qrDataUrl);
      } catch (err) {
        console.warn('QR code generation failed', err);
      }
    } catch (err: any) {
      console.error('Error generating claim link:', err);
      setValidationError('Failed to generate claim link.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleReset = () => {
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
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || templatesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isIssuer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md border border-white/20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 mb-6">You do not have issuer permissions to access this page.</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <Link
            to="/issuer"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Link2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Generate Claim Link
              </h1>
              <p className="text-gray-600 mt-1">Create shareable links for reputation cards</p>
            </div>
          </div>
        </div>

        {issuerTemplates.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 text-center border border-white/20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Templates Available</h3>
            <p className="text-gray-600 mb-6">Create a template first to generate claim links.</p>
            <Link
              to="/issuer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 animate-slideUp">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Create Claim Link
                </h2>

                {/* Mode Toggle */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Generation Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('quick')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        mode === 'quick'
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className={`w-5 h-5 ${mode === 'quick' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`font-semibold ${mode === 'quick' ? 'text-blue-900' : 'text-gray-700'}`}>
                          Quick Mode
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Upload image & auto-generate metadata</p>
                      {mode === 'quick' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setMode('custom')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        mode === 'custom'
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className={`w-5 h-5 ${mode === 'custom' ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={`font-semibold ${mode === 'custom' ? 'text-purple-900' : 'text-gray-700'}`}>
                          Custom URI
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Provide your own token URI</p>
                      {mode === 'custom' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleGenerateLink} className="space-y-5">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Template *
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white"
                    >
                      <option value="">Choose a template...</option>
                      {issuerTemplates.map((t) => (
                        <option key={t.templateId.toString()} value={t.templateId.toString()}>
                          {t.name} - Tier {t.tier} {t.isPaused ? '(Paused)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Mode Fields */}
                  {mode === 'quick' && (
                    <div className="space-y-5 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Card Title *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter card title..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          placeholder="Describe this card..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Card Image *
                        </label>
                        
                        {!imagePreview ? (
                          <label className="block cursor-pointer">
                            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center">
                              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                              <p className="text-sm font-semibold text-gray-700 mb-1">
                                Click to upload image
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const error = validateImageFile(file, 10);
                                if (error) {
                                  setValidationError(error);
                                  return;
                                }
                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                                setValidationError(null);
                              }}
                            />
                          </label>
                        ) : (
                          <div className="relative group">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-xl border-2 border-blue-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Mode Fields */}
                  {mode === 'custom' && (
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Token URI *
                      </label>
                      <input
                        type="text"
                        placeholder="ipfs://... or https://..."
                        value={tokenURI}
                        onChange={(e) => setTokenURI(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* Validation Error */}
                  {validationError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800 font-medium">{validationError}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSigning || isUploading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg relative overflow-hidden ${
                      isSigning || isUploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl transform hover:-translate-y-1'
                    }`}
                  >
                    {!isSigning && !isUploading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    
                    <span className="relative flex items-center justify-center gap-2">
                      {isSigning || isUploading ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {isUploading ? 'Uploading to IPFS...' : 'Generating Link...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Claim Link
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Result */}
            <div>
              {generatedLink ? (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 animate-fadeIn space-y-6">
                  {/* Success Header */}
                  <div className="text-center pb-6 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Check className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Generated!</h2>
                    <p className="text-gray-600">Share this link to let users claim cards</p>
                  </div>

                  {/* QR Code */}
                  {qrCodeDataUrl && (
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Scan to claim
                      </p>
                    </div>
                  )}

                  {/* Link Display */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Link</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Link
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl p-12 border border-white/20 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Link2 className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Link Generated Yet</h3>
                  <p className="text-gray-500">Fill out the form and click generate to create a claim link</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
