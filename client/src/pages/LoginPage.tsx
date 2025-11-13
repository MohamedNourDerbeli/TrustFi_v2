import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useConnect, useAccount } from 'wagmi';
import type { Connector } from 'wagmi';

// WalletOption component remains the same
function WalletOption({ connector, onClick, isLoading }: { connector: Connector; onClick: () => void; isLoading: boolean; }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    connector.getProvider().then(provider => {
      if (provider) setReady(true);
    });
  }, [connector]);
  if (!ready) return null;
  return (
    <button onClick={onClick} disabled={isLoading} className="w-full flex items-center justify-center p-4 rounded-lg bg-[#2D3748] border border-[#374151] hover:border-indigo-500 hover:bg-[#374151] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
      {connector.icon && <img src={connector.icon} alt={connector.name} className="w-8 h-8 mr-4" />}
      <span className="text-white font-semibold text-lg">{connector.name}</span>
    </button>
  );
}

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  // Handle signing when wallet is connected
  useEffect(() => {
    if (status === 'signing' && isConnected) {
      signIn().catch((e: any) => {
        console.error("Sign-in failed:", e);
        setError(e.message || "Failed to sign the message. Please try again.");
        setStatus('error');
      });
    }
  }, [status, isConnected, signIn]);

  const handleLogin = (connector: Connector) => {
    setStatus('connecting');
    setError(null);
    
    connect({ connector }, {
      onSuccess: () => {
        setStatus('signing');
      },
      onError: (e) => {
        console.error("Connection failed:", e);
        setError("Connection was rejected. Please try again.");
        setStatus('error');
      }
    });
  };

  const isLoading = status === 'connecting' || status === 'signing';
  let statusMessage = "";
  if (status === 'connecting') statusMessage = "Connecting Wallet...";
  if (status === 'signing') statusMessage = "Please Sign Message...";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Login to TrustFi</h1>
          <p className="text-lg text-gray-400">Choose your wallet to continue</p>
        </div>
        
        {isLoading ? (
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl">{statusMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {connectors.map((connector) => (
              <WalletOption key={connector.uid} connector={connector} onClick={() => handleLogin(connector)} isLoading={isLoading} />
            ))}
            {connectors.length === 0 && <p className="text-center text-gray-400">No wallet extensions found.</p>}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 text-center">
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="font-semibold">Login Error</p>
              <p className="text-red-300 mb-4">{error}</p>
              <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
