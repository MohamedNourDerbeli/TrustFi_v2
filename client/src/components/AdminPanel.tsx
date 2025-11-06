import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractService } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';

interface AdminPanelProps {
  connectedAddress: string;
  contractServiceReady: boolean;
}

interface SystemStats {
  totalProfiles: number;
  totalCards: number;
  authorizedIssuersCount: number;
}

interface CardIssuanceFormProps {
  contractServiceReady: boolean;
  onCardIssued: () => void;
}

interface CardFormData {
  profileId: string;
  category: string;
  description: string;
  value: string;
}

const CardIssuanceForm: React.FC<CardIssuanceFormProps> = ({ 
  contractServiceReady, 
  onCardIssued 
}) => {
  const [formData, setFormData] = useState<CardFormData>({
    profileId: '',
    category: '',
    description: '',
    value: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

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
      if (!chainId || !CONTRACT_ADDRESSES[chainId]?.ReputationCard) {
        throw new Error('ReputationCard contract not available');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const reputationCardAddress = CONTRACT_ADDRESSES[chainId].ReputationCard;
      
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

      // Notify parent component
      onCardIssued();

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
    <div>
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-700 text-sm">{successMessage}</span>
            <button onClick={clearMessages} className="ml-auto text-green-400 hover:text-green-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile ID */}
          <div>
            <label htmlFor="profileId" className="block text-sm font-medium text-gray-700 mb-1">
              Profile ID *
            </label>
            <input
              type="number"
              id="profileId"
              name="profileId"
              value={formData.profileId}
              onChange={handleInputChange}
              placeholder="Enter profile ID (e.g., 1)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              min="1"
              required
            />
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
              Reputation Value * (1-1000)
            </label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              placeholder="Enter reputation points"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              min="1"
              max="1000"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category * (max 50 characters)
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description * (max 200 characters)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the achievement or contribution..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Issuing Card...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Issue Reputation Card
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
};

// Issuer Panel Component - Limited functionality for authorized issuers
const IssuerPanel: React.FC<{ 
  connectedAddress: string; 
  contractServiceReady: boolean; 
  systemStats: SystemStats;
  onCardIssued: () => void;
}> = ({ connectedAddress, contractServiceReady, systemStats, onCardIssued }) => {
  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Issuer Panel</h1>
            <p className="text-gray-600">Issue reputation cards to user profiles</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Issuer Address</div>
            <div className="font-mono text-sm text-gray-700">{formatAddress(connectedAddress)}</div>
          </div>
        </div>
      </div>

      {/* Basic Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{systemStats.totalProfiles}</div>
          <div className="text-sm text-gray-600">Total Profiles</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{systemStats.totalCards}</div>
          <div className="text-sm text-gray-600">Total Cards Issued</div>
        </div>
      </div>

      {/* Card Issuance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Issue Reputation Card</h2>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Create New Reputation Card</h3>
          <CardIssuanceForm 
            contractServiceReady={contractServiceReady}
            onCardIssued={onCardIssued}
          />
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ connectedAddress, contractServiceReady }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorizedIssuers, setAuthorizedIssuers] = useState<string[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalProfiles: 0,
    totalCards: 0,
    authorizedIssuersCount: 0
  });
  const [newIssuerAddress, setNewIssuerAddress] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [loadingIssuers, setLoadingIssuers] = useState<boolean>(false);

  // Check if current user is admin or issuer and load data
  useEffect(() => {
    const checkUserRole = async () => {
      if (!connectedAddress || !contractServiceReady) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Get the current chain ID and contract addresses
        const chainId = contractService.getCurrentChainId();
        
        if (!chainId || !CONTRACT_ADDRESSES[chainId]?.ReputationCard) {
          setError(`ReputationCard contract not available on this network. Chain ID: ${chainId}`);
          setLoading(false);
          return;
        }

        // Use the contract service's provider and signer to ensure network consistency
        const reputationCardAddress = CONTRACT_ADDRESSES[chainId].ReputationCard;
        
        // Basic ReputationCard ABI for admin functions
        const reputationCardABI = [
          "function owner() view returns (address)",
          "function isAuthorizedIssuer(address issuer) view returns (bool)",
          "function authorizeIssuer(address issuer)",
          "function revokeIssuer(address issuer)",
          "function totalCards() view returns (uint256)",
          "event IssuerAuthorized(address indexed issuer)",
          "event IssuerRevoked(address indexed issuer)"
        ];

        // Create provider and signer (we need to do this because contractService doesn't expose them)
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();

        const reputationCardContract = new ethers.Contract(
          reputationCardAddress,
          reputationCardABI,
          signer
        );

        // Check if current user is the contract owner or authorized issuer
        let userIsAdmin = false;
        let userIsIssuer = false;
        
        try {
          // Test if contract exists first
          const code = await provider.getCode(reputationCardAddress);
          if (code === '0x') {
            throw new Error(`No contract deployed at address ${reputationCardAddress}`);
          }
          
          const contractOwner = await reputationCardContract.owner();
          userIsAdmin = contractOwner.toLowerCase() === connectedAddress.toLowerCase();
          
          // Check if user is an authorized issuer (this includes the owner)
          userIsIssuer = await reputationCardContract.isAuthorizedIssuer(connectedAddress);
          
          setIsAdmin(userIsAdmin);
          setIsIssuer(userIsIssuer);
        } catch (contractError: any) {
          console.error('Admin panel contract error:', contractError);
          if (contractError.code === 'BAD_DATA' || contractError.reason === 'call revert exception') {
            setError(`ReputationCard contract not properly deployed at ${reputationCardAddress}. Please deploy the contracts first.`);
            setLoading(false);
            return;
          }
          if (contractError.message?.includes('No contract deployed')) {
            setError(`No contract found at ${reputationCardAddress}. Please ensure Hardhat node is running and contracts are deployed.`);
            setLoading(false);
            return;
          }
          throw contractError;
        }

        // Load data if user has admin privileges
        if (userIsAdmin) {
          setLoadingIssuers(true);
          await loadAdminData(reputationCardContract);
          setLoadingIssuers(false);
        } else if (userIsIssuer) {
          // For issuers, we only need basic stats
          try {
            const totalProfiles = await contractService.getTotalProfiles();
            const totalCards = await reputationCardContract.totalCards();
            setSystemStats({
              totalProfiles: Number(totalProfiles),
              totalCards: Number(totalCards),
              authorizedIssuersCount: 0 // Not needed for issuers
            });
          } catch (error) {
            console.error('Error loading issuer data:', error);
          }
        }

      } catch (error) {
        console.error('Error checking user role:', error);
        setError('Failed to check user privileges. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [connectedAddress, contractServiceReady]);

  const loadAdminData = async (reputationCardContract: ethers.Contract) => {
    try {
      // Get system statistics
      const totalProfiles = await contractService.getTotalProfiles();
      const totalCards = await reputationCardContract.totalCards();

      // Load authorized issuers from blockchain events
      const authorizedIssuers = await loadAuthorizedIssuers(reputationCardContract);

      setAuthorizedIssuers(authorizedIssuers);
      setSystemStats({
        totalProfiles: Number(totalProfiles),
        totalCards: Number(totalCards),
        authorizedIssuersCount: authorizedIssuers.length
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoadingIssuers(false);
    }
  };

  const loadAuthorizedIssuers = async (reputationCardContract: ethers.Contract): Promise<string[]> => {
    try {
      
      // Get all IssuerAuthorized events
      const authorizedFilter = reputationCardContract.filters.IssuerAuthorized();
      let authorizedEvents: any[] = [];
      let revokedEvents: any[] = [];
      
      try {
        authorizedEvents = await reputationCardContract.queryFilter(authorizedFilter);
        
        // Get all IssuerRevoked events
        const revokedFilter = reputationCardContract.filters.IssuerRevoked();
        revokedEvents = await reputationCardContract.queryFilter(revokedFilter);
      } catch (eventError) {
        console.warn('Could not load issuer events, falling back to contract owner only:', eventError);
        // If we can't load events, just return the contract owner
        const contractOwner = await reputationCardContract.owner();
        return [contractOwner];
      }
      
      // Build set of authorized issuers
      const authorizedSet = new Set<string>();
      const revokedSet = new Set<string>();
      
      // Add all authorized issuers
      for (const event of authorizedEvents) {
        if (event.args && event.args.issuer) {
          authorizedSet.add(event.args.issuer.toLowerCase());
        }
      }
      
      // Remove revoked issuers
      for (const event of revokedEvents) {
        if (event.args && event.args.issuer) {
          revokedSet.add(event.args.issuer.toLowerCase());
        }
      }
      
      // Contract owner is always authorized (even if not explicitly added via event)
      const contractOwner = await reputationCardContract.owner();
      authorizedSet.add(contractOwner.toLowerCase());
      
      // Filter out revoked issuers and convert back to original case
      const finalAuthorizedIssuers: string[] = [];
      
      for (const issuer of authorizedSet) {
        if (!revokedSet.has(issuer)) {
          // Verify the issuer is still authorized by calling the contract
          try {
            const isAuthorized = await reputationCardContract.isAuthorizedIssuer(issuer);
            if (isAuthorized) {
              // Find the original case from events or use the owner address
              if (issuer === contractOwner.toLowerCase()) {
                finalAuthorizedIssuers.push(contractOwner);
              } else {
                // Find original case from authorized events
                const originalEvent = authorizedEvents.find(e => 
                  e.args && e.args.issuer && e.args.issuer.toLowerCase() === issuer
                );
                if (originalEvent && originalEvent.args) {
                  finalAuthorizedIssuers.push(originalEvent.args.issuer);
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to verify issuer ${issuer}:`, error);
          }
        }
      }
      
      return finalAuthorizedIssuers;
      
    } catch (error) {
      console.error('Error loading authorized issuers:', error);
      // Fallback to just the contract owner
      try {
        const contractOwner = await reputationCardContract.owner();
        return [contractOwner];
      } catch (ownerError) {
        console.error('Error getting contract owner:', ownerError);
        return [];
      }
    }
  };


  const handleAuthorizeIssuer = async () => {
    if (!newIssuerAddress.trim()) {
      setError('Please enter a valid address');
      return;
    }

    if (!ethers.isAddress(newIssuerAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    if (authorizedIssuers.some(addr => addr.toLowerCase() === newIssuerAddress.toLowerCase())) {
      setError('This address is already an authorized issuer');
      return;
    }

    // Check if the address is the same as the connected address
    if (newIssuerAddress.toLowerCase() === connectedAddress.toLowerCase()) {
      setError('You are already an authorized issuer as the contract owner');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      const chainId = contractService.getCurrentChainId();
      if (!chainId || !CONTRACT_ADDRESSES[chainId]?.ReputationCard) {
        throw new Error('ReputationCard contract not available');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const reputationCardAddress = CONTRACT_ADDRESSES[chainId].ReputationCard;
      
      const reputationCardABI = [
        "function authorizeIssuer(address issuer)",
        "event IssuerAuthorized(address indexed issuer)"
      ];

      const reputationCardContract = new ethers.Contract(
        reputationCardAddress,
        reputationCardABI,
        signer
      );

      const tx = await reputationCardContract.authorizeIssuer(newIssuerAddress);
      await tx.wait();

      // Reload the authorized issuers list from blockchain
      const updatedIssuers = await loadAuthorizedIssuers(reputationCardContract);
      setAuthorizedIssuers(updatedIssuers);
      setSystemStats(prev => ({
        ...prev,
        authorizedIssuersCount: updatedIssuers.length
      }));

      setNewIssuerAddress('');
      setSuccessMessage(`Successfully authorized ${newIssuerAddress} as an issuer`);

    } catch (error: any) {
      console.error('Error authorizing issuer:', error);
      if (error.code === 'USER_REJECTED') {
        setError('Transaction was rejected by user');
      } else {
        setError('Failed to authorize issuer. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeIssuer = async (issuerAddress: string) => {
    if (issuerAddress.toLowerCase() === connectedAddress.toLowerCase()) {
      setError('Cannot revoke your own admin privileges');
      return;
    }

    // Show confirmation dialog
    setConfirmRevoke(issuerAddress);
  };

  const confirmRevokeIssuer = async (issuerAddress: string) => {
    setConfirmRevoke(null);

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      const chainId = contractService.getCurrentChainId();
      if (!chainId || !CONTRACT_ADDRESSES[chainId]?.ReputationCard) {
        throw new Error('ReputationCard contract not available');
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const reputationCardAddress = CONTRACT_ADDRESSES[chainId].ReputationCard;
      
      const reputationCardABI = [
        "function revokeIssuer(address issuer)",
        "event IssuerRevoked(address indexed issuer)"
      ];

      const reputationCardContract = new ethers.Contract(
        reputationCardAddress,
        reputationCardABI,
        signer
      );

      const tx = await reputationCardContract.revokeIssuer(issuerAddress);
      await tx.wait();

      // Reload the authorized issuers list from blockchain
      const updatedIssuers = await loadAuthorizedIssuers(reputationCardContract);
      setAuthorizedIssuers(updatedIssuers);
      setSystemStats(prev => ({
        ...prev,
        authorizedIssuersCount: updatedIssuers.length
      }));

      setSuccessMessage(`Successfully revoked authorization for ${issuerAddress}`);

    } catch (error: any) {
      console.error('Error revoking issuer:', error);
      if (error.code === 'USER_REJECTED') {
        setError('Transaction was rejected by user');
      } else {
        setError('Failed to revoke issuer authorization. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRevokeIssuer = () => {
    setConfirmRevoke(null);
  };

  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Checking user privileges...</span>
        </div>
      </div>
    );
  }

  if (!connectedAddress) {
    return null; // Hide panel completely when wallet not connected
  }

  // Hide panel completely for regular users (not admin or issuer)
  if (!isAdmin && !isIssuer) {
    return null;
  }

  // Show Issuer Panel for authorized issuers who are not admins
  if (isIssuer && !isAdmin) {
    return (
      <IssuerPanel 
        connectedAddress={connectedAddress}
        contractServiceReady={contractServiceReady}
        systemStats={systemStats}
        onCardIssued={async () => {
          // Reload basic stats when a card is issued
          if (contractServiceReady) {
            try {
              const chainId = contractService.getCurrentChainId();
              if (!chainId || !CONTRACT_ADDRESSES[chainId]?.ReputationCard) {
                throw new Error('ReputationCard contract not available');
              }
              const provider = new ethers.BrowserProvider(window.ethereum as any);
              const signer = await provider.getSigner();
              const reputationCardAddress = CONTRACT_ADDRESSES[chainId].ReputationCard;
              const reputationCardABI = ["function totalCards() view returns (uint256)"];
              const reputationCardContract = new ethers.Contract(
                reputationCardAddress,
                reputationCardABI,
                signer
              );
              
              const totalProfiles = await contractService.getTotalProfiles();
              const totalCards = await reputationCardContract.totalCards();
              setSystemStats(prev => ({
                ...prev,
                totalProfiles: Number(totalProfiles),
                totalCards: Number(totalCards)
              }));
            } catch (error) {
              console.error('Error reloading issuer data:', error);
            }
          }
        }}
      />
    );
  }

  // Show full Admin Panel for contract owners
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage TrustFi system settings and authorized issuers</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Admin Address</div>
            <div className="font-mono text-sm text-gray-700">{formatAddress(connectedAddress)}</div>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{systemStats.totalProfiles}</div>
          <div className="text-sm text-gray-600">Total Profiles</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{systemStats.totalCards}</div>
          <div className="text-sm text-gray-600">Total Cards Issued</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{systemStats.authorizedIssuersCount}</div>
          <div className="text-sm text-gray-600">Authorized Issuers</div>
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

      {/* Card Issuance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Issue Reputation Card</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Create New Reputation Card</h3>
          <CardIssuanceForm 
            contractServiceReady={contractServiceReady}
            onCardIssued={async () => {
              // Reload system stats when a card is issued
              if (contractServiceReady) {
                try {
                  const provider = new ethers.BrowserProvider(window.ethereum as any);
                  const signer = await provider.getSigner();
                  const chainId = contractService.getCurrentChainId();
                  if (!chainId || !CONTRACT_ADDRESSES[chainId]?.ReputationCard) {
                    throw new Error('ReputationCard contract not available');
                  }
                  const reputationCardAddress = CONTRACT_ADDRESSES[chainId].ReputationCard;
                  const reputationCardABI = [
                    "function owner() view returns (address)",
                    "function isAuthorizedIssuer(address issuer) view returns (bool)",
                    "function authorizeIssuer(address issuer)",
                    "function revokeIssuer(address issuer)",
                    "function totalCards() view returns (uint256)",
                    "event IssuerAuthorized(address indexed issuer)",
                    "event IssuerRevoked(address indexed issuer)"
                  ];
                  const reputationCardContract = new ethers.Contract(
                    reputationCardAddress,
                    reputationCardABI,
                    signer
                  );
                  await loadAdminData(reputationCardContract);
                } catch (error) {
                  console.error('Error reloading admin data:', error);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Issuer Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Issuer Management</h2>
            <p className="text-gray-600 text-sm">Manage who can issue reputation cards on the platform</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{systemStats.authorizedIssuersCount}</div>
            <div className="text-xs text-gray-500">Active Issuers</div>
          </div>
        </div>
        
        {/* Add New Issuer - Enhanced */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Authorize New Issuer</h3>
              <p className="text-sm text-gray-600">Grant reputation card issuance permissions to a wallet address</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="issuerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                id="issuerAddress"
                type="text"
                value={newIssuerAddress}
                onChange={(e) => setNewIssuerAddress(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={actionLoading}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-blue-700">
                <p className="font-medium">What issuers can do:</p>
                <ul className="text-xs mt-1 space-y-1">
                  <li>• Issue reputation cards to verified profiles</li>
                  <li>• Access dedicated issuer panel</li>
                  <li>• View platform statistics</li>
                </ul>
              </div>
              
              <button
                onClick={handleAuthorizeIssuer}
                disabled={actionLoading || !newIssuerAddress.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Authorize Issuer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Authorized Issuers List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Authorized Issuers</h3>
            <span className="text-sm text-gray-500">
              {authorizedIssuers.length} issuer{authorizedIssuers.length !== 1 ? 's' : ''} authorized
            </span>
          </div>
          
          {loadingIssuers ? (
            <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600">Loading authorized issuers...</span>
            </div>
          ) : authorizedIssuers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Authorized Issuers</h4>
              <p className="text-gray-600">Add your first issuer using the form above to start delegating card issuance permissions.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="divide-y divide-gray-200">
                {authorizedIssuers.map((issuer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        issuer.toLowerCase() === connectedAddress.toLowerCase() 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'bg-green-100'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          issuer.toLowerCase() === connectedAddress.toLowerCase() 
                            ? 'text-white' 
                            : 'text-green-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {issuer.toLowerCase() === connectedAddress.toLowerCase() ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-gray-900 mb-1">{issuer}</div>
                        <div className="flex items-center space-x-2">
                          {issuer.toLowerCase() === connectedAddress.toLowerCase() ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Admin (You)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                              Authorized Issuer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {issuer.toLowerCase() === connectedAddress.toLowerCase() ? 'Owner' : 'Issuer'}
                      </span>
                      {issuer.toLowerCase() !== connectedAddress.toLowerCase() && (
                        <button
                          onClick={() => handleRevokeIssuer(issuer)}
                          disabled={actionLoading}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Revoke authorization"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Revoking Issuer */}
      {confirmRevoke && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Revoke Authorization</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to revoke authorization for this issuer? This action cannot be undone.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <div className="text-sm text-gray-500">Issuer Address</div>
              <div className="font-mono text-sm text-gray-900 break-all">{confirmRevoke}</div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRevokeIssuer}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmRevokeIssuer(confirmRevoke)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Revoking...
                  </>
                ) : (
                  'Revoke Authorization'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;