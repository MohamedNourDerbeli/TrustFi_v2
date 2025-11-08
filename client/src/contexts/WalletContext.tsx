import { createContext, useState, useEffect, useContext, useCallback, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

// Define user profile interface
interface UserProfile {
  tokenId: string;
  hasProfile: boolean;
  isAdmin: boolean;
  isIssuer: boolean;
}

// Connection result interface
interface ConnectionResult {
  address: string;
  profile: UserProfile | null;
}

// Define the shape of the context state
interface IWalletContext {
  connected: boolean;
  address: string;
  provider: ethers.BrowserProvider | null;
  connectWallet: () => Promise<ConnectionResult | null>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  isInitializing: boolean;
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
}

// Create the context with a default undefined value
const WalletContext = createContext<IWalletContext | undefined>(undefined);

// Define the EIP-6963 provider detail interface
interface EIP6963ProviderDetail {
  info: { rdns: string; name: string; };
  provider: any;
}

// Create the Provider component
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [, setLocation] = useLocation();
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const { toast } = useToast();

  const truncateAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  // Function to check user profile and roles
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!address || !provider || !ethers.isAddress(address)) {
      setUserProfile(null);
      setIsLoadingProfile(false);
      return null;
    }

    try {
      setIsLoadingProfile(true);
      
      // Import services dynamically to avoid circular dependencies
      const { contractService } = await import('@/services/contractService');
      const { reputationCardService } = await import('@/services/reputationCardService');
      
      // Initialize contract services if needed
      if (!contractService.isInitialized()) {
        await contractService.initialize(provider);
      }
      if (!reputationCardService.isInitialized()) {
        await reputationCardService.initialize(provider);
      }

      // Try to get user profile
      let profileData: UserProfile;
      
      try {
        const profile = await contractService.getProfileByOwner(address);
        
        // User has a profile - check roles
        const isIssuer = await reputationCardService.isAuthorizedIssuer(address);
        
        profileData = {
          tokenId: profile.tokenId.toString(),
          hasProfile: true,
          isAdmin: isIssuer,
          isIssuer: isIssuer,
        };
      } catch (error: any) {
        // No profile found - this is normal for new users
        profileData = {
          tokenId: '',
          hasProfile: false,
          isAdmin: false,
          isIssuer: false,
        };
      }

      setUserProfile(profileData);
      return profileData;
    } catch (error) {
      setUserProfile(null);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address, provider]);

  const handleDisconnect = useCallback(async () => {
    // Revoke permissions in MetaMask
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (error: any) {
        if (error.code !== -32601) {
          console.error('Error revoking permissions:', error);
        }
      }
    }

    // Clear app state
    setConnected(false);
    setAddress('');
    setUserProfile(null);
    localStorage.removeItem('isWalletConnected');
    localStorage.removeItem('walletAddress');
    
    toast({ 
      title: 'Wallet Disconnected', 
      description: 'Your wallet has been disconnected.' 
    });
  }, [toast]);

  // Detect provider and handle auto-reconnection
  useEffect(() => {
    let metaMaskProvider: any = null;

    const handleAnnounceProvider = (event: CustomEvent<EIP6963ProviderDetail>) => {
      if (event.detail.info.rdns === 'io.metamask') {
        metaMaskProvider = event.detail.provider;
        initializeProvider(metaMaskProvider);
      }
    };

    const initializeProvider = async (ethProvider: any) => {
      if (!ethProvider) return;

      const browserProvider = new ethers.BrowserProvider(ethProvider);
      setProvider(browserProvider);

      // Handle account and chain changes
      ethProvider.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          const newAddress = accounts[0];
          console.log('Account changed to:', newAddress);
          
          // Update state immediately
          setAddress(newAddress);
          setConnected(true);
          localStorage.setItem('isWalletConnected', 'true');
          localStorage.setItem('walletAddress', newAddress);
          
          // Check/create off-chain profile for the new account
          try {
            const { profileService } = await import('@/services/profileService');
            const { supabase } = await import('@/lib/supabase');
            
            const existingProfile = await profileService.getProfile(newAddress);
            
            if (!existingProfile) {
              console.log('Creating default off-chain profile for switched account...');
              
              // Use upsert to avoid duplicate key errors
              const { error: insertError } = await supabase
                .from('profiles')
                .upsert({
                  address: newAddress.toLowerCase(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'address',
                  ignoreDuplicates: false
                });
              
              if (insertError) {
                console.error('Failed to create default profile:', insertError);
              } else {
                console.log('Default off-chain profile created for switched account');
              }
            } else {
              console.log('Off-chain profile already exists for switched account');
            }
          } catch (error) {
            console.log('Could not check/create off-chain profile:', error);
          }
          
          toast({ 
            title: 'Account Switched', 
            description: `Switched to ${truncateAddress(newAddress)}` 
          });
          
          // Refresh profile for new account after ensuring off-chain profile exists
          console.log('Refreshing profile for new account...');
          // Wait a bit longer to ensure database operations complete
          setTimeout(async () => {
            const profile = await browserProvider.send('eth_accounts', []);
            if (profile.length > 0 && profile[0] === newAddress) {
              // Only refresh if we're still on the same account
              refreshProfile();
            }
          }, 300);
        }
      });

      ethProvider.on('chainChanged', () => window.location.reload());

      // Check for existing connection synchronously
      const wasConnected = localStorage.getItem('isWalletConnected') === 'true';

      if (wasConnected) {
        browserProvider.send('eth_accounts', [])
          .then(accounts => {
            if (accounts.length > 0) {
              setAddress(accounts[0]);
              setConnected(true);
            } else {
              localStorage.removeItem('isWalletConnected');
            }
          })
          .catch(() => {
            localStorage.removeItem('isWalletConnected');
          })
          .finally(() => {
            setIsInitializing(false);
          });
      } else {
        setIsInitializing(false);
      }
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounceProvider as EventListener);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Fallback for non-EIP-6963
    setTimeout(() => {
      if (!metaMaskProvider && window.ethereum) {
        initializeProvider(window.ethereum);
      } else if (!metaMaskProvider) {
        // No provider found, stop initializing
        setIsInitializing(false);
      }
    }, 100);

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider as EventListener);
    };
  }, [handleDisconnect, toast]);

  // Load user profile when address changes
  useEffect(() => {
    if (connected && address && provider) {
      refreshProfile();
    } else {
      setUserProfile(null);
    }
  }, [connected, address, provider, refreshProfile]);

  const connectWallet = async (): Promise<ConnectionResult | null> => {
    if (!provider) {
      toast({ title: 'MetaMask Not Found', description: 'Please install the MetaMask extension.', variant: 'destructive' });
      return null;
    }
    try {
      setIsConnecting(true);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setConnected(true);
        localStorage.setItem('isWalletConnected', 'true');
        localStorage.setItem('walletAddress', userAddress);
        
        // Auto-create off-chain profile if it doesn't exist
        try {
          const { profileService } = await import('@/services/profileService');
          const { supabase } = await import('@/lib/supabase');
          
          const existingProfile = await profileService.getProfile(userAddress);
          
          if (!existingProfile) {
            console.log('Creating default off-chain profile for new user...');
            
            // Create minimal off-chain profile in Supabase with upsert to avoid duplicates
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                address: userAddress.toLowerCase(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'address',
                ignoreDuplicates: false
              });
            
            if (insertError) {
              console.error('Failed to create default profile:', insertError);
            } else {
              console.log('Default off-chain profile created successfully');
            }
          } else {
            console.log('Off-chain profile already exists');
          }
        } catch (error) {
          console.log('Could not check/create off-chain profile:', error);
        }
        
        toast({ title: 'Wallet Connected', description: `Connected to ${truncateAddress(userAddress)}` });
        
        return { address: userAddress, profile: null };
      }
      return null;
    } catch (error: any) {
      toast({ title: 'Connection Failed', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    handleDisconnect();
    setLocation('/');
  };

  return (
    <WalletContext.Provider value={{ 
      connected, 
      address, 
      provider, 
      connectWallet, 
      disconnectWallet, 
      isConnecting,
      isInitializing,
      userProfile,
      isLoadingProfile,
      refreshProfile
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// Create a custom hook for easy consumption of the context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
