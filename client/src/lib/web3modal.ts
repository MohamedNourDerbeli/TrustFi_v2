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

    // Helpful runtime diagnostics in production to verify origin and project linkage
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'ssr';
      // Do not print full IDs in logs in case of shared consoles; last 6 chars is enough
      const pidSuffix = projectId ? String(projectId).slice(-6) : 'none';
      console.info(`[Web3Modal] init on origin=${origin} projectId=*${pidSuffix}`);
    } catch {}

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
      // v5 supports both legacy flag and new object; we set both defensively
      enableAnalytics: false,
      analytics: { enabled: false },
      metadata: {
        name: 'TrustFi',
        description: 'TrustFi web app',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://trustfi.vercel.app',
        icons: ['https://trustfi.vercel.app/favicon.ico']
      },
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