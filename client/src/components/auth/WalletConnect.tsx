// components/auth/WalletConnect.tsx
import React, { useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { parseContractError } from '../../lib/errors';

type WalletOption = {
  key: string;
  label: string;
  connectorId?: string; // id from wagmi connectors
  installed?: boolean;
  onClick?: () => void;
};

export const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const [showConnectors, setShowConnectors] = useState(false);

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
      setShowConnectors(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Revoke permissions in MetaMask before disconnecting
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [
              {
                eth_accounts: {},
              },
            ],
          });
        } catch (revokeError) {
          // If revoke fails (older MetaMask versions), just continue with disconnect
          console.warn('Failed to revoke permissions:', revokeError);
        }
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      // Always disconnect from wagmi
      disconnect();
    }
  };

  const detected = useMemo(() => {
    const eth: any = (typeof window !== 'undefined' && (window as any).ethereum) || undefined;
    const providers: any[] = eth?.providers || (eth ? [eth] : []);
    const has = (pred: (p: any) => boolean) => providers.some(pred) || (eth ? pred(eth) : false);
    return {
      metaMask: !!has((p) => p?.isMetaMask),
      talisman: !!has((p) => p?.isTalisman || p?.name === 'Talisman'),
      coinbase: !!has((p) => p?.isCoinbaseWallet),
    };
  }, []);

  const walletOptions: WalletOption[] = useMemo(() => {
    // Map wagmi connector ids for common wallets
    const injectedId = connectors.find((c) => c.id === 'injected')?.id;
    const coinbaseId = connectors.find((c) => c.id === 'coinbaseWallet')?.id;
    const wcId = connectors.find((c) => c.id === 'walletConnect')?.id;

    return [
      { key: 'metamask', label: 'MetaMask', connectorId: injectedId, installed: detected.metaMask },
      { key: 'talisman', label: 'Talisman', connectorId: injectedId, installed: detected.talisman },
      { key: 'coinbase', label: 'Coinbase Wallet', connectorId: coinbaseId, installed: detected.coinbase },
      { key: 'walletconnect', label: 'WalletConnect', connectorId: wcId },
    ].filter(Boolean) as WalletOption[];
  }, [connectors, detected]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
            {truncateAddress(address)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Connect Wallet
      </button>

      {showConnectors && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-30 overflow-hidden">
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Select Wallet
            </h3>
            <div className="flex flex-col gap-1">
              {walletOptions.map((w) => (
                <button
                  key={w.key}
                  disabled={!w.connectorId}
                  onClick={() => w.connectorId && handleConnect(w.connectorId)}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <span className="text-gray-800 dark:text-slate-200">{w.label}</span>
                  {w.installed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Installed</span>
                  )}
                </button>
              ))}
              {!walletOptions.some(w => w.key === 'walletconnect' && w.connectorId) && (
                <p className="px-3 py-2 text-xs text-amber-600 dark:text-amber-300">WalletConnect unavailable. Set VITE_WALLETCONNECT_PROJECT_ID.</p>
              )}
            </div>
            {connectError && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-xs text-red-700 dark:text-red-300">
                  {parseContractError(connectError).message}
                </p>
                {parseContractError(connectError).action && (
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {parseContractError(connectError).action}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
