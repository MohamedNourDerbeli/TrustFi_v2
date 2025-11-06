import { useState, useCallback } from 'react';
import { contractService, type Profile, type ProfileWithId } from '../services/contractService';
import { logError, getUserFriendlyMessage } from '../utils/errorHandler';

export interface UseContractState {
  loading: boolean;
  error: string | null;
}

export function useContract() {
  const [state, setState] = useState<UseContractState>({
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    logError(error, context);
    const userMessage = getUserFriendlyMessage(error);
    setError(userMessage);
  }, []);

  const createProfile = useCallback(async (name: string, bio: string): Promise<number | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const tokenId = await contractService.createProfile(name, bio);
      return tokenId;
    } catch (error) {
      handleError(error, 'createProfile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getProfile = useCallback(async (tokenId: number): Promise<Profile | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const profile = await contractService.getProfile(tokenId);
      return profile;
    } catch (error) {
      handleError(error, 'getProfile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getProfileByOwner = useCallback(async (ownerAddress: string): Promise<ProfileWithId | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const profile = await contractService.getProfileByOwner(ownerAddress);
      return profile;
    } catch (error) {
      handleError(error, 'getProfileByOwner');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateProfile = useCallback(async (tokenId: number, name: string, bio: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await contractService.updateProfile(tokenId, name, bio);
      return true;
    } catch (error) {
      handleError(error, 'updateProfile');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const profileExists = useCallback(async (tokenId: number): Promise<boolean> => {
    try {
      setError(null);
      return await contractService.profileExists(tokenId);
    } catch (error) {
      handleError(error, 'profileExists');
      return false;
    }
  }, [handleError]);

  const getTotalProfiles = useCallback(async (): Promise<number> => {
    try {
      setError(null);
      return await contractService.getTotalProfiles();
    } catch (error) {
      handleError(error, 'getTotalProfiles');
      return 0;
    }
  }, [handleError]);

  const getCurrentWalletAddress = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      return await contractService.getCurrentWalletAddress();
    } catch (error) {
      handleError(error, 'getCurrentWalletAddress');
      return null;
    }
  }, [handleError]);

  const getBalance = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      return await contractService.getBalance();
    } catch (error) {
      handleError(error, 'getBalance');
      return null;
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,
    
    // Contract methods
    createProfile,
    getProfile,
    getProfileByOwner,
    updateProfile,
    profileExists,
    getTotalProfiles,
    getCurrentWalletAddress,
    getBalance,
    
    // Utility methods
    clearError,
    isInitialized: contractService.isInitialized(),
    getCurrentChainId: contractService.getCurrentChainId(),
    getContractAddress: contractService.getContractAddress()
  };
}