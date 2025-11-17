// components/issuer/CreateCollectible.tsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import type { CreateCollectibleParams } from '../../types/collectible';
import { uploadToPinata, uploadJSONToPinata, validateImageFile } from '../../lib/pinata';
import { Zap, Link2, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';

interface Template {
  template_id: number;
  issuer: string;
  name: string;
  tier: number;
  is_paused: boolean;
}

export function CreateCollectible() {
  const { address } = useAccount();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [formData, setFormData] = useState<CreateCollectibleParams>({
    templateId: 0n,
    title: '',
    description: '',
    imageUrl: '',
    bannerUrl: '',
    tokenUri: '',
    claimType: 'signature',
    requirements: {},
  });
  
  // Quick mode fields
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  
  const [requirementKey, setRequirementKey] = useState('');
  const [requirementValue, setRequirementValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [shareableLink, setShareableLink] = useState<string | null>(null);

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
          .eq('is_paused', false)
          .order('template_id', { ascending: true });

        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        console.error('[CreateCollectible] Error fetching templates:', err);
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, [address]);

  const handleAddRequirement = () => {
    if (requirementKey && requirementValue) {
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [requirementKey]: requirementValue,
        },
      }));
      setRequirementKey('');
      setRequirementValue('');
    }
  };

  const handleRemoveRequirement = (key: string) => {
    setFormData(prev => {
      const newReqs = { ...prev.requirements };
      delete newReqs[key];
      return { ...prev, requirements: newReqs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      if (formData.templateId === 0n) {
        throw new Error('Please select a template');
      }

      let finalImageUrl = formData.imageUrl;
      let finalBannerUrl = formData.bannerUrl;
      let finalTokenUri = formData.tokenUri;

      // Handle Quick Mode - upload images and generate metadata
      if (mode === 'quick') {
        if (!cardImageFile) {
          throw new Error('Please upload a card image');
        }

        setIsUploading(true);

        try {
          // Upload card image
          finalImageUrl = await uploadToPinata(cardImageFile);

          // Upload banner if provided
          if (bannerImageFile) {
            finalBannerUrl = await uploadToPinata(bannerImageFile);
          }

          // Find selected template
          const selectedTemplate = templates.find(t => t.template_id === Number(formData.templateId));

          // Create metadata JSON
          const metadata = {
            name: formData.title,
            description: formData.description,
            image: finalImageUrl,
            attributes: [
              {
                trait_type: 'Template',
                value: selectedTemplate?.name || `Template #${formData.templateId}`,
              },
              {
                trait_type: 'Tier',
                value: selectedTemplate?.tier || 1,
              },
              {
                trait_type: 'Issuer',
                value: address,
              },
              ...Object.entries(formData.requirements || {}).map(([key, value]) => ({
                trait_type: key,
                value: String(value),
              })),
            ],
          };

          // Upload metadata to IPFS
          finalTokenUri = await uploadJSONToPinata(metadata);
        } catch (uploadError: unknown) {
          console.error('Error uploading to IPFS:', uploadError);
          const message = uploadError instanceof Error ? uploadError.message : String(uploadError);
          throw new Error(`Failed to upload to IPFS: ${message}`);
        } finally {
          setIsUploading(false);
        }
      }

      // Insert into Supabase and get the created ID
      const { data: insertedData, error: insertError } = await supabase
        .from('collectibles')
        .insert({
          template_id: Number(formData.templateId),
          title: formData.title,
          description: formData.description,
          image_url: finalImageUrl,
          banner_url: finalBannerUrl || null,
          token_uri: finalTokenUri,
          claim_type: 'signature', // Collectibles are always signature-based (discoverable)
          requirements: formData.requirements,
          created_by: address.toLowerCase(),
          is_active: true,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      
      // Generate shareable link for the collectible
      if (insertedData) {
        const collectibleId = insertedData.id;
        
        // Generate the shareable discover link
        const baseUrl = window.location.origin;
        const discoverLink = `${baseUrl}/discover?collectible=${collectibleId}`;
        setShareableLink(discoverLink);
      }
      
      // Reset form
      setFormData({
        templateId: 0n,
        title: '',
        description: '',
        imageUrl: '',
        bannerUrl: '',
        tokenUri: '',
        claimType: 'signature',
        requirements: {},
      });
      setCardImageFile(null);
      setCardImagePreview(null);
      setBannerImageFile(null);
      setBannerImagePreview(null);
    } catch (err: unknown) {
      console.error('Error creating collectible:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to create collectible');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Collectible</h2>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">Collectible Created Successfully!</h3>
                <p className="text-sm text-green-700">Your collectible is now live and ready to be discovered.</p>
              </div>
            </div>
            
            {shareableLink && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-green-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📢 Share this link with your community:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareableLink);
                        alert('Link copied to clipboard!');
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Users can visit this link to discover and claim your collectible
                </p>
              </div>
            )}
            
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setShareableLink(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all"
              >
                Create Another
              </button>
              <a
                href="/issuer/collectibles"
                className="px-4 py-2 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-semibold transition-all"
              >
                View All Collectibles
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Metadata Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-gray-500 mt-1">Upload images & auto-generate metadata</p>
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
                <p className="text-xs text-gray-500 mt-1">Use your own pre-made URLs</p>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template *
            </label>
            <select
              value={formData.templateId.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, templateId: BigInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting || isUploading}
            >
              <option value="0">Select a template ({templates.length} available)</option>
              {templates.map(template => (
                <option key={template.template_id} value={template.template_id}>
                  {template.name} - Tier {template.tier}
                </option>
              ))}
            </select>
            {templates.length === 0 && !templatesLoading && (
              <p className="mt-2 text-sm text-gray-500">
                No templates found. Create a template first.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Early Adopter Badge"
              required
              disabled={isSubmitting || isUploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe what this collectible represents..."
              required
              disabled={isSubmitting || isUploading}
            />
          </div>

          {/* Quick Mode Fields */}
          {mode === 'quick' && (
            <>
              {/* Card Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                  {cardImagePreview ? (
                    <div className="space-y-3">
                      <img src={cardImagePreview} alt="Card Preview" className="max-h-48 mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setCardImageFile(null);
                          setCardImagePreview(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                        disabled={isSubmitting || isUploading}
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
                              setError(validationError);
                              return;
                            }
                            setCardImageFile(file);
                            setCardImagePreview(URL.createObjectURL(file));
                            setError(null);
                          }
                        }}
                        className="hidden"
                        disabled={isSubmitting || isUploading}
                      />
                      <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload card image</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                  {bannerImagePreview ? (
                    <div className="space-y-3">
                      <img src={bannerImagePreview} alt="Banner Preview" className="max-h-32 w-full object-cover mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerImageFile(null);
                          setBannerImagePreview(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                        disabled={isSubmitting || isUploading}
                      >
                        Remove Banner
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
                              setError(validationError);
                              return;
                            }
                            setBannerImageFile(file);
                            setBannerImagePreview(URL.createObjectURL(file));
                            setError(null);
                          }
                        }}
                        className="hidden"
                        disabled={isSubmitting || isUploading}
                      />
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload banner (optional)</p>
                      <p className="text-xs text-gray-500 mt-1">Recommended: 1200x300px</p>
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Custom IPFS Mode Fields */}
          {mode === 'custom' && (
            <>
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://... or ipfs://..."
                  required
                  disabled={isSubmitting || isUploading}
                />
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, bannerUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://... or ipfs://..."
                  disabled={isSubmitting || isUploading}
                />
              </div>

              {/* Token URI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token URI *
                </label>
                <input
                  type="url"
                  value={formData.tokenUri}
                  onChange={(e) => setFormData(prev => ({ ...prev, tokenUri: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ipfs://... or https://..."
                  required
                  disabled={isSubmitting || isUploading}
                />
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"> 
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Discoverable Collectible</h4>
                <p className="text-sm text-blue-800">
                  This collectible will be publicly discoverable. Users can browse and claim it themselves. 
                  For direct one-to-one card issuance, use the <strong>Issue Card</strong> page instead.
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements (Optional)
            </label>
            
            {/* Display existing requirements */}
            {Object.entries(formData.requirements || {}).length > 0 && (
              <div className="mb-3 space-y-2">
                {Object.entries(formData.requirements || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700">
                      <strong>{key}:</strong> {String(value)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(key)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add new requirement */}
            <div className="flex gap-2">
              <input
                type="text"
                value={requirementKey}
                onChange={(e) => setRequirementKey(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Key (e.g., 'Min Followers')"
              />
              <input
                type="text"
                value={requirementValue}
                onChange={(e) => setRequirementValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Value (e.g., '100')"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Live Preview
            </label>
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <div className="relative">
                {(() => {
                  const selectedTemplate = templates.find(t => t.template_id === Number(formData.templateId));
                  const previewImage = mode === 'quick' ? cardImagePreview : (formData.imageUrl || null);
                  const previewBanner = mode === 'quick' ? bannerImagePreview : (formData.bannerUrl || null);
                  return (
                    <>
                      {previewBanner && (
                        <img
                          src={previewBanner}
                          alt="Banner Preview"
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4 flex gap-4 items-start">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {previewImage ? (
                            <img src={previewImage} alt="Image Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {selectedTemplate ? `${selectedTemplate.name} • Tier ${selectedTemplate.tier}` : 'No template selected'}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {formData.title || 'Untitled Collectible'}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {formData.description || 'Description will appear here.'}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">This is a visual approximation of what will be created.</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || templates.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading to IPFS...
                </>
              ) : isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Collectible
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
