// lib/wagmi.ts
import { configureChains, createConfig } from 'wagmi';
import { moonbaseAlpha } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// WalletConnect project ID - should be set in .env
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [moonbaseAlpha],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: chain.rpcUrls.default.http[0],
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
