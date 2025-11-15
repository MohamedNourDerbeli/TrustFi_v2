// types/collectible.ts
import type { Address } from 'viem';

export interface Collectible {
  id: string;
  templateId: bigint;
  title: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  tokenUri: string;
  claimType: 'direct' | 'signature';
  requirements?: Record<string, any>;
  createdBy: Address;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional computed fields
  tier?: number;
  maxSupply?: bigint;
  currentSupply?: bigint;
  hasClaimed?: boolean;
}

export interface CreateCollectibleParams {
  templateId: bigint;
  title: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  tokenUri: string;
  claimType: 'direct' | 'signature';
  requirements?: Record<string, any>;
}
