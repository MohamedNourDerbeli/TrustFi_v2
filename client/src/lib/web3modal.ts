// lib/web3modal.ts
// Lazy initialization helper for Web3Modal to keep initial bundles smaller.

let initializing: Promise<void> | null = null;
let initialized = false;

export async function ensureWeb3Modal(): Promise<void> {
  if (initialized) return;
  if (initializing) return initializing;

  initializing = (async () => {
    const { createWeb3Modal } = await import('@web3modal/wagmi/react');
    const { config, chains } = await import('./wagmi');

    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      console.warn('[Web3Modal] Missing VITE_WALLETCONNECT_PROJECT_ID. WalletConnect will be disabled.');
    }

    createWeb3Modal({
      wagmiConfig: config,
      projectId: projectId || 'missing_project_id',
      chains,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent-color': '#2563eb',
        '--w3m-background-color': '#111111',
        '--w3m-font-family': 'Inter, system-ui, sans-serif',
        '--w3m-border-radius': '16px'
      },
      enableAnalytics: false,
      featuredWalletIds: ['talisman', 'metaMask', 'coinbaseWallet', 'walletConnect'],
      walletImages: {
        talisman: 'https://raw.githubusercontent.com/TalismanSociety/brand-kit/main/assets/icon/mark-gradient.svg'
      }
    });

    initialized = true;
  })().catch((e) => {
    initializing = null;
    throw e;
  });

  return initializing;
}