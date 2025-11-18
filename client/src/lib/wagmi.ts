// lib/wagmi.ts
// Simplified wagmi configuration using Web3Modal's helper to avoid deep connector imports.
import { createConfig, http } from 'wagmi';
import { moonbaseAlpha } from 'wagmi/chains';
import { injected, walletConnect } from '@wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
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

export const chains = [moonbaseAlpha];

const talismanTarget = () => {
  if (typeof window === 'undefined') return undefined;
  const anyWindow = window as unknown as Record<string, any>;
  const ethereum = anyWindow.ethereum;
  const providers: any[] = ethereum?.providers ?? (ethereum ? [ethereum] : []);
  const fromProviders = providers.find((provider) => provider?.isTalisman);
  const fromNamespace = anyWindow.talismanEth?.provider ?? anyWindow.talisman?.ethereum;
  const provider = fromProviders || fromNamespace;
  if (!provider) return undefined;

  return {
    id: 'talisman',
    name: 'Talisman',
    icon: 'https://raw.githubusercontent.com/TalismanSociety/brand-kit/main/assets/icon/mark-gradient.svg',
    provider: () => provider,
  } as const;
};

const connectors = [
  injected({ shimDisconnect: true }),
  injected({ shimDisconnect: true, target: talismanTarget }),
  projectId ? walletConnect({ projectId }) : null,
].filter(Boolean);

export const config = createConfig({
  chains,
  transports: { [moonbaseAlpha.id]: http(rpcUrl) },
  multiInjectedProviderDiscovery: true,
  connectors: connectors as Parameters<typeof createConfig>[0]['connectors'],
});

export { moonbaseAlpha };
