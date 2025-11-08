import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import type { ReputationCard } from '@/services/reputationCardService';

interface ProfileContextType {
  profileData: any;
  setProfileData: (data: any) => void;
  offChainData: any;
  setOffChainData: (data: any) => void;
  reputationCards: ReputationCard[];
  setReputationCards: (cards: ReputationCard[]) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { address, connected } = useWallet();
  const [profileData, setProfileData] = useState<any>(null);
  const [offChainData, setOffChainData] = useState<any>(null);
  const [reputationCards, setReputationCards] = useState<ReputationCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile updated event received:', event.detail);
      setOffChainData(event.detail);
    };

    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
    };
  }, []);

  // React to address changes from WalletContext
  useEffect(() => {
    let isCancelled = false;
    
    const loadProfileData = async (currentAddress: string) => {
      // Clear old data immediately when address changes
      setOffChainData(null);
      setProfileData(null);
      setReputationCards([]);
      setIsLoading(true);
      
      // Add a small delay to allow database operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (isCancelled) return;
      
      try {
        const { profileService } = await import('@/services/profileService');
        
        // Retry logic for profile loading
        let retries = 0;
        let data = null;
        
        while (retries < 3 && !isCancelled) {
          data = await profileService.getProfile(currentAddress);
          
          if (data) {
            console.log('ProfileContext: Loaded data for', currentAddress, data);
            break;
          }
          
          retries++;
          if (retries < 3) {
            console.log(`ProfileContext: Retry ${retries}/3 for`, currentAddress);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!isCancelled) {
          setOffChainData(data || null);
        }
      } catch (error) {
        console.error('Error loading off-chain profile data:', error);
        if (!isCancelled) {
          setOffChainData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (connected && address) {
      console.log('ProfileContext: Detected address from WalletContext, loading data for', address);
      loadProfileData(address);
    } else {
      setOffChainData(null);
      setProfileData(null);
      setReputationCards([]);
      setIsLoading(false);
    }
    
    return () => {
      isCancelled = true;
    };
  }, [address, connected]);

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        setProfileData,
        offChainData,
        setOffChainData,
        reputationCards,
        setReputationCards,
        isLoading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
