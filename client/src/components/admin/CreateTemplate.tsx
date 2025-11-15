import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractWrite, useWaitForTransaction, useContractEvent } from 'wagmi';
import { type Address, isAddress } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardAbi from '../../lib/ReputationCard.abi.json';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';

interface CreateTemplateFormData {
  templateId: string;
  title: string;
  issuer: string;
  maxSupply: string;
  tier: string;
  startTime: string;
  endTime: string;
}

export const CreateTemplate: React.FC = () => {
  const [formData, setFormData] = useState<CreateTemplateFormData>({
    templateId: '',
    title: '',
    issuer: '',
    maxSupply: '',
    tier: '1',
    startTime: '0',
    endTime: '0',
  });
  const [errors, setErrors] = useState<Partial<CreateTemplateFormData>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  const [isLoadingTemplateId, setIsLoadingTemplateId] = useState(false);

  // Fetch next template ID on mount
  useEffect(() => {
    const fetchNextTemplateId = async () => {
      setIsLoadingTemplateId(true);
      try {
        const { data, error } = await supabase
          .from('template_counter')
          .select('next_template_id')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Error fetching next template ID:', error);
          // Fallback to empty string if counter doesn't exist
          setFormData(prev => ({ ...prev, templateId: '' }));
        } else if (data) {
          setFormData(prev => ({ ...prev, templateId: data.next_template_id.toString() }));
        }
      } catch (err) {
        console.error('Error fetching next template ID:', err);
        setFormData(prev => ({ ...prev, templateId: '' }));
      } finally {
        setIsLoadingTemplateId(false);
      }
    };

    fetchNextTemplateId();
  }, []);

  // Contract write hook
  const { data: writeData, write, isLoading: isWriting, error: writeError } = useContractWrite({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi as any,
    functionName: 'createTemplate',
  });

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: writeData?.hash,
  });

  // Listen for TemplateCreated event
  useContractEvent({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi as any,
    eventName: 'TemplateCreated',
    listener(logs: any) {
      const log = logs[0];
      if (log && log.args) {
        const templateId = log.args.templateId?.toString();
        if (templateId) {
          setCreatedTemplateId(templateId);
          setSuccessMessage(`Template "${formData.title}" created successfully with ID: ${templateId}`);
          
          // Show success notification
          showSuccessNotification({
            title: 'Template Created!',
            message: `"${formData.title}" (Template #${templateId}) has been created successfully.`,
            txHash: writeData?.hash,
            duration: 6000,
          });

          // Increment the counter in Supabase for next template
          incrementTemplateCounter();
        }
      }
    },
  });

  // Function to increment template counter
  const incrementTemplateCounter = async () => {
    try {
      await supabase.rpc('get_next_template_id');
    } catch (err) {
      console.error('Error incrementing template counter:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateTemplateFormData> = {};

    // Validate template ID (auto-generated, should always exist)
    if (!formData.templateId || formData.templateId.trim() === '') {
      newErrors.templateId = 'Template ID not loaded. Please refresh the page.';
    } else if (isNaN(Number(formData.templateId)) || Number(formData.templateId) < 0) {
      newErrors.templateId = 'Invalid template ID. Please refresh the page.';
    }

    // Validate title
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Template title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    // Validate issuer address
    if (!formData.issuer || formData.issuer.trim() === '') {
      newErrors.issuer = 'Issuer address is required';
    } else if (!isAddress(formData.issuer)) {
      newErrors.issuer = 'Invalid Ethereum address';
    }

    // Validate max supply
    if (!formData.maxSupply || formData.maxSupply.trim() === '') {
      newErrors.maxSupply = 'Max supply is required';
    } else if (isNaN(Number(formData.maxSupply)) || Number(formData.maxSupply) <= 0) {
      newErrors.maxSupply = 'Max supply must be a positive number';
    }

    // Validate tier (1-3)
    const tierNum = Number(formData.tier);
    if (isNaN(tierNum) || tierNum < 1 || tierNum > 3) {
      newErrors.tier = 'Tier must be between 1 and 3';
    }

    // Validate time windows
    const startTime = Number(formData.startTime);
    const endTime = Number(formData.endTime);

    if (isNaN(startTime) || startTime < 0) {
      newErrors.startTime = 'Start time must be a non-negative number';
    }

    if (isNaN(endTime) || endTime < 0) {
      newErrors.endTime = 'End time must be a non-negative number';
    }

    // If endTime > 0, startTime must be < endTime
    if (endTime > 0 && startTime >= endTime) {
      newErrors.endTime = 'End time must be greater than start time when set';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setCreatedTemplateId(null);

    if (!validateForm()) {
      return;
    }

    try {
      (write as any)?.({
        args: [
          BigInt(formData.templateId),
          formData.issuer as Address,
          BigInt(formData.maxSupply),
          Number(formData.tier),
          BigInt(formData.startTime),
          BigInt(formData.endTime),
        ],
      });
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof CreateTemplateFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleReset = async () => {
    setFormData({
      templateId: '',
      title: '',
      issuer: '',
      maxSupply: '',
      tier: '1',
      startTime: '0',
      endTime: '0',
    });
    setErrors({});
    setSuccessMessage(null);
    setCreatedTemplateId(null);

    // Refetch next template ID
    setIsLoadingTemplateId(true);
    try {
      const { data, error } = await supabase
        .from('template_counter')
        .select('next_template_id')
        .eq('id', 1)
        .single();

      if (!error && data) {
        setFormData(prev => ({ ...prev, templateId: data.next_template_id.toString() }));
      }
    } catch (err) {
      console.error('Error fetching next template ID:', err);
    } finally {
      setIsLoadingTemplateId(false);
    }
  };

  const isLoading = isWriting || isConfirming;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Admin Dashboard
      </Link>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Template</h2>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {writeError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800">
                {writeError.message.includes('Template exists')
                  ? 'Template with this ID already exists'
                  : writeError.message.includes('Invalid tier')
                  ? 'Invalid tier value (must be 1-3)'
                  : writeError.message.includes('Unauthorized') || writeError.message.includes('AccessControl')
                  ? 'You do not have permission to create templates'
                  : 'Failed to create template. Please try again.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Template Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Early Adopter Badge"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            <p className="mt-1 text-sm text-gray-500">A descriptive name for this template</p>
          </div>

          {/* Issuer Address */}
          <div>
            <label htmlFor="issuer" className="block text-sm font-medium text-gray-700 mb-2">
              Issuer Address
            </label>
            <input
              type="text"
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.issuer ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0x..."
            />
            {errors.issuer && <p className="mt-1 text-sm text-red-600">{errors.issuer}</p>}
          </div>

          {/* Max Supply */}
          <div>
            <label htmlFor="maxSupply" className="block text-sm font-medium text-gray-700 mb-2">
              Max Supply
            </label>
            <input
              type="text"
              id="maxSupply"
              name="maxSupply"
              value={formData.maxSupply}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxSupply ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 1000"
            />
            {errors.maxSupply && <p className="mt-1 text-sm text-red-600">{errors.maxSupply}</p>}
            <p className="mt-1 text-sm text-gray-500">Maximum number of cards that can be issued</p>
          </div>

          {/* Tier */}
          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-2">
              Tier
            </label>
            <select
              id="tier"
              name="tier"
              value={formData.tier}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.tier ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
            {errors.tier && <p className="mt-1 text-sm text-red-600">{errors.tier}</p>}
            <p className="mt-1 text-sm text-gray-500">Tier determines the reputation score value</p>
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time (Unix Timestamp)
            </label>
            <input
              type="text"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0 for no start time"
            />
            {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
            <p className="mt-1 text-sm text-gray-500">Set to 0 for immediate availability</p>
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time (Unix Timestamp)
            </label>
            <input
              type="text"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0 for no end time"
            />
            {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
            <p className="mt-1 text-sm text-gray-500">Set to 0 for no expiration</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isWriting ? 'Submitting...' : 'Confirming...'}
                </span>
              ) : (
                'Create Template'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
