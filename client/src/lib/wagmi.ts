// lib/wagmi.ts
import { configureChains, createConfig } from 'wagmi';
import { moonbaseAlpha } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// WalletConnect project ID - should be set in .env
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Use private RPC if available, fallback to public
// IMPORTANT: Browser-based JSON-RPC calls will fail CORS on many private endpoints (e.g. dwellir.com UUID URLs).
// Detect known CORS-hostile domains and automatically switch to a public RPC to keep the dapp functional.
const envRpc = import.meta.env.VITE_RPC_URL;
const PUBLIC_FALLBACK_RPC = moonbaseAlpha.rpcUrls.default.http[0];
const CORS_RISK_PATTERN = /dwellir\.com|\.onrender\.com|localhost:8545/i; // extend as needed

// If running in a browser and the custom RPC matches a risky pattern, ignore it.
let rpcUrl = PUBLIC_FALLBACK_RPC;
if (envRpc && envRpc.trim().length > 0) {
  if (typeof window === 'undefined') {
    // Node/server-side can use the private endpoint directly
    rpcUrl = envRpc;
  } else if (!CORS_RISK_PATTERN.test(envRpc)) {
    rpcUrl = envRpc;
  } else {
    console.warn('[wagmi] Detected RPC that is likely to fail CORS in browser; using public fallback:', envRpc);
  }
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [moonbaseAlpha],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: rpcUrl,
      }),
    }),
  ]
);

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    ...(projectId
      ? [
          new WalletConnectConnector({
            chains,
            options: {
              projectId,
            },
          }),
        ]
      : []),
  ],
  publicClient,
  webSocketPublicClient,
});

// Export chain for easy access
export { moonbaseAlpha, chains };
