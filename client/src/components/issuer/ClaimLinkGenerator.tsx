import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWalletClient, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { Link } from 'react-router-dom';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import { getClaimTypedData, generateClaimLink } from '../../lib/signature';
import type { ClaimParams } from '../../types/claim';
import { supabase } from '../../lib/supabase';
import { uploadToPinata, uploadJSONToPinata, validateImageFile } from '../../lib/pinata';
import { Zap, Link2, Image as ImageIcon } from 'lucide-react';

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

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [nonce, setNonce] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

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

  const issuerTemplates = templates;

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
          finalTokenURI = await uploadJSONToPinata(metadata, `${title}-metadata`);
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
          <p className="text-red-700">You do not have issuer permissions to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Generate Claim Link</h1>
          <Link
            to="/issuer"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {issuerTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No templates available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select a template</option>
                    {issuerTemplates.map((t) => (
                      <option key={t.template_id} value={t.template_id}>
                        {t.name} - Tier {t.tier} {t.is_paused ? '(Paused)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Mode */}
                {mode === 'quick' && (
                  <>
                    <input
                      type="text"
                      placeholder="Card title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <textarea
                      placeholder="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const error = validateImageFile(file, 10);
                          if (error) return setValidationError(error);
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Custom Mode */}
                {mode === 'custom' && (
                  <input
                    type="text"
                    placeholder="Token URI"
                    value={tokenURI}
                    onChange={(e) => setTokenURI(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                )}

                {validationError && <p className="text-red-600">{validationError}</p>}

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">
                  {isSigning ? 'Generating...' : 'Generate Claim Link'}
                </button>
              </form>
            </div>

            {/* Generated Link */}
            {generatedLink && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-2">Claim Link</h2>
                {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto mb-2" />}
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg mb-2"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                  className="w-full bg-gray-200 py-2 rounded-lg"
                >
                  Copy Link
                </button>
                <button
                  onClick={handleReset}
                  className="w-full bg-gray-100 py-2 rounded-lg mt-2"
                >
                  Generate Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
