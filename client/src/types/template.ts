// types/template.ts
import type { Address } from 'viem';

export interface Template {
  templateId: bigint;
  issuer: Address;
  name: string;
  description: string;
  maxSupply: bigint;
  currentSupply: bigint;
  tier: number;
  startTime: bigint;
  endTime: bigint;
  isPaused: boolean;
}

export interface CreateTemplateParams {
  templateId: bigint;
  issuer: Address;
  maxSupply: bigint;
  tier: number;
  startTime: bigint;
  endTime: bigint;
}
