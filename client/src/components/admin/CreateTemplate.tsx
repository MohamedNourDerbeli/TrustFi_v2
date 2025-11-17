import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import { type Address, isAddress } from 'viem';
import { useTemplates } from '../../hooks/useTemplates';
import { supabase } from '../../lib/supabase';
import { syncTemplateToDatabase } from '../../lib/template-sync';
import toast from 'react-hot-toast';
import { logger } from '../../lib/logger';
import {
  validateTemplateName,
  validateTemplateDescription,
  validateEthereumAddress,
  validatePositiveNumber,
  validateInteger,
} from '../../lib/validation';
import {
  ArrowLeft,
  Plus,
  FileText,
  Users,
  Award,
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

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
  const navigate = useNavigate();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { createTemplate } = useTemplates();
  
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
  const [isLoadingTemplateId, setIsLoadingTemplateId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNextTemplateId = async () => {
      setIsLoadingTemplateId(true);
      try {
        // First, check if counter exists
        const { data, error } = await supabase
          .from('template_counter')
          .select('next_template_id')
          .eq('id', 1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching next template ID:', error);
          setFormData((prev) => ({ ...prev, templateId: '1' }));
        } else if (data) {
          // Counter exists, use it
          setFormData((prev) => ({ ...prev, templateId: data.next_template_id.toString() }));
        } else {
          // No counter exists, check existing templates to find the next ID
          logger.info('No template counter found, checking existing templates...');
          
          const { data: templates, error: templatesError } = await supabase
            .from('templates_cache')
            .select('template_id')
            .order('template_id', { ascending: false })
            .limit(1);

          let nextId = 1;
          if (!templatesError && templates && templates.length > 0) {
            // Get the highest template ID and add 1
            nextId = parseInt(templates[0].template_id) + 1;
            logger.info(`Found highest template ID: ${templates[0].template_id}, next will be: ${nextId}`);
          }

          setFormData((prev) => ({ ...prev, templateId: nextId.toString() }));
          
          // Note: Counter needs to be manually initialized in Supabase
          // Run this SQL in Supabase SQL Editor:
          // INSERT INTO template_counter (id, next_template_id) VALUES (1, 1);
          logger.info(`Next template ID will be: ${nextId} (counter needs manual initialization in Supabase)`);
        }
      } catch (err) {
        console.error('Error fetching next template ID:', err);
        setFormData((prev) => ({ ...prev, templateId: '1' }));
      } finally {
        setIsLoadingTemplateId(false);
      }
    };

    fetchNextTemplateId();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateTemplateFormData> = {};

    if (!formData.templateId || formData.templateId.trim() === '') {
      newErrors.templateId = 'Template ID not loaded. Please refresh the page.';
    } else if (isNaN(Number(formData.templateId)) || Number(formData.templateId) < 0) {
      newErrors.templateId = 'Invalid template ID. Please refresh the page.';
    }

    // Validate title using validation utility
    const titleResult = validateTemplateName(formData.title || '');
    if (!titleResult.isValid) {
      newErrors.title = titleResult.error!;
    }

    // Validate issuer address using validation utility
    const issuerResult = validateEthereumAddress(formData.issuer || '');
    if (!issuerResult.isValid) {
      newErrors.issuer = issuerResult.error!;
    }

    // Validate max supply
    if (!formData.maxSupply || formData.maxSupply.trim() === '') {
      newErrors.maxSupply = 'Max supply is required';
    } else {
      const maxSupplyResult = validateInteger(formData.maxSupply, 'Max supply');
      if (!maxSupplyResult.isValid) {
        newErrors.maxSupply = maxSupplyResult.error!;
      } else if (Number(formData.maxSupply) < 0) {
        newErrors.maxSupply = 'Max supply must be 0 (unlimited) or a positive number';
      }
    }

    const tierNum = Number(formData.tier);
    if (isNaN(tierNum) || tierNum < 1 || tierNum > 3) {
      newErrors.tier = 'Tier must be between 1 and 3';
    }

    const startTime = Number(formData.startTime);
    const endTime = Number(formData.endTime);

    if (isNaN(startTime) || startTime < 0) {
      newErrors.startTime = 'Start time must be a non-negative number';
    }

    if (isNaN(endTime) || endTime < 0) {
      newErrors.endTime = 'End time must be a non-negative number';
    }

    if (endTime > 0 && startTime >= endTime) {
      newErrors.endTime = 'End time must be greater than start time when set';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      toast.loading('Creating template...', { id: 'create' });

      const templateId = BigInt(formData.templateId);
      
      await createTemplate({
        templateId,
        issuer: formData.issuer as Address,
        maxSupply: BigInt(formData.maxSupply),
        tier: Number(formData.tier),
        startTime: BigInt(formData.startTime),
        endTime: BigInt(formData.endTime),
      });

      // Sync template to database cache with custom title
      logger.info(`Syncing template ${templateId} to database...`);
      
      try {
        // Insert into database with custom title
        const { error } = await supabase
          .from('templates_cache')
          .upsert({
            template_id: templateId.toString(),
            issuer: formData.issuer.toLowerCase(),
            name: formData.title,
            description: `Tier ${formData.tier} credential`,
            max_supply: formData.maxSupply,
            current_supply: '0',
            tier: Number(formData.tier),
            start_time: formData.startTime,
            end_time: formData.endTime,
            is_paused: false,
          }, {
            onConflict: 'template_id',
          });

        if (error) {
          console.error(`Failed to sync template ${templateId}:`, error);
          toast.error('Template created but failed to cache in database', { id: 'create' });
        } else {
          logger.info(`Template ${templateId} synced successfully with title: ${formData.title}`);
        }
      } catch (syncErr) {
        console.error('Error syncing template:', syncErr);
      }

      // Increment counter for next template
      try {
        const nextId = Number(formData.templateId) + 1;
        
        // Try to update first
        const { error: updateError } = await supabase
          .from('template_counter')
          .update({ next_template_id: nextId })
          .eq('id', 1);
        
        if (updateError) {
          console.warn('Could not update template counter (this is OK if counter doesn\'t exist yet):', updateError);
          // Counter will be initialized on next page load
        } else {
          logger.info(`Template counter updated to: ${nextId}`);
        }
      } catch (updateErr) {
        console.error('Error updating template counter:', updateErr);
      }

      toast.success(`Template "${formData.title}" created successfully!`, { id: 'create' });
      
      // Navigate back to templates after a short delay
      setTimeout(() => {
        navigate('/admin/templates');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error(err.message || 'Failed to create template', { id: 'create' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    setIsLoadingTemplateId(true);
    try {
      const { data, error } = await supabase
        .from('template_counter')
        .select('next_template_id')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        setFormData((prev) => ({ ...prev, templateId: data.next_template_id.toString() }));
      } else {
        setFormData((prev) => ({ ...prev, templateId: '1' }));
      }
    } catch (err) {
      console.error('Error fetching next template ID:', err);
      setFormData((prev) => ({ ...prev, templateId: '1' }));
    } finally {
      setIsLoadingTemplateId(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create New Template
              </h1>
              <p className="text-gray-600">Design and publish a new card template</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Template Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="e.g., Early Adopter Badge"
                />
                {errors.title && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.title}</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  A descriptive name for this template
                </p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="issuer" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Issuer Address
                </label>
                <input
                  type="text"
                  id="issuer"
                  name="issuer"
                  value={formData.issuer}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-sm ${
                    errors.issuer ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0x..."
                />
                {errors.issuer && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.issuer}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="maxSupply" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-600" />
                  Max Supply
                </label>
                <input
                  type="text"
                  id="maxSupply"
                  name="maxSupply"
                  value={formData.maxSupply}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.maxSupply ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="e.g., 1000"
                />
                {errors.maxSupply && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.maxSupply}</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">Maximum cards to issue</p>
              </div>

              <div>
                <label htmlFor="tier" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  Tier
                </label>
                <select
                  id="tier"
                  name="tier"
                  value={formData.tier}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.tier ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <option value="1">Tier 1</option>
                  <option value="2">Tier 2</option>
                  <option value="3">Tier 3</option>
                </select>
                {errors.tier && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.tier}</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">Reputation score value</p>
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Start Time (Unix)
                </label>
                <input
                  type="text"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.startTime ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0 for immediate"
                />
                {errors.startTime && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.startTime}</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">0 for immediate</p>
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  End Time (Unix)
                </label>
                <input
                  type="text"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.endTime ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0 for no expiration"
                />
                {errors.endTime && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.endTime}</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">0 for no expiration</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">Template ID</p>
                  <p className="text-2xl font-black text-purple-600">
                    {isLoadingTemplateId ? '...' : `#${formData.templateId}`}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">Auto-generated unique identifier</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingTemplateId}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Template
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl shadow-xl p-1">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Template Creation System</h3>
                <p className="text-sm text-gray-600">On-chain template deployment with database sync</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
