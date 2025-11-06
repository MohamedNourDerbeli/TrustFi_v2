import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractService } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';

interface IssuerPageProps {
  connectedAddress: string;
  contractServiceReady: boolean;
}

interface CardFormData {
  profileId: string;
  category: string;
  description: string;
  value: string;
}

interface SystemStats {
  totalProfiles: number;
  totalCards: number;
}

const IssuerPage: React.FC<IssuerPageProps> = ({ connectedAddress, contractServiceReady }) => {
  const [formData, setFormData] = useState<CardFormData>({
    profileId: '',
    category: '',
    description: '',
    value: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalProfiles: 0,
    totalCards: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load basic stats
  useEffect(() => {
    const loadStats = async () => {
      if (!contractServiceReady) return;

      try {
        setLoading(true);
        const chainId = contractService.getCurrentChainId();
        if (!chainId || !CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ReputationCard) {
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const reputationCardAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES].ReputationCard;
        
        const reputationCardABI = [
          "function totalCards() view returns (uint256)"
        ];

        const reputationCardContract = new ethers.Contract(
          reputationCardAddress,
          reputationCardABI,
          provider
        );

        const totalProfiles = await contractService.getTotalProfiles();
        const totalCards = await reputationCardContract.totalCards();

        setSystemStats({
          totalProfiles: Number(totalProfiles),
          totalCards: Number(totalCards)
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [contractServiceReady]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = (): string | null => {
    if (!formData.profileId.trim()) {
      return 'Profile ID is required';
    }
    
    const profileId = parseInt(formData.profileId);
    if (isNaN(profileId) || profileId <= 0) {
      return 'Profile ID must be a positive number';
    }

    if (!formData.category.trim()) {
      return 'Category is required';
    }
    if (formData.category.length > 50) {
      return 'Category must be 50 characters or less';
    }

    if (!formData.description.trim()) {
      return 'Description is required';
    }
    if (formData.description.length > 200) {
      return 'Description must be 200 characters or less';
    }

    if (!formData.value.trim()) {
      return 'Value is required';
    }
    
    const value = parseInt(formData.value);
    if (isNaN(value) || value <= 0 || value > 1000) {
      return 'Value must be a number between 1 and 1000';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!contractServiceReady) {
      setError('Contract service not ready. Please try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');

      const chainId = contractService.getCurrentChainId();
      if (!chainId || !CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ReputationCard) {
        throw new Error('ReputationCard contract not available');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const reputationCardAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES].ReputationCard;
      
      // ReputationCard ABI for issueCard function
      const reputationCardABI = [
        "function issueCard(uint256 profileId, string memory category, string memory description, uint256 value) external returns (uint256)",
        "event CardIssued(uint256 indexed cardId, uint256 indexed profileId, address indexed issuer, string category, uint256 value)"
      ];

      const reputationCardContract = new ethers.Contract(
        reputationCardAddress,
        reputationCardABI,
        signer
      );

      const profileId = parseInt(formData.profileId);
      const value = parseInt(formData.value);

      const tx = await reputationCardContract.issueCard(
        profileId,
        formData.category.trim(),
        formData.description.trim(),
        value
      );
      
      const receipt = await tx.wait();
      
      // Find the CardIssued event to get the card ID
      let cardId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = reputationCardContract.interface.parseLog(log);
          if (parsed?.name === 'CardIssued') {
            cardId = Number(parsed.args.cardId);
            break;
          }
        } catch {
          // Ignore parsing errors for other events
        }
      }

      // Reset form
      setFormData({
        profileId: '',
        category: '',
        description: '',
        value: ''
      });

      setSuccessMessage(
        cardId 
          ? `Successfully issued reputation card #${cardId} to profile #${profileId}`
          : `Successfully issued reputation card to profile #${profileId}`
      );

      // Reload stats
      const totalCards = await reputationCardContract.totalCards();
      setSystemStats(prev => ({
        ...prev,
        totalCards: Number(totalCards)
      }));

    } catch (error: any) {
      console.error('Error issuing card:', error);
      
      if (error.code === 'USER_REJECTED') {
        setError('Transaction was rejected by user');
      } else if (error.reason) {
        switch (error.reason) {
          case 'ProfileNotFound':
            setError('Profile not found. Please check the Profile ID.');
            break;
          case 'UnauthorizedIssuer':
            setError('You are not authorized to issue reputation cards.');
            break;
          case 'InvalidCardData':
            setError('Invalid card data. Please check your inputs.');
            break;
          default:
            setError(`Contract error: ${error.reason}`);
        }
      } else {
        setError('Failed to issue reputation card. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Predefined categories for easier selection
  const categories = [
    'Education',
    'Community',
    'Technical Skills',
    'Leadership',
    'Collaboration',
    'Innovation',
    'Mentorship',
    'Contribution',
    'Achievement',
    'Other'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Issuer Panel</h1>
            <p className="text-green-100">Issue reputation cards to verified profiles</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">Issuer Address</div>
            <div className="font-mono text-sm">{formatAddress(connectedAddress)}</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profiles</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : systemStats.totalProfiles}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cards Issued</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : systemStats.totalCards}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-700">{successMessage}</span>
            <button onClick={clearMessages} className="ml-auto text-green-400 hover:text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Card Issuance Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Issue Reputation Card</h2>
          <p className="text-gray-600 text-sm">Create a new reputation card for a verified profile</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile ID */}
              <div>
                <label htmlFor="profileId" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile ID *
                </label>
                <input
                  type="number"
                  id="profileId"
                  name="profileId"
                  value={formData.profileId}
                  onChange={handleInputChange}
                  placeholder="Enter profile ID (e.g., 1)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isSubmitting}
                  min="1"
                  required
                />
              </div>

              {/* Value */}
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                  Reputation Value * (1-1000)
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder="Enter reputation points"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isSubmitting}
                  min="1"
                  max="1000"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category * (max 50 characters)
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isSubmitting}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {formData.category.length}/50 characters
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description * (max 200 characters)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the achievement or contribution..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
                maxLength={200}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/200 characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !contractServiceReady}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Issuing Card...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Issue Reputation Card
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Card Issuance Guidelines:</p>
                <ul className="text-xs space-y-1">
                  <li>• Profile ID must exist and be valid</li>
                  <li>• Reputation value should reflect the significance of the achievement</li>
                  <li>• Categories help organize and filter reputation cards</li>
                  <li>• Descriptions should be clear and specific</li>
                  <li>• Issued cards are non-transferable and bound to the profile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuerPage;