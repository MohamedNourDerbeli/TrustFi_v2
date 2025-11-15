// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useContractRead } from 'wagmi';
import { type Address, keccak256, toHex } from 'viem';
import { supabase } from '../lib/supabase';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTAbi from '../lib/ProfileNFT.abi.json';
import ReputationCardAbi from '../lib/ReputationCard.abi.json';

// Role hashes
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const TEMPLATE_MANAGER_ROLE = keccak256(toHex('TEMPLATE_MANAGER_ROLE'));

export interface AuthContextValue {
  address: Address | undefined;
  isConnected: boolean;
  hasProfile: boolean;
  isAdmin: boolean;
  isIssuer: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const [hasProfile, setHasProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const checkInProgressRef = useRef(false);
  const lastCheckedAddressRef = useRef<string | null>(null);

  // Check if user has DEFAULT_ADMIN_ROLE on ProfileNFT contract
  const { data: isAdminOnProfile } = useContractRead({
    address: PROFILE_NFT_CONTRACT_ADDRESS as Address,
    abi: ProfileNFTAbi,
    functionName: 'hasRole',
    args: [
      DEFAULT_ADMIN_ROLE,
      address || '0x0000000000000000000000000000000000000000',
    ],
    enabled: !!address && isConnected,
  });

  // Check if user has DEFAULT_ADMIN_ROLE on ReputationCard contract
  const { data: isAdminOnReputation } = useContractRead({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    functionName: 'hasRole',
    args: [
      DEFAULT_ADMIN_ROLE,
      address || '0x0000000000000000000000000000000000000000',
    ],
    enabled: !!address && isConnected,
  });

  // Check if user has TEMPLATE_MANAGER_ROLE
  const { data: isTemplateManager } = useContractRead({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    functionName: 'hasRole',
    args: [
      TEMPLATE_MANAGER_ROLE,
      address || '0x0000000000000000000000000000000000000000',
    ],
    enabled: !!address && isConnected,
  });

  // Check if profile exists in Supabase
  const checkProfile = async () => {
    if (!address || !isConnected) {
      setIsCheckingProfile(false);
      setHasProfile(false);
      lastCheckedAddressRef.current = null;
      return;
    }

    const lowerAddress = address.toLowerCase();

    // Prevent duplicate checks for the same address
    if (checkInProgressRef.current && lastCheckedAddressRef.current === lowerAddress) {
      console.log('[AuthContext] Check already in progress for:', lowerAddress);
      return;
    }

    checkInProgressRef.current = true;
    lastCheckedAddressRef.current = lowerAddress;
    setIsCheckingProfile(true);

    try {
      console.log('[AuthContext] Checking profile for address:', lowerAddress);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, wallet, profile_id')
        .ilike('wallet', lowerAddress)
        .maybeSingle();

      console.log('[AuthContext] Profile check result:', { data, error, hasProfile: !!data });

      if (error) {
        console.error('[AuthContext] Error checking profile:', error);
        setHasProfile(false);
      } else {
        const profileExists = !!data;
        console.log('[AuthContext] Setting hasProfile to:', profileExists);
        setHasProfile(profileExists);
      }
    } catch (err) {
      console.error('[AuthContext] Exception checking profile:', err);
      setHasProfile(false);
    } finally {
      setIsCheckingProfile(false);
      checkInProgressRef.current = false;
    }
  };

  useEffect(() => {
    checkProfile();
  }, [address, isConnected]);

  const connect = () => {
    const connector = connectors[0];
    if (connector) {
      wagmiConnect({ connector });
    }
  };

  const disconnect = async () => {
    try {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (revokeError) {
          console.warn('Failed to revoke permissions:', revokeError);
        }
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      wagmiDisconnect();
      setHasProfile(false);
    }
  };

  const isAdmin = !!(isAdminOnProfile || isAdminOnReputation);
  const isIssuer = !!(isTemplateManager || isAdmin);
  const isLoading = isCheckingProfile;

  const value: AuthContextValue = {
    address,
    isConnected,
    hasProfile,
    isAdmin,
    isIssuer,
    isLoading,
    connect,
    disconnect,
    refreshProfile: checkProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
