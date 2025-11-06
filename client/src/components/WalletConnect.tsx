import React, { useState, useEffect } from 'react';
import { getWallets, type Wallet } from '@talismn/connect-wallets';
import { ethers } from 'ethers';
import { contractService } from '../services/contractService';
import { logError, getUserFriendlyMessage } from '../utils/errorHandler';
import { getUniqueWallets, getWalletKey } from '../utils/walletUtils';

interface WalletConnectProps {
  onWalletConnected?: (address: string, wallet: Wallet) => void;
  onContractServiceReady?: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletConnected, onContractServiceReady }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [contractServiceReady, setContractServiceReady] = useState(false);

  useEffect(() => {
    // Get available wallets and filter out duplicates
    const availableWallets = getWallets();
    const uniqueWallets = getUniqueWallets(availableWallets);
    
    setWallets(uniqueWallets);
  }, []);

  const connectWallet = async (wallet: Wallet) => {
    setIsConnecting(true);
    setError('');
    setContractServiceReady(false);

    try {
      // Enable the wallet
      await wallet.enable('TrustFi');

      // Get accounts
      const accounts = await wallet.getAccounts();
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0].address;
        
        // Initialize contract service with Ethereum provider
        // For Moonbeam/Moonbase, we need to use the EVM-compatible provider
        if (wallet.signer?.provider) {
          try {
            // Create ethers provider from the wallet's provider
            const provider = new ethers.BrowserProvider(wallet.signer.provider);
            
            // Initialize contract service
            await contractService.initialize(provider);
            setContractServiceReady(true);
            
            if (onContractServiceReady) {
              onContractServiceReady();
            }
          } catch (contractError) {
            logError(contractError, 'Contract service initialization');
            setError(getUserFriendlyMessage(contractError));
            return;
          }
        }
        
        setConnectedWallet(wallet);
        setConnectedAddress(address);
        
        // Call the callback if provided
        if (onWalletConnected) {
          onWalletConnected(address, wallet);
        }
      } else {
        setError('No accounts found in wallet');
      }
    } catch (err) {
      logError(err, 'Wallet connection');
      setError(getUserFriendlyMessage(err));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setConnectedAddress('');
    setError('');
    setContractServiceReady(false);
    
    // Reset contract service
    contractService.reset();
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connectedWallet && connectedAddress) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Connected to {connectedWallet.title}
              </h3>
              <p className="text-sm text-green-600 font-mono">
                {formatAddress(connectedAddress)}
              </p>
              {contractServiceReady && (
                <p className="text-xs text-green-500 mt-1">
                  ✓ Contract service ready
                </p>
              )}
            </div>
            <img 
              src={connectedWallet.logo.src} 
              alt={connectedWallet.logo.alt}
              className="w-8 h-8"
            />
          </div>
        </div>
        
        {!contractServiceReady && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              Setting up contract connection...
            </p>
          </div>
        )}
        
        <button
          onClick={disconnectWallet}
          className="btn-secondary w-full"
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 text-center">
        Connect Your Wallet
      </h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {wallets.map((wallet, index) => (
          <button
            key={getWalletKey(wallet, index)}
            onClick={() => connectWallet(wallet)}
            disabled={isConnecting || !wallet.installed}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
              wallet.installed
                ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <img 
                src={wallet.logo.src} 
                alt={wallet.logo.alt}
                className="w-8 h-8"
              />
              <div className="text-left">
                <p className={`font-medium ${
                  wallet.installed ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {wallet.title}
                </p>
                {!wallet.installed && (
                  <p className="text-xs text-gray-400">Not installed</p>
                )}
              </div>
            </div>
            
            {isConnecting ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className={`text-sm ${
                wallet.installed ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {wallet.installed ? 'Connect' : 'Install'}
              </div>
            )}
          </button>
        ))}
      </div>

      {wallets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No Polkadot wallets detected</p>
          <p className="text-sm text-gray-400 mt-2">
            Please install a Polkadot wallet extension to continue
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;