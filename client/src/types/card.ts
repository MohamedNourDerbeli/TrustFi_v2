// types/card.ts
import type { Address } from 'viem';

export interface Card {
  cardId: bigint;
  templateId: bigint;
  profileId: bigint;
  tokenUri: string;
  tier: number;
  issuer: Address;
  claimedAt: Date;
}

export interface CardMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}
