// components/user/ProfileEdit.tsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useProfile } from '../../hooks/useProfile';
import { AvatarUpload } from './AvatarUpload';
import { BannerUpload } from './BannerUpload';
import type { ProfileMetadata } from '../../types/profile';

export function ProfileEdit() {
  const { address } = useAccount();
  const { profile, loading, updateProfile } = useProfile(address);

  const [formData, setFormData] = useState<ProfileMetadata>({
    displayName: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    twitterHandle: '',
    discordHandle: '',
    websiteUrl: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        bannerUrl: profile.bannerUrl || '',
        twitterHandle: profile.twitterHandle || '',
        discordHandle: profile.discordHandle || '',
        websiteUrl: profile.websiteUrl || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (ipfsUrl: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl: ipfsUrl }));
    setSuccess('Avatar uploaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleBannerUpload = (ipfsUrl: string) => {
    setFormData((prev) => ({ ...prev, bannerUrl: ipfsUrl }));
    setSuccess('Banner uploaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUploadError = (err: Error) => {
    setError(err.message);
    setTimeout(() => setError(null), 5000);
  };

  const validateForm = (): string | null => {
    if (formData.displayName && formData.displayName.length > 50) {
      return 'Display name must be 50 characters or less';
    }

    if (formData.bio && formData.bio.length > 500) {
      return 'Bio must be 500 characters or less';
    }

    if (formData.websiteUrl) {
      try {
        new URL(formData.websiteUrl);
      } catch {
        return 'Please enter a valid website URL';
      }
    }

    if (formData.twitterHandle && formData.twitterHandle.startsWith('@')) {
      return 'Twitter handle should not include the @ symbol';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      
      // Redirect to profile view after a short delay
      setTimeout(() => {
        window.location.href = '/profile';
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You need to create a profile first.</p>
          <a href="/create-profile" className="text-yellow-700 underline mt-2 inline-block">
            Create Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Customize your profile appearance and information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Upload */}
        <BannerUpload
          currentBannerUrl={formData.bannerUrl}
          onUploadComplete={handleBannerUpload}
          onError={handleUploadError}
        />

        {/* Avatar Upload */}
        <AvatarUpload
          currentAvatarUrl={formData.avatarUrl}
          onUploadComplete={handleAvatarUpload}
          onError={handleUploadError}
        />

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleInputChange}
            placeholder="Your display name"
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.displayName.length}/50 characters
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself"
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Social Links</h2>

          {/* Twitter */}
          <div>
            <label htmlFor="twitterHandle" className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Handle
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                @
              </span>
              <input
                id="twitterHandle"
                name="twitterHandle"
                type="text"
                value={formData.twitterHandle}
                onChange={handleInputChange}
                placeholder="username"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Discord */}
          <div>
            <label htmlFor="discordHandle" className="block text-sm font-medium text-gray-700 mb-2">
              Discord Handle
            </label>
            <input
              id="discordHandle"
              name="discordHandle"
              type="text"
              value={formData.discordHandle}
              onChange={handleInputChange}
              placeholder="username#1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>

          <a
            href="/profile"
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
