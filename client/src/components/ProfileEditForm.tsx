import React, { useState } from 'react';
import { useContract } from '../hooks/useContract';
import type { ProfileWithId } from '../services/contractService';

interface ProfileEditFormProps {
  profile: ProfileWithId;
  onProfileUpdated?: (updatedProfile: ProfileWithId) => void;
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

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onProfileUpdated,
  onCancel
}) => {
  const { updateProfile, loading, error, clearError } = useContract();
  const [formData, setFormData] = useState<FormData>({
    name: profile.name,
    bio: profile.bio
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
      const success = await updateProfile(profile.tokenId, formData.name.trim(), formData.bio.trim());
      
      if (success) {
        // Profile updated successfully
        const updatedProfile: ProfileWithId = {
          ...profile,
          name: formData.name.trim(),
          bio: formData.bio.trim()
        };
        
        if (onProfileUpdated) {
          onProfileUpdated(updatedProfile);
        }
      }
    } catch (err) {
      // Error is handled by the useContract hook
      console.error('Profile update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      name: profile.name,
      bio: profile.bio
    });
    setFormErrors({});
    clearError();
    
    if (onCancel) {
      onCancel();
    }
  };

  const isFormDisabled = loading || isSubmitting;
  const hasChanges = formData.name.trim() !== profile.name || formData.bio.trim() !== profile.bio;

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h2>
        <p className="text-gray-600">Update your profile information on the blockchain.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
            Profile Name *
          </label>
          <input
            type="text"
            id="edit-name"
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
          <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="edit-bio"
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
            disabled={isFormDisabled || !formData.name.trim() || !hasChanges}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Profile updates are stored on the blockchain and may take a few moments to confirm.
        </p>
      </div>
    </div>
  );
};

export default ProfileEditForm;