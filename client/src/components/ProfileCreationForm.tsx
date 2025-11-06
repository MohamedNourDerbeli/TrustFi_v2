import React, { useState } from 'react';
import { useContract } from '../hooks/useContract';

interface ProfileCreationFormProps {
  onProfileCreated?: (tokenId: number) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  bio: string;
}

interface FormErrors {
  name?: string;
  bio?: string;
}

const ProfileCreationForm: React.FC<ProfileCreationFormProps> = ({
  onProfileCreated,
  onCancel
}) => {
  const { createProfile, loading, error, clearError } = useContract();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    bio: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Profile name is required';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Profile name must be 50 characters or less';
    }
    
    // Bio validation
    if (formData.bio.length > 200) {
      errors.bio = 'Profile bio must be 200 characters or less';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Clear general error when user makes changes
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tokenId = await createProfile(formData.name.trim(), formData.bio.trim());
      
      if (tokenId !== null) {
        // Profile created successfully
        if (onProfileCreated) {
          onProfileCreated(tokenId);
        }
        
        // Reset form
        setFormData({ name: '', bio: '' });
        setFormErrors({});
      }
    } catch (err) {
      // Error is handled by the useContract hook
      console.error('Profile creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', bio: '' });
    setFormErrors({});
    clearError();
    
    if (onCancel) {
      onCancel();
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Create Your Profile
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Profile Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isFormDisabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Enter your profile name"
              maxLength={50}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Bio Field */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={isFormDisabled}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
                formErrors.bio 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Tell us about yourself (optional)"
              maxLength={200}
            />
            {formErrors.bio && (
              <p className="mt-1 text-sm text-red-600">{formErrors.bio}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.bio.length}/200 characters
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isFormDisabled}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormDisabled || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your profile will be stored on the blockchain and cannot be deleted.
          </p>
          

        </div>
      </div>
    </div>
  );
};

export default ProfileCreationForm;