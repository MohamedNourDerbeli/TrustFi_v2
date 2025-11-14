// components/auth/WalletConnect.tsx
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { parseContractError } from '../../lib/errors';

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

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-gray-100 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
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
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Select Wallet
            </h3>
            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector.id)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {connector.name}
                </button>
              ))}
            </div>
            {connectError && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-600">
                  {parseContractError(connectError).message}
                </p>
                {parseContractError(connectError).action && (
                  <p className="text-xs text-red-500 mt-1">
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
