import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractService } from '../services/contractService';
import { logError, getUserFriendlyMessage } from '../utils/errorHandler';

interface MetaMaskConnectProps {
  onWalletConnected?: (address: string) => void;
  onContractServiceReady?: () => void;
}

const MetaMaskConnect: React.FC<MetaMaskConnectProps> = ({ 
  onWalletConnected, 
  onContractServiceReady 
}) => {
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [contractServiceReady, setContractServiceReady] = useState(false);

  const connectMetaMask = async () => {
    setIsConnecting(true);
    setError('');
    setContractServiceReady(false);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get the signer and address
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Initialize contract service
      await contractService.initialize(provider);
      setContractServiceReady(true);

      setConnectedAddress(address);

      // Call callbacks
      if (onWalletConnected) {
        onWalletConnected(address);
      }
      if (onContractServiceReady) {
        onContractServiceReady();
      }

    } catch (err) {
      logError(err, 'MetaMask connection');
      setError(getUserFriendlyMessage(err));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedAddress('');
    setError('');
    setContractServiceReady(false);
    contractService.reset();
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connectedAddress) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Connected to MetaMask
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
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
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

      <button
        onClick={connectMetaMask}
        disabled={isConnecting}
        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">MetaMask</p>
            <p className="text-xs text-gray-500">For Hardhat Local Testing</p>
          </div>
        </div>
        
        {isConnecting ? (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <div className="text-sm text-blue-600">Connect</div>
        )}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Make sure you're connected to Hardhat Local Network (Chain ID: 31337)
        </p>
      </div>
    </div>
  );
};

export default MetaMaskConnect;