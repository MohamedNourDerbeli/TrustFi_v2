// lib/wagmi.ts
// Simplified wagmi configuration using Web3Modal's helper to avoid deep connector imports.
import { createConfig, http } from 'wagmi';
import { moonbaseAlpha } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';
const envRpc = (() => {
  try {
    return import.meta.env.VITE_RPC_URL;
  } catch {
    return undefined;
  }
})();

const PUBLIC_FALLBACK_RPC = moonbaseAlpha.rpcUrls.default.http[0];
const CORS_RISK_PATTERN = /dwellir\.com|\.onrender\.com|localhost:8545/i;
let rpcUrl = PUBLIC_FALLBACK_RPC;
if (envRpc && envRpc.trim()) {
  if (typeof window === 'undefined') rpcUrl = envRpc;
  else if (!CORS_RISK_PATTERN.test(envRpc)) rpcUrl = envRpc;
  else console.warn('[wagmi] Browser RPC CORS risk, using public fallback:', envRpc);
}

export const chains = [moonbaseAlpha] as const;

// Talisman support removed for now to keep MetaMask-only flow

// MetaMask only: use the injected connector targeted to MetaMask
const connectors = [injected({ shimDisconnect: true, target: 'metaMask' })];

export const config = createConfig({
  chains,
  transports: { [moonbaseAlpha.id]: http(rpcUrl) },
  multiInjectedProviderDiscovery: true,
  connectors: connectors as Parameters<typeof createConfig>[0]['connectors'],
});

export { moonbaseAlpha };
