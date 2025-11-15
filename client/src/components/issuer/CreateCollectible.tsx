// components/issuer/CreateCollectible.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../../lib/supabase';
import { useTemplates } from '../../hooks/useTemplates';
import type { CreateCollectibleParams } from '../../types/collectible';

export function CreateCollectible() {
  const { address } = useAccount();
  const { templates } = useTemplates();
  
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
  
  const [requirementKey, setRequirementKey] = useState('');
  const [requirementValue, setRequirementValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter templates where current user is the issuer
  const myTemplates = templates.filter(t => 
    t.issuer.toLowerCase() === address?.toLowerCase()
  );

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

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('collectibles')
        .insert({
          template_id: formData.templateId.toString(),
          title: formData.title,
          description: formData.description,
          image_url: formData.imageUrl,
          banner_url: formData.bannerUrl || null,
          token_uri: formData.tokenUri,
          claim_type: formData.claimType,
          requirements: formData.requirements,
          created_by: address.toLowerCase(),
          is_active: true,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      
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
    } catch (err: any) {
      console.error('Error creating collectible:', err);
      setError(err.message || 'Failed to create collectible');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Collectible</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">✅ Collectible created successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template *
            </label>
            <select
              value={formData.templateId.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, templateId: BigInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="0">Select a template</option>
              {myTemplates.map(template => (
                <option key={template.templateId.toString()} value={template.templateId.toString()}>
                  Template #{template.templateId.toString()} - Tier {template.tier}
                </option>
              ))}
            </select>
            {myTemplates.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Early Adopter Badge"
              required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this collectible represents..."
              required
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL *
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
              required
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="ipfs://... or https://..."
              required
            />
          </div>

          {/* Claim Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claim Type *
            </label>
            <select
              value={formData.claimType}
              onChange={(e) => setFormData(prev => ({ ...prev, claimType: e.target.value as 'direct' | 'signature' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="signature">Signature (Claim Link)</option>
              <option value="direct">Direct Issue</option>
            </select>
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

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || myTemplates.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Collectible'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
