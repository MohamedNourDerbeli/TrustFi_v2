import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfileCreationPage from './pages/ProfileCreationPage';
import AdminPanel from './components/AdminPanel';
import IssuerPage from './pages/IssuerPage';
import { useContract } from './hooks/useContract';
import { useReputationCards } from './hooks/useReputationCards';
import { useUserRole } from './hooks/useUserRole';
import type { Wallet } from '@talismn/connect-wallets';
import type { ProfileWithId } from './services/contractService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'profile' | 'explore' | 'analytics' | 'admin' | 'issuer'>('home');
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [userProfile, setUserProfile] = useState<ProfileWithId | null>(null);
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [contractServiceReady, setContractServiceReady] = useState(false);
  
  const { getProfileByOwner, loading, getCurrentChainId } = useContract();
  const { reputationCards, cardsLoading, loadReputationCards } = useReputationCards(
    contractServiceReady,
    getCurrentChainId
  );
  const { userRole } = useUserRole(connectedAddress, contractServiceReady, getCurrentChainId);

  const handleWalletConnected = (address: string, _wallet?: Wallet) => {
    setConnectedAddress(address);
  };

  const handleContractServiceReady = () => {
    setContractServiceReady(true);
  };

  // Check for existing profile when wallet is connected and contract service is ready
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (connectedAddress && contractServiceReady) {
        try {
          const profile = await getProfileByOwner(connectedAddress);
          setUserProfile(profile);
          
          // If no profile exists, show profile creation form
          if (!profile) {
            setShowProfileCreation(true);
          } else {
            // Load reputation cards for the profile
            loadReputationCards(profile.tokenId);
          }
        } catch (error) {
          console.error('Error checking for existing profile:', error);
        }
      }
    };

    checkExistingProfile();
  }, [connectedAddress, contractServiceReady, getProfileByOwner, loadReputationCards]);

  const handleProfileCreated = (_tokenId: number) => {
    // Refresh profile data after creation
    if (connectedAddress) {
      getProfileByOwner(connectedAddress).then(profile => {
        setUserProfile(profile);
        setShowProfileCreation(false);
        setCurrentPage('dashboard');
        if (profile) {
          loadReputationCards(profile.tokenId);
        }
      });
    }
  };

  const handleCancelProfileCreation = () => {
    setShowProfileCreation(false);
  };

  const handleProfileUpdated = (updatedProfile: ProfileWithId) => {
    setUserProfile(updatedProfile);
  };

  const handlePageChange = (page: 'dashboard' | 'profile' | 'explore' | 'analytics' | 'admin' | 'issuer') => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    // Show profile creation form if wallet is connected but no profile exists
    if (showProfileCreation && connectedAddress && contractServiceReady) {
      return (
        <ProfileCreationPage
          onProfileCreated={handleProfileCreated}
          onCancel={handleCancelProfileCreation}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            connectedAddress={connectedAddress}
            userProfile={userProfile}
            loading={loading}
            onWalletConnected={handleWalletConnected}
            onContractServiceReady={handleContractServiceReady}
            onShowProfileCreation={() => setShowProfileCreation(true)}
            onNavigateToProfile={() => setCurrentPage('dashboard')}
          />
        );
      case 'dashboard':
        return (
          <DashboardPage
            userProfile={userProfile}
            reputationCards={reputationCards}
            cardsLoading={cardsLoading}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            userProfile={userProfile}
            reputationCards={reputationCards}
            cardsLoading={cardsLoading}
            onNavigateToHome={() => setCurrentPage('dashboard')}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      case 'explore':
        return <ExplorePage />;
      case 'analytics':
        return (
          <AnalyticsPage
            userProfile={userProfile}
            reputationCards={reputationCards}
            cardsLoading={cardsLoading}
          />
        );
      case 'admin':
        return (
          <AdminPanel 
            connectedAddress={connectedAddress}
            contractServiceReady={contractServiceReady}
          />
        );
      case 'issuer':
        return (
          <IssuerPage 
            connectedAddress={connectedAddress}
            contractServiceReady={contractServiceReady}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={handlePageChange}
      showNavigation={!!connectedAddress}
      userRole={userRole}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;