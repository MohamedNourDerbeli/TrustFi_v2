import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';

export type UserRole = 'user' | 'issuer' | 'admin';

export interface UseUserRoleReturn {
  userRole: UserRole;
  isLoading: boolean;
  error: string | null;
}

export const useUserRole = (
  connectedAddress: string,
  contractServiceReady: boolean,
  getCurrentChainId: number | null
): UseUserRoleReturn => {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectUserRole = async () => {
      if (!connectedAddress || !contractServiceReady || !getCurrentChainId) {
        setUserRole('user');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const chainId = getCurrentChainId;
        if (!CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ReputationCard) {
          setUserRole('user');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const reputationCardAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES].ReputationCard;
        
        // ReputationCard ABI for role checking
        const reputationCardABI = [
          "function owner() view returns (address)",
          "function isAuthorizedIssuer(address issuer) view returns (bool)"
        ];

        const reputationCardContract = new ethers.Contract(
          reputationCardAddress,
          reputationCardABI,
          provider
        );

        // Check if user is the contract owner (admin)
        const contractOwner = await reputationCardContract.owner();
        if (contractOwner.toLowerCase() === connectedAddress.toLowerCase()) {
          setUserRole('admin');
          return;
        }

        // Check if user is an authorized issuer
        const isAuthorizedIssuer = await reputationCardContract.isAuthorizedIssuer(connectedAddress);
        if (isAuthorizedIssuer) {
          setUserRole('issuer');
          return;
        }

        // Default to regular user
        setUserRole('user');

      } catch (error) {
        console.error('Error detecting user role:', error);
        setError('Failed to detect user role');
        setUserRole('user'); // Default to user on error
      } finally {
        setIsLoading(false);
      }
    };

    detectUserRole();
  }, [connectedAddress, contractServiceReady, getCurrentChainId]);

  return {
    userRole,
    isLoading,
    error
  };
};