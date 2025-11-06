import React, { useState } from 'react';
import ProfileDisplay from '../components/ProfileDisplay';
import ProfileEditForm from '../components/ProfileEditForm';
import ReputationCardsList from '../components/ReputationCardsList';
import CategoryFilter from '../components/CategoryFilter';
import { getFilteredCards, calculateTotalPoints } from '../utils/categoryUtils';
import type { ProfileWithId } from '../services/contractService';
import type { ReputationCard } from '../types/reputationCard';

interface ProfilePageProps {
  userProfile: ProfileWithId | null;
  reputationCards: ReputationCard[];
  cardsLoading: boolean;
  onNavigateToHome: () => void;
  onProfileUpdated: (profile: ProfileWithId) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  reputationCards,
  cardsLoading,
  onNavigateToHome,
  onProfileUpdated
}) => {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleEditProfile = () => {
    setShowProfileEdit(true);
  };

  const handleProfileUpdated = (updatedProfile: ProfileWithId) => {
    onProfileUpdated(updatedProfile);
    setShowProfileEdit(false);
  };

  const handleCancelProfileEdit = () => {
    setShowProfileEdit(false);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const filteredCards = getFilteredCards(reputationCards, selectedCategory);
  const totalPoints = calculateTotalPoints(reputationCards);

  if (!userProfile) {
    return (
      <div className="card text-center">
        <div className="py-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Found</h3>
          <p className="text-gray-600 mb-4">Please connect your wallet and create a profile to get started.</p>
          <button
            onClick={onNavigateToHome}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">View and manage your reputation profile</p>
      </div>
      
      <div className="space-y-6">
        {showProfileEdit ? (
          <ProfileEditForm
            profile={userProfile}
            onProfileUpdated={handleProfileUpdated}
            onCancel={handleCancelProfileEdit}
          />
        ) : (
          <ProfileDisplay 
            profile={userProfile} 
            onEditClick={handleEditProfile}
            showEditButton={true}
          />
        )}
        
        {/* Reputation Cards Section - only show when not editing */}
        {!showProfileEdit && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reputation Cards</h3>
                <p className="text-gray-600 text-sm">Your verified credentials and achievements</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {totalPoints}
                </div>
                <div className="text-xs text-gray-500">Total Points</div>
              </div>
            </div>
            
            {/* Category Filter */}
            <CategoryFilter
              cards={reputationCards}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
            
            <ReputationCardsList 
              cards={filteredCards} 
              loading={cardsLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;