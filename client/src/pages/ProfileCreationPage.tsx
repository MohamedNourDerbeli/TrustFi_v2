import React from 'react';
import ProfileCreationForm from '../components/ProfileCreationForm';

interface ProfileCreationPageProps {
  onProfileCreated: (tokenId: number) => void;
  onCancel: () => void;
}

const ProfileCreationPage: React.FC<ProfileCreationPageProps> = ({
  onProfileCreated,
  onCancel
}) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Create Your Profile
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Welcome to TrustFi! Let's create your reputation profile to get started.
      </p>
      <ProfileCreationForm
        onProfileCreated={onProfileCreated}
        onCancel={onCancel}
      />
    </div>
  );
};

export default ProfileCreationPage;