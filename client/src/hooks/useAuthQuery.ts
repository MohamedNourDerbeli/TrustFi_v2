// hooks/useAuthQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { supabase } from '../lib/supabase';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTAbi from '../lib/ProfileNFT.abi.json';
import ReputationCardAbi from '../lib/ReputationCard.abi.json';
import { queryKeys } from '../lib/queryClient';

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const TEMPLATE_MANAGER_ROLE = '0x0b3c7d39e6b5e3b6e3c3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3';

// Check if address has profile in Supabase
async function checkHasProfile(address: Address): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('wallet', address.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking profile:', error);
  }

  return !!data;
}

// Check if address has admin role
async function checkIsAdmin(address: Address, publicClient: any): Promise<boolean> {
  try {
    const [isAdminOnProfile, isAdminOnReputation] = await Promise.all([
      publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as Address,
        abi: ProfileNFTAbi,
        functionName: 'hasRole',
        args: [DEFAULT_ADMIN_ROLE, address],
      }) as Promise<boolean>,
      publicClient.readContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardAbi,
        functionName: 'hasRole',
        args: [DEFAULT_ADMIN_ROLE, address],
      }) as Promise<boolean>,
    ]);

    return isAdminOnProfile || isAdminOnReputation;
  } catch (err) {
    console.error('Error checking admin role:', err);
    return false;
  }
}

// Check if address has issuer role
async function checkIsIssuer(address: Address, publicClient: any): Promise<boolean> {
  try {
    const isTemplateManager = await publicClient.readContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardAbi,
      functionName: 'hasRole',
      args: [TEMPLATE_MANAGER_ROLE, address],
    }) as boolean;

    return isTemplateManager;
  } catch (err) {
    console.error('Error checking issuer role:', err);
    return false;
  }
}

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

export function useAuthQuery(): UseAuthReturn {
  const { address, isConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  // Query for profile existence
  const hasProfileQuery = useQuery({
    queryKey: queryKeys.profile(address),
    queryFn: () => checkHasProfile(address!),
    enabled: !!address && isConnected,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for admin role
  const isAdminQuery = useQuery({
    queryKey: queryKeys.isAdmin(address),
    queryFn: () => checkIsAdmin(address!, publicClient),
    enabled: !!address && isConnected && !!publicClient,
    staleTime: 1000 * 60 * 10, // 10 minutes (roles don't change often)
  });

  // Query for issuer role
  const isIssuerQuery = useQuery({
    queryKey: queryKeys.isIssuer(address),
    queryFn: () => checkIsIssuer(address!, publicClient),
    enabled: !!address && isConnected && !!publicClient,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

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
      // Clear all queries on disconnect
      queryClient.clear();
    }
  };

  const isAdmin = isAdminQuery.data || false;
  const isIssuer = isIssuerQuery.data || isAdmin;
  const hasProfile = hasProfileQuery.data || false;
  const isLoading = hasProfileQuery.isLoading || isAdminQuery.isLoading || isIssuerQuery.isLoading;

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
