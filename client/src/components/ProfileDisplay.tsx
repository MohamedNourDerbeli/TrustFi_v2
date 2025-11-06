import React from 'react';
import type { ProfileWithId } from '../services/contractService';

interface ProfileDisplayProps {
  profile: ProfileWithId;
  className?: string;
  onEditClick?: () => void;
  showEditButton?: boolean;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ 
  profile, 
  className = '', 
  onEditClick,
  showEditButton = true 
}) => {
  // Format the creation date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`card ${className}`}>
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Profile ID: #{profile.tokenId}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-4" />
              </svg>
              Created: {formatDate(profile.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Status Badge and Edit Button */}
        <div className="flex-shrink-0 flex items-center space-x-3">
          {showEditButton && onEditClick && (
            <button
              onClick={onEditClick}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            profile.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {profile.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Profile Bio */}
      {profile.bio && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
          <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Reputation Score Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Reputation Score</h3>
            <p className="text-2xl font-bold text-blue-600">{profile.reputationScore}</p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Reputation Score Description */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-gray-600">
            {profile.reputationScore === 0 
              ? 'Start earning reputation by receiving verified credentials from trusted issuers.'
              : 'Your reputation score is calculated based on verified credentials and achievements.'
            }
          </p>
        </div>
      </div>

      {/* Profile Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Profile Age</p>
          <p className="text-lg font-semibold text-gray-900">
            {(() => {
              const nowSeconds = Math.floor(Date.now() / 1000);
              const ageSeconds = nowSeconds - profile.createdAt;
              const ageDays = Math.floor(ageSeconds / (24 * 60 * 60));
              console.log('Profile age calculation:', {
                nowSeconds,
                createdAt: profile.createdAt,
                ageSeconds,
                ageDays
              });
              return Math.max(0, ageDays);
            })()} days
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Status</p>
          <p className="text-lg font-semibold text-gray-900">
            {profile.isActive ? 'Verified' : 'Pending'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;