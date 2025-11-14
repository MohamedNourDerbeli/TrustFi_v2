// types/claim.ts
import type { Address, Hex } from 'viem';

export interface ClaimSignature {
  user: Address;
  profileOwner: Address;
  templateId: bigint;
  nonce: bigint;
  signature: Hex;
}

export interface ClaimParams {
  user: Address;
  profileOwner: Address;
  templateId: bigint;
  nonce: bigint;
  tokenURI: string;
}

export type ClaimType = 'direct' | 'signature';
