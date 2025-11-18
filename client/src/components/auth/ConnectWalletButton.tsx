// components/auth/ConnectWalletButton.tsx
import React from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ensureWeb3Modal } from '../../lib/web3modal';
import { useAccount, useDisconnect } from 'wagmi';

const truncate = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`;

export const ConnectWalletButton: React.FC = () => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 font-mono text-xs text-gray-700 dark:text-gray-200 select-none">
          {truncate(address)}
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        await ensureWeb3Modal();
        open();
      }}
      className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
    >
      Connect Wallet
    </button>
  );
};

export default ConnectWalletButton;