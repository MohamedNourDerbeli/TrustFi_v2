import { createContext, useState, useEffect, useContext, useCallback, useRef, type ReactNode } from 'react';
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

// Connection error types
type ConnectionErrorType = 'USER_REJECTED' | 'NO_PROVIDER' | 'NETWORK_ERROR' | 'UNKNOWN';

interface ConnectionError {
  type: ConnectionErrorType;
  message: string;
  originalError?: any;
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
  connectionError: ConnectionError | null;
  clearConnectionError: () => void;
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
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  const { toast } = useToast();
  
  // Refs for tracking state across re-renders
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const profileCacheRef = useRef<{ address: string; profile: UserProfile; timestamp: number } | null>(null);
  const profileCacheTTL = 5 * 60 * 1000; // 5 minutes

  const truncateAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  
  const clearConnectionError = useCallback(() => {
    setConnectionError(null);
  }, []);
  
  // Helper to classify connection errors
  const classifyConnectionError = (error: any): ConnectionError => {
    const isUserRejection = 
      error.code === 4001 || 
      error.code === 'ACTION_REJECTED' ||
      error.message?.includes('User rejected') ||
      error.message?.includes('user rejected') ||
      error.message?.includes('User denied');
    
    if (isUserRejection) {
      return {
        type: 'USER_REJECTED',
        message: 'Connection request was rejected',
        originalError: error
      };
    }
    
    if (error.message?.includes('network') || error.message?.includes('Network')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        originalError: error
      };
    }
    
    return {
      type: 'UNKNOWN',
      message: error.message || 'An unknown error occurred',
      originalError: error
    };
  };

  // Function to refresh user profile and clear cache
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!connected || !address || !provider) {
      return null;
    }
    
    // Clear cache to force fresh fetch
    profileCacheRef.current = null;
    setIsLoadingProfile(true);
    
    try {
      const { contractService } = await import('@/services/contractService');
      const { reputationCardService } = await import('@/services/reputationCardService');
      
      if (!contractService.isInitialized()) {
        await contractService.initialize(provider);
      }
      if (!reputationCardService.isInitialized()) {
        await reputationCardService.initialize(provider);
      }

      try {
        const profile = await contractService.getProfileByOwner(address);
        const isIssuer = await reputationCardService.isAuthorizedIssuer(address);
        
        const userProfileData = {
          tokenId: profile.tokenId.toString(),
          hasProfile: true,
          isAdmin: isIssuer,
          isIssuer: isIssuer,
        };
        
        setUserProfile(userProfileData);
        
        // Update cache
        profileCacheRef.current = {
          address,
          profile: userProfileData,
          timestamp: Date.now()
        };
        
        return userProfileData;
      } catch (error: any) {
        const userProfileData = {
          tokenId: '',
          hasProfile: false,
          isAdmin: false,
          isIssuer: false,
        };
        
        setUserProfile(userProfileData);
        
        // Update cache
        profileCacheRef.current = {
          address,
          profile: userProfileData,
          timestamp: Date.now()
        };
        
        return userProfileData;
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [connected, address, provider]);

  const handleDisconnect = useCallback(async () => {
    // Clear any pending reconnection attempts
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    reconnectAttempts.current = 0;
    
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
    setConnectionError(null);
    profileCacheRef.current = null;
    localStorage.removeItem('isWalletConnected');
    localStorage.removeItem('walletAddress');
    
    // Clean up contract services
    try {
      const { contractService } = await import('@/services/contractService');
      
      // Reset services (they will need to be reinitialized on next connection)
      if (contractService.isInitialized()) {
        console.log('Cleaning up contract services on disconnect');
      }
    } catch (error) {
      console.error('Error cleaning up services:', error);
    }
    
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
          
          // Check/create off-chain profile for the new account (OpenSea-style)
          try {
            const { profileService } = await import('@/services/profileService');
            const { queryClient } = await import('@/lib/queryClient');
            const { supabase } = await import('@/lib/supabase');
            
            const existingProfile = await profileService.getProfile(newAddress);
            
            if (!existingProfile) {
              console.log('Creating default off-chain profile for switched account...');
              
              const defaultUsername = `user${newAddress.slice(2, 10).toLowerCase()}`;
              
              const { error: insertError } = await supabase
                .from('profiles')
                .upsert({
                  address: newAddress.toLowerCase(),
                  username: defaultUsername,
                  display_name: 'Unnamed',
                }, {
                  onConflict: 'address',
                  ignoreDuplicates: false
                });
              
              if (insertError) {
                console.error('Failed to create default profile:', insertError);
              } else {
                console.log('Default off-chain profile created for switched account');
                // Invalidate React Query cache
                queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', newAddress.toLowerCase()] });
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

      ethProvider.on('chainChanged', async (chainId: string) => {
        console.log('Network changed to:', chainId);
        
        // Clear connection error on network change
        setConnectionError(null);
        
        // Reinitialize services with new network
        try {
          const { contractService } = await import('@/services/contractService');
          const { reputationCardService } = await import('@/services/reputationCardService');
          const { collectibleContractService } = await import('@/services/collectibleContractService');
          
          console.log('Reinitializing services for new network...');
          await contractService.initialize(browserProvider);
          await reputationCardService.initialize(browserProvider);
          await collectibleContractService.initialize(browserProvider);
          
          toast({
            title: 'Network Changed',
            description: 'Services reinitialized for the new network.',
          });
          
          // Reload profile for new network
          if (connected && address) {
            refreshProfile();
          }
        } catch (error: any) {
          console.error('Failed to reinitialize services:', error);
          setConnectionError({
            type: 'NETWORK_ERROR',
            message: 'Failed to connect to the new network. Please refresh the page.',
            originalError: error
          });
          toast({
            title: 'Network Change Failed',
            description: 'Please refresh the page to reconnect.',
            variant: 'destructive'
          });
        }
      });

      // Check for existing connection synchronously
      const wasConnected = localStorage.getItem('isWalletConnected') === 'true';
      const savedAddress = localStorage.getItem('walletAddress');

      if (wasConnected && savedAddress) {
        browserProvider.send('eth_accounts', [])
          .then(accounts => {
            if (accounts.length > 0) {
              const currentAddress = accounts[0];
              setAddress(currentAddress);
              setConnected(true);
              
              // Update saved address if it changed
              if (currentAddress !== savedAddress) {
                localStorage.setItem('walletAddress', currentAddress);
              }
              
              console.log('Auto-reconnected to wallet:', truncateAddress(currentAddress));
            } else {
              // No accounts available, clear saved state
              localStorage.removeItem('isWalletConnected');
              localStorage.removeItem('walletAddress');
            }
          })
          .catch((error) => {
            console.error('Auto-reconnection failed:', error);
            const connError = classifyConnectionError(error);
            setConnectionError(connError);
            
            // Clear saved state on error
            localStorage.removeItem('isWalletConnected');
            localStorage.removeItem('walletAddress');
            
            // Attempt to reconnect after a delay if not user rejection
            if (connError.type !== 'USER_REJECTED' && 
                reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current++;
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000);
              
              console.log(`Scheduling reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
              
              reconnectTimeout.current = setTimeout(() => {
                console.log('Attempting automatic reconnection...');
                browserProvider.send('eth_accounts', [])
                  .then(accounts => {
                    if (accounts.length > 0) {
                      setAddress(accounts[0]);
                      setConnected(true);
                      setConnectionError(null);
                      localStorage.setItem('isWalletConnected', 'true');
                      localStorage.setItem('walletAddress', accounts[0]);
                      reconnectAttempts.current = 0;
                      console.log('Automatic reconnection successful');
                    }
                  })
                  .catch((retryError) => {
                    console.error('Reconnection attempt failed:', retryError);
                  });
              }, delay);
            }
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

  // Load user profile when address changes using React Query
  useEffect(() => {
    const loadProfile = async () => {
      if (!connected || !address || !provider) {
        setUserProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      // Check cache first
      const now = Date.now();
      if (profileCacheRef.current && 
          profileCacheRef.current.address === address &&
          now - profileCacheRef.current.timestamp < profileCacheTTL) {
        console.log('Using cached profile data');
        setUserProfile(profileCacheRef.current.profile);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      
      try {
        const { contractService } = await import('@/services/contractService');
        const { reputationCardService } = await import('@/services/reputationCardService');
        
        if (!contractService.isInitialized()) {
          await contractService.initialize(provider);
        }
        if (!reputationCardService.isInitialized()) {
          await reputationCardService.initialize(provider);
        }

        try {
          const profile = await contractService.getProfileByOwner(address);
          const isIssuer = await reputationCardService.isAuthorizedIssuer(address);
          
          const userProfileData = {
            tokenId: profile.tokenId.toString(),
            hasProfile: true,
            isAdmin: isIssuer,
            isIssuer: isIssuer,
          };
          
          setUserProfile(userProfileData);
          
          // Cache the profile data
          profileCacheRef.current = {
            address,
            profile: userProfileData,
            timestamp: now
          };
        } catch (error: any) {
          const userProfileData = {
            tokenId: '',
            hasProfile: false,
            isAdmin: false,
            isIssuer: false,
          };
          
          setUserProfile(userProfileData);
          
          // Cache the empty profile to avoid repeated failed requests
          profileCacheRef.current = {
            address,
            profile: userProfileData,
            timestamp: now
          };
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setUserProfile(null);
        // Don't cache on error
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [connected, address, provider]);

  const connectWallet = async (): Promise<ConnectionResult | null> => {
    if (!provider) {
      const error: ConnectionError = {
        type: 'NO_PROVIDER',
        message: 'MetaMask not found. Please install the MetaMask extension.'
      };
      setConnectionError(error);
      toast({ 
        title: 'MetaMask Not Found', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }
    
    try {
      setIsConnecting(true);
      setConnectionError(null);
      reconnectAttempts.current = 0; // Reset reconnect attempts on manual connection
      
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setConnected(true);
        localStorage.setItem('isWalletConnected', 'true');
        localStorage.setItem('walletAddress', userAddress);
        
        // Auto-create off-chain profile if it doesn't exist (OpenSea-style)
        let profileCreated = false;
        try {
          const { profileService } = await import('@/services/profileService');
          const { queryClient } = await import('@/lib/queryClient');
          const { supabase } = await import('@/lib/supabase');
          
          const existingProfile = await profileService.getProfile(userAddress);
          
          if (!existingProfile) {
            console.log('Creating default off-chain profile for new user...');
            
            const defaultUsername = `user${userAddress.slice(2, 10).toLowerCase()}`;
            
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                address: userAddress.toLowerCase(),
                username: defaultUsername,
                display_name: 'Unnamed',
              }, {
                onConflict: 'address',
                ignoreDuplicates: false
              });
            
            if (insertError) {
              console.error('Failed to create default profile:', insertError);
            } else {
              console.log('Default off-chain profile created successfully with username:', defaultUsername);
              profileCreated = true;
              // Invalidate React Query cache and wait a bit for it to propagate
              await queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', userAddress.toLowerCase()] });
              // Small delay to ensure database write is complete
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } else {
            console.log('Off-chain profile already exists');
          }
        } catch (error) {
          console.log('Could not check/create off-chain profile:', error);
        }
        
        toast({ 
          title: 'Wallet Connected', 
          description: profileCreated 
            ? `Welcome! Your profile has been created.`
            : `Connected to ${truncateAddress(userAddress)}` 
        });
        
        return { address: userAddress, profile: null };
      }
      return null;
    } catch (error: any) {
      const connError = classifyConnectionError(error);
      setConnectionError(connError);
      
      // Only show toast for non-user-rejection errors
      if (connError.type !== 'USER_REJECTED') {
        toast({ 
          title: 'Connection Failed', 
          description: connError.message, 
          variant: 'destructive' 
        });
      }
      
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    handleDisconnect();
    setLocation('/');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

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
      refreshProfile,
      connectionError,
      clearConnectionError
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
