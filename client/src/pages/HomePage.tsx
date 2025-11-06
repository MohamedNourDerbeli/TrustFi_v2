import React, { useState } from 'react';
import WalletConnect from '../components/WalletConnect';
import MetaMaskConnect from '../components/MetaMaskConnect';
import type { Wallet } from '@talismn/connect-wallets';
import type { ProfileWithId } from '../services/contractService';

interface HomePageProps {
  connectedAddress: string;
  userProfile: ProfileWithId | null;
  loading: boolean;
  onWalletConnected: (address: string, wallet?: Wallet) => void;
  onContractServiceReady: () => void;
  onShowProfileCreation: () => void;
  onNavigateToProfile: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  connectedAddress,
  userProfile,
  loading,
  onWalletConnected,
  onContractServiceReady,
  onShowProfileCreation,
  onNavigateToProfile
}) => {
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Verifiable Credentials",
      description: "Earn blockchain-based reputation cards that prove your achievements and skills."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Build Trust Network",
      description: "Connect with others and build a network of verified professional relationships."
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Verification",
      description: "Instantly verify credentials and reputation scores through blockchain technology."
    }
  ];

  const stats = [
    { label: "Verified Profiles", value: "10K+" },
    { label: "Reputation Cards", value: "50K+" },
    { label: "Trust Score", value: "99.9%" }
  ];

  // If wallet is connected, show the connected state
  if (connectedAddress) {
    return (
      <div className="text-center max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connected</h3>
            <p className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-1 rounded-lg">
              {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600 font-medium">Checking for existing profile...</span>
            </div>
          ) : userProfile ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-700 font-semibold mb-2">✓ Profile Found!</p>
                <p className="text-gray-700">
                  Welcome back, <span className="font-bold text-green-700">{userProfile.name}</span>
                </p>
              </div>
              <button
                onClick={onNavigateToProfile}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                View My Profile →
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-700 font-medium">
                  No profile found for this wallet
                </p>
              </div>
              <button
                onClick={onShowProfileCreation}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Create Your Profile →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Landing page for non-connected users
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <div className="text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Build Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Digital Trust</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            TrustFi revolutionizes reputation management through blockchain technology. 
            Create verifiable credentials, build trust networks, and showcase your achievements 
            in a decentralized, tamper-proof ecosystem.
          </p>
          
          {/* Simple Get Started Button */}
          {!showWalletOptions ? (
            <button
              onClick={() => setShowWalletOptions(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-12 rounded-2xl text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-xl"
            >
              Get Started →
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg mx-auto border border-gray-100">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600">
                  Choose your preferred wallet to get started
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Local Development
                  </h4>
                  <MetaMaskConnect 
                    onWalletConnected={onWalletConnected}
                    onContractServiceReady={onContractServiceReady}
                  />
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V8z" clipRule="evenodd" />
                    </svg>
                    Moonbeam Network
                  </h4>
                  <WalletConnect 
                    onWalletConnected={onWalletConnected}
                    onContractServiceReady={onContractServiceReady}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 rounded-3xl p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TrustFi?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of digital reputation with our cutting-edge blockchain platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Trusted by Thousands</h2>
          <p className="text-blue-100 text-lg">
            Join our growing community of verified professionals
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Connect Wallet</h3>
            <p className="text-gray-600">
              Connect your Web3 wallet to get started with TrustFi
            </p>
            {/* Connection line */}
            <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2"></div>
          </div>
          
          <div className="relative">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Profile</h3>
            <p className="text-gray-600">
              Set up your reputation profile and start building your digital identity
            </p>
            {/* Connection line */}
            <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2"></div>
          </div>
          
          <div>
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Earn Credentials</h3>
            <p className="text-gray-600">
              Receive verifiable reputation cards for your achievements and contributions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;