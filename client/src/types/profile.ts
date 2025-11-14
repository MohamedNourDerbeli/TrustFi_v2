// types/profile.ts
import type { Address } from 'viem';
import type { Card } from './card';

export interface Profile {
  id: string;
  wallet: Address;
  profileId: bigint;
  tokenUri: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  twitterHandle?: string;
  discordHandle?: string;
  websiteUrl?: string;
  score: bigint;
  cards: Card[];
  createdAt: Date;
}

export interface ProfileMetadata {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  twitterHandle?: string;
  discordHandle?: string;
  websiteUrl?: string;
}
