// lib/createProfileFlow.ts
import type { PublicClient } from 'viem';
import { supabase } from './supabase';
import { generateAndUploadMetadata } from './metadata';
import { parseContractError } from './errors';
import { showErrorNotification, showProfileCreatedNotification } from './notifications';
import { PROFILE_NFT_CONTRACT_ADDRESS } from './contracts';
import ProfileNFTABI from './ProfileNFT.abi.json';

export type Step =
  | 'idle' | 'validating' | 'checking' | 'generating_metadata' | 'uploading'
  | 'preparing' | 'signing' | 'confirming' | 'syncing_db' | 'success' | 'error';

export interface CreateProfileState {
  step: Step;
  message: string;
  error?: string;
  txHash?: string;
  profileId?: string;
}

export interface CreateProfileDeps {
  address: string;
  publicClient: PublicClient;
  formData: {
    displayName: string;
    username: string;
    avatarUrl: string;
    bannerUrl: string;
  };
  writeContract: (args: { args: [string] }) => void;
  refreshProfile: () => Promise<void>;
  navigate: (path: string, options?: any) => void;
}

export const createInitialState: CreateProfileState = {
  step: 'idle',
  message: '',
};

export async function createProfileFlow(
  deps: CreateProfileDeps,
  onState: (fn: (prev: CreateProfileState) => CreateProfileState) => void
): Promise<string | void> {
  const update = (d: Partial<CreateProfileState>) =>
    onState(p => ({ ...p, ...d }));

  try {
    const { address, publicClient, formData, writeContract } = deps;

    // 1. Wallet validation
    update({ step: 'validating', message: 'Validating wallet...' });
    if (!address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Network not ready');

    // 2. Check on-chain existence
    update({ step: 'checking', message: 'Checking existing profile...' });

    const profileId = await publicClient.readContract({
      address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: ProfileNFTABI as any,
      functionName: 'addressToProfileId',
      args: [address],
    } as any) as bigint;

    if (profileId > 0n) {
      return await syncExistingProfile(deps, profileId, onState);
    }

    // 3. Build metadata
    update({ step: 'generating_metadata', message: 'Generating metadata...' });

    const metadata = {
      displayName: formData.displayName,
      username: formData.username,
      avatarUrl: formData.avatarUrl,
      bannerUrl: formData.bannerUrl,
      walletAddress: address,
      bio: "",
      websiteUrl: ""
    };

    // 4. Upload metadata → IPFS
    update({ step: 'uploading', message: 'Uploading metadata to IPFS...' });
    const tokenURI = await generateAndUploadMetadata(metadata, true);

    // 5. Prepare & request signature
    update({ step: 'signing', message: 'Awaiting wallet signature...' });
    writeContract({ args: [tokenURI] });

    return tokenURI;
  } catch (err: any) {
    const parsed = parseContractError(err);
    update({ step: 'error', message: parsed.message, error: parsed.message });
    showErrorNotification('Profile Creation Failed', parsed.message);
    throw err;
  }
}

async function syncExistingProfile(
  deps: CreateProfileDeps,
  profileId: bigint,
  onState: (fn: (prev: CreateProfileState) => CreateProfileState) => void
): Promise<void> {
  const update = (d: Partial<CreateProfileState>) =>
    onState(p => ({ ...p, ...d }));

  const { address, publicClient, formData, navigate, refreshProfile } = deps;

  try {
    update({ step: 'checking', message: 'Syncing existing profile...' });

    // Check if captured in DB
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet', address.toLowerCase())
      .maybeSingle();

    if (data) {
      showErrorNotification("Profile Already Exists", "Redirecting...");
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
      return;
    }

    // Fetch tokenURI
    const tokenURI = await publicClient.readContract({
      address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: ProfileNFTABI as any,
      functionName: 'tokenURI',
      args: [profileId]
    } as any) as string;

    // Insert into DB
    update({ step: 'syncing_db', message: 'Saving profile...' });

    const { error } = await supabase.from('profiles').insert({
      wallet: address.toLowerCase(),
      profile_id: profileId.toString(),
      token_uri: tokenURI,
      display_name: formData.displayName,
      username: formData.username,
      avatar_url: formData.avatarUrl,
      banner_url: formData.bannerUrl
    });

    if (error) throw new Error(error.message);

    update({ step: 'success', message: 'Profile synced successfully' });
    showProfileCreatedNotification(profileId, "0x0");

    await refreshProfile();
    setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
  } catch (err: any) {
    update({ step: 'error', message: err.message, error: err.message });
    throw err;
  }
}

export async function handleTransactionConfirmed(
  deps: CreateProfileDeps,
  txHash: string,
  tokenURI: string,
  onState: (fn: (prev: CreateProfileState) => CreateProfileState) => void
) {
  const update = (d: Partial<CreateProfileState>) =>
    onState(p => ({ ...p, ...d }));

  const { publicClient, address, formData, refreshProfile, navigate } = deps;

  try {
    update({ step: 'confirming', message: 'Processing transaction...' });

    const profileId = await publicClient.readContract({
      address: PROFILE_NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: ProfileNFTABI as any,
      functionName: 'addressToProfileId',
      args: [address],
    } as any) as bigint;

    if (!profileId || profileId === 0n)
      throw new Error("Unable to retrieve profile ID");

    update({ step: 'syncing_db', message: 'Saving profile...' });

    const { error } = await supabase.from('profiles').insert({
      wallet: address.toLowerCase(),
      profile_id: profileId.toString(),
      token_uri: tokenURI,
      display_name: formData.displayName,
      username: formData.username,
      avatar_url: formData.avatarUrl,
      banner_url: formData.bannerUrl
    });

    if (error && error.code !== "23505")
      throw new Error(error.message);

    update({
      step: 'success',
      message: 'Profile created!',
      txHash,
      profileId: profileId.toString()
    });

    showProfileCreatedNotification(profileId, txHash as `0x${string}`);
    await refreshProfile();

    setTimeout(() => navigate('/dashboard', { replace: true }), 1800);
  } catch (err: any) {
    update({ step: 'error', message: err.message, error: err.message });
    showErrorNotification("Profile Failed", err.message);
  }
}
