// lib/metadata.ts
import { uploadToPinata } from './pinata';

export interface ProfileMetadataInput {
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  walletAddress: string;
}

export interface ProfileMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  background_image?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Generate profile metadata JSON
 */
export function generateProfileMetadata(input: ProfileMetadataInput): ProfileMetadata {
  const {
    displayName,
    bio,
    avatarUrl,
    bannerUrl,
    websiteUrl,
    walletAddress,
  } = input;

  // Use provided avatar or generate a default one
  const image = avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`;

  const metadata: ProfileMetadata = {
    name: displayName || `Profile ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    description: bio || 'TrustFi Profile - Building reputation on-chain',
    image,
    attributes: [
      {
        trait_type: 'Wallet',
        value: walletAddress,
      },
      {
        trait_type: 'Created',
        value: new Date().toISOString(),
      },
      {
        trait_type: 'Platform',
        value: 'TrustFi',
      },
    ],
  };

  if (websiteUrl) {
    metadata.external_url = websiteUrl;
  }

  if (bannerUrl) {
    metadata.background_image = bannerUrl;
  }

  return metadata;
}

/**
 * Upload metadata to IPFS via Pinata
 * Returns the IPFS URI (ipfs://...)
 */
export async function uploadMetadataToIPFS(metadata: ProfileMetadata): Promise<string> {
  try {
    // Convert metadata to JSON blob
    const metadataJson = JSON.stringify(metadata, null, 2);
    const blob = new Blob([metadataJson], { type: 'application/json' });
    const file = new File([blob], 'metadata.json', { type: 'application/json' });

    // Upload to Pinata
    const ipfsUrl = await uploadToPinata(file);
    
    return ipfsUrl;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

/**
 * Create a data URI for metadata (fallback if IPFS upload fails)
 * This is not recommended for production but works for testing
 */
export function createMetadataDataURI(metadata: ProfileMetadata): string {
  const metadataJson = JSON.stringify(metadata);
  const base64 = btoa(metadataJson);
  return `data:application/json;base64,${base64}`;
}

/**
 * Generate and upload profile metadata
 * Returns the token URI (IPFS or data URI)
 */
export async function generateAndUploadMetadata(
  input: ProfileMetadataInput,
  useIPFS: boolean = true
): Promise<string> {
  const metadata = generateProfileMetadata(input);

  if (useIPFS) {
    try {
      return await uploadMetadataToIPFS(metadata);
    } catch (error) {
      console.warn('IPFS upload failed, falling back to data URI:', error);
      return createMetadataDataURI(metadata);
    }
  }

  return createMetadataDataURI(metadata);
}
