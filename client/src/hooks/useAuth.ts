// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useContractRead } from 'wagmi';
import { type Address } from 'viem';
import { supabase } from '../lib/supabase';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTAbi from '../lib/ProfileNFT.abi.json';
import ReputationCardAbi from '../lib/ReputationCard.abi.json';

export interface UseAuthReturn {
  address: Address | undefined;
  isConnected: boolean;
  hasProfile: boolean;
  isAdmin: boolean;
  isIssuer: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useAuth(): UseAuthReturn {
  const { address, isConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const [hasProfile, setHasProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // Check if user has DEFAULT_ADMIN_ROLE on ProfileNFT contract
  const { data: isAdminOnProfile } = useContractRead({
    address: PROFILE_NFT_CONTRACT_ADDRESS as Address,
    abi: ProfileNFTAbi,
    functionName: 'hasRole',
    args: [
      '0x0000000000000000000000000000000000000000000000000000000000000000', // DEFAULT_ADMIN_ROLE
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
      '0x0000000000000000000000000000000000000000000000000000000000000000', // DEFAULT_ADMIN_ROLE
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
      '0x0b3c7d39e6b5e3b6e3c3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3', // TEMPLATE_MANAGER_ROLE (keccak256("TEMPLATE_MANAGER_ROLE"))
      address || '0x0000000000000000000000000000000000000000',
    ],
    enabled: !!address && isConnected,
  });

  // Check if profile exists in Supabase
  useEffect(() => {
    const checkProfile = async () => {
      if (!address || !isConnected) {
        setHasProfile(false);
        return;
      }

      setIsCheckingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet', address.toLowerCase())
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          console.error('Error checking profile:', error);
        }

        setHasProfile(!!data);
      } catch (err) {
        console.error('Error checking profile:', err);
        setHasProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, [address, isConnected]);

  const connect = () => {
    // Use the first available connector (usually injected/MetaMask)
    const connector = connectors[0];
    if (connector) {
      wagmiConnect({ connector });
    }
  };

  const disconnect = async () => {
    try {
      // Revoke permissions in MetaMask before disconnecting
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [
              {
                eth_accounts: {},
              },
            ],
          });
        } catch (revokeError) {
          // If revoke fails (older MetaMask versions), just continue with disconnect
          console.warn('Failed to revoke permissions:', revokeError);
        }
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      // Always disconnect from wagmi and clear state
      wagmiDisconnect();
      setHasProfile(false);
    }
  };

  const isAdmin = !!(isAdminOnProfile || isAdminOnReputation);
  const isIssuer = !!(isTemplateManager || isAdmin);
  const isLoading = isCheckingProfile;

  return {
    address,
    isConnected,
    hasProfile,
    isAdmin,
    isIssuer,
    isLoading,
    connect,
    disconnect,
  };
}
