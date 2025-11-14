// lib/signature.ts
import type { Address, Hex, TypedDataDomain } from 'viem';
import type { ClaimParams } from '../types';

/**
 * EIP712 Domain for TrustFi ReputationCard contract
 */
export function getEIP712Domain(
  contractAddress: Address,
  chainId: number = 1287 // Moonbase Alpha
): TypedDataDomain {
  return {
    name: 'ReputationCard',
    version: '1',
    chainId: BigInt(chainId),
    verifyingContract: contractAddress,
  };
}

/**
 * EIP712 Types for Claim signature
 */
export const CLAIM_TYPES = {
  Claim: [
    { name: 'user', type: 'address' },
    { name: 'profileOwner', type: 'address' },
    { name: 'templateId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'tokenURI', type: 'string' },
  ],
} as const;

/**
 * Get typed data for claim signature
 */
export function getClaimTypedData(
  params: ClaimParams,
  contractAddress: Address,
  chainId?: number
) {
  return {
    domain: getEIP712Domain(contractAddress, chainId),
    types: CLAIM_TYPES,
    primaryType: 'Claim' as const,
    message: {
      user: params.user,
      profileOwner: params.profileOwner,
      templateId: params.templateId,
      nonce: params.nonce,
      tokenURI: params.tokenURI,
    },
  };
}

/**
 * Generate a claim link URL with encoded parameters
 */
export function generateClaimLink(
  baseUrl: string,
  params: ClaimParams,
  signature: Hex
): string {
  const searchParams = new URLSearchParams({
    user: params.user,
    profileOwner: params.profileOwner,
    templateId: params.templateId.toString(),
    nonce: params.nonce.toString(),
    tokenURI: params.tokenURI,
    signature: signature,
  });
  
  return `${baseUrl}/claim?${searchParams.toString()}`;
}

/**
 * Parse claim parameters from URL search params
 */
export function parseClaimLink(searchParams: URLSearchParams): {
  params: ClaimParams;
  signature: Hex;
} | null {
  try {
    const user = searchParams.get('user');
    const profileOwner = searchParams.get('profileOwner');
    const templateId = searchParams.get('templateId');
    const nonce = searchParams.get('nonce');
    const tokenURI = searchParams.get('tokenURI');
    const signature = searchParams.get('signature');
    
    if (!user || !profileOwner || !templateId || !nonce || !tokenURI || !signature) {
      return null;
    }
    
    return {
      params: {
        user: user as Address,
        profileOwner: profileOwner as Address,
        templateId: BigInt(templateId),
        nonce: BigInt(nonce),
        tokenURI,
      },
      signature: signature as Hex,
    };
  } catch (error) {
    console.error('Error parsing claim link:', error);
    return null;
  }
}
