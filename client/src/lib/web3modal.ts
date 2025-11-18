// lib/web3modal.ts
// Centralized Web3Modal initialization using existing wagmi config.
// This file is imported once (in main.tsx) to register the modal.

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, chains } from './wagmi';

// WalletConnect Cloud Project ID (required for WalletConnect & Web3Modal)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  // Non-fatal warning so the dapp still works with injected wallets.
  console.warn('[Web3Modal] Missing VITE_WALLETCONNECT_PROJECT_ID. WalletConnect will be disabled.');
}

createWeb3Modal({
  wagmiConfig: config,
  projectId: projectId || 'missing_project_id',
  chains,
  themeMode: 'dark',
  // Optional: refine styling to approximate OpenSea's dark modal look.
  themeVariables: {
    '--w3m-accent-color': '#2563eb', // blue-600
    '--w3m-background-color': '#111111',
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-border-radius': '16px'
  },
  enableAnalytics: false,
  featuredWalletIds: [
    'talisman',
    // Prioritize common wallets seen in the provided screenshot
    'metaMask',
    'coinbaseWallet',
    'walletConnect',
    // Talisman & Abstract will appear automatically if injected / supported
  ],
  walletImages: {
    talisman: 'https://raw.githubusercontent.com/TalismanSociety/brand-kit/main/assets/icon/mark-gradient.svg'
  }
});

// No exports needed; the createWeb3Modal side-effect is sufficient.