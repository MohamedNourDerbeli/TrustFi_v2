import { type EIP1193Provider } from 'viem';
import { useWalletClient } from 'wagmi';
import type { WalletClient } from 'viem';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useMemo } from 'react';

// This is the new, correct way to convert a Viem WalletClient to an Ethers Signer
export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  
  if (!account || !chain) {
    throw new Error('WalletClient must have an account and chain');
  }
  
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  
  // Use the EIP-1193 provider from the viem transport
  const provider = new BrowserProvider(transport as unknown as EIP1193Provider, network);
  const signer = new JsonRpcSigner(provider, account.address);
  
  return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  );
}
