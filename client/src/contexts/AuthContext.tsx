// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useContractRead, usePublicClient } from 'wagmi';
import { type Address, keccak256, toHex } from 'viem';
import { supabase } from '../lib/supabase';
import { PROFILE_NFT_CONTRACT_ADDRESS, REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ProfileNFTAbi from '../lib/ProfileNFT.abi.json';
import ReputationCardAbi from '../lib/ReputationCard.abi.json';
import { useDataCache } from './DataCacheContext';
import { CACHE_TIMES } from '../lib/constants';
import { getDid, generateDidForUser, generateDidForIssuer } from '../lib/kilt/did-manager';
import type { DidDocument } from '../types/kilt';

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
  userDid: DidDocument | null;
  issuerDid: DidDocument | null;
  connect: () => void;
  disconnect: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { getCache, setCache, isCacheValid, clearCache } = useDataCache();
  const [hasProfile, setHasProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [userDid, setUserDid] = useState<DidDocument | null>(null);
  const [issuerDid, setIssuerDid] = useState<DidDocument | null>(null);
  const checkInProgressRef = useRef(false);
  const lastCheckedAddressRef = useRef<string | null>(null);

  // Removed excessive debug logging

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

  // Check if profile exists (both on-chain and in Supabase)
  const checkProfile = async (forceRefresh = false) => {
    if (!address || !isConnected || !publicClient) {
      setIsCheckingProfile(false);
      setHasProfile(false);
      setUserDid(null);
      lastCheckedAddressRef.current = null;
      return;
    }

    const lowerAddress = address.toLowerCase();
    const cacheKey = `hasProfile_${lowerAddress}`;

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      clearCache();
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid(cacheKey, CACHE_TIMES.AUTH_CACHE_TTL)) {
      const cachedValue = getCache<boolean>(cacheKey);
      if (cachedValue !== null) {
        setHasProfile(cachedValue);
        setIsCheckingProfile(false);
        // Still check for DID even if profile is cached
        if (cachedValue) {
          checkAndCreateDid(lowerAddress);
        }
        return;
      }
    }

    // Prevent duplicate checks for the same address
    if (checkInProgressRef.current && lastCheckedAddressRef.current === lowerAddress) {
      return;
    }

    checkInProgressRef.current = true;
    lastCheckedAddressRef.current = lowerAddress;
    setIsCheckingProfile(true);

    try {
      // First check on-chain
      const profileIdResult = await publicClient.readContract({
        address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: ProfileNFTAbi,
        functionName: 'addressToProfileId',
        args: [address],
      }) as bigint;

      // If profileId is 0, user doesn't have a profile
      if (profileIdResult === 0n) {
        setHasProfile(false);
        setUserDid(null);
        setCache(cacheKey, false, CACHE_TIMES.AUTH_CACHE_TTL);
        return;
      }

      // Profile exists on-chain, now check Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('id, wallet, profile_id')
        .ilike('wallet', lowerAddress)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[AuthContext] Error checking profile:', error);
        // If there's an error but we have on-chain profile, still consider it valid
        setHasProfile(true);
        setCache(cacheKey, true, CACHE_TIMES.AUTH_CACHE_TTL);
      } else {
        const profileExists = !!data || profileIdResult > 0n;
        setHasProfile(profileExists);
        setCache(cacheKey, profileExists, CACHE_TIMES.AUTH_CACHE_TTL);
        
        // If profile exists, check for DID and create if needed
        if (profileExists) {
          await checkAndCreateDid(lowerAddress);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Exception checking profile:', err);
      setHasProfile(false);
      setUserDid(null);
      setCache(cacheKey, false, CACHE_TIMES.AUTH_CACHE_TTL);
    } finally {
      setIsCheckingProfile(false);
      checkInProgressRef.current = false;
    }
  };

  // Check for existing DID and create if needed
  const checkAndCreateDid = async (walletAddress: string) => {
    try {
      // Check if DID already exists
      const existingDid = await getDid(walletAddress, false);
      
      if (existingDid) {
        console.log('[AuthContext] Found existing DID for user:', existingDid.uri);
        setUserDid(existingDid);
      } else {
        // No DID exists, create one
        console.log('[AuthContext] No DID found, creating new DID for user');
        const newDid = await generateDidForUser(walletAddress);
        setUserDid(newDid);
        console.log('[AuthContext] Successfully created DID:', newDid.uri);
      }
    } catch (error) {
      console.error('[AuthContext] Error managing user DID:', error);
      // Don't throw - DID creation failure shouldn't block the user
      // They can still use the platform without KILT features
    }
  };

  // Check for existing issuer DID and create if needed
  const checkAndCreateIssuerDid = async (issuerAddress: string) => {
    try {
      // Check if issuer DID already exists
      const existingIssuerDid = await getDid(issuerAddress, true);
      
      if (existingIssuerDid) {
        console.log('[AuthContext] Found existing issuer DID:', existingIssuerDid.uri);
        setIssuerDid(existingIssuerDid);
      } else {
        // No issuer DID exists, create one
        console.log('[AuthContext] No issuer DID found, creating new issuer DID');
        const newIssuerDid = await generateDidForIssuer(issuerAddress);
        setIssuerDid(newIssuerDid);
        console.log('[AuthContext] Successfully created issuer DID:', newIssuerDid.uri);
      }
    } catch (error) {
      console.error('[AuthContext] Error managing issuer DID:', error);
      // Don't throw - DID creation failure shouldn't block the issuer
      // They can still use the platform without KILT features
    }
  };

  useEffect(() => {
    // Only check profile, don't clear cache unless address actually changed
    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, publicClient]);

  // Check for issuer DID when user becomes an issuer
  useEffect(() => {
    const checkIssuerDid = async () => {
      if (address && isConnected && (isTemplateManager || isAdminOnProfile || isAdminOnReputation)) {
        const lowerAddress = address.toLowerCase();
        await checkAndCreateIssuerDid(lowerAddress);
      } else {
        // Clear issuer DID if user is no longer an issuer
        setIssuerDid(null);
      }
    };

    checkIssuerDid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, isTemplateManager, isAdminOnProfile, isAdminOnReputation]);

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
      setUserDid(null);
      setIssuerDid(null);
    }
  };

  const isAdmin = !!(isAdminOnProfile || isAdminOnReputation);
  const isIssuer = !!(isTemplateManager || isAdmin);
  const isLoading = isCheckingProfile;

  // Refresh profile by clearing cache and re-checking
  const refreshProfile = async () => {
    await checkProfile(true);
  };

  const value: AuthContextValue = {
    address,
    isConnected,
    hasProfile,
    isAdmin,
    isIssuer,
    isLoading,
    userDid,
    issuerDid,
    connect,
    disconnect,
    refreshProfile,
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
