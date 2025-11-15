import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractWrite, useWaitForTransaction, useContractRead, useContractEvent } from 'wagmi';
import { type Address, isAddress, keccak256, toHex } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardAbi from '../../lib/ReputationCard.abi.json';

// TEMPLATE_MANAGER_ROLE = keccak256("TEMPLATE_MANAGER_ROLE")
const TEMPLATE_MANAGER_ROLE = keccak256(toHex('TEMPLATE_MANAGER_ROLE'));

export const IssuerManagement: React.FC = () => {
  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [issuers, setIssuers] = useState<Address[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Grant role hook
  const {
    data: grantData,
    write: grantRole,
    isLoading: isGranting,
    error: grantError,
  } = useContractWrite({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    functionName: 'grantRole',
  });

  // Revoke role hook
  const {
    data: revokeData,
    write: revokeRole,
    isLoading: isRevoking,
    error: revokeError,
  } = useContractWrite({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    functionName: 'revokeRole',
  });

  // Wait for grant transaction
  const { isLoading: isGrantConfirming, isSuccess: isGrantSuccess } = useWaitForTransaction({
    hash: grantData?.hash,
  });

  // Wait for revoke transaction
  const { isLoading: isRevokeConfirming, isSuccess: isRevokeSuccess } = useWaitForTransaction({
    hash: revokeData?.hash,
  });

  // Listen for RoleGranted events
  useContractEvent({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    eventName: 'RoleGranted',
    listener(logs) {
      const log = logs[0];
      if (log && log.args && log.args.role === TEMPLATE_MANAGER_ROLE) {
        const grantedAddress = log.args.account as Address;
        setSuccessMessage(`Issuer role granted successfully to ${grantedAddress}`);
        setRefreshTrigger((prev) => prev + 1);
        
        // Add to issuers list if not already present
        setIssuers((prev) => {
          if (!prev.includes(grantedAddress)) {
            return [...prev, grantedAddress];
          }
          return prev;
        });
      }
    },
  });

  // Listen for RoleRevoked events
  useContractEvent({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    eventName: 'RoleRevoked',
    listener(logs) {
      const log = logs[0];
      if (log && log.args && log.args.role === TEMPLATE_MANAGER_ROLE) {
        const revokedAddress = log.args.account as Address;
        setSuccessMessage(`Issuer role revoked successfully from ${revokedAddress}`);
        setRefreshTrigger((prev) => prev + 1);
        
        // Remove from issuers list
        setIssuers((prev) => prev.filter((addr) => addr !== revokedAddress));
      }
    },
  });

  // Note: There's no direct way to get all addresses with a role from the contract
  // In a production app, you'd want to:
  // 1. Index RoleGranted/RoleRevoked events using a subgraph or backend service
  // 2. Store issuer addresses in Supabase
  // 3. Query them from there
  // For now, we'll maintain a local state that updates on role changes

  // Handle successful grant transaction
  useEffect(() => {
    if (isGrantSuccess && newIssuerAddress) {
      const addr = newIssuerAddress as Address;
      setSuccessMessage(`Issuer role granted successfully to ${addr}`);
      
      // Add to issuers list if not already present
      setIssuers((prev) => {
        if (!prev.includes(addr)) {
          return [...prev, addr];
        }
        return prev;
      });
      
      setNewIssuerAddress('');
      setAddressError('');
    }
  }, [isGrantSuccess, newIssuerAddress]);

  // Handle successful revoke transaction
  useEffect(() => {
    if (isRevokeSuccess) {
      setNewIssuerAddress('');
      setAddressError('');
    }
  }, [isRevokeSuccess]);

  const validateAddress = (address: string): boolean => {
    if (!address || address.trim() === '') {
      setAddressError('Address is required');
      return false;
    }
    if (!isAddress(address)) {
      setAddressError('Invalid Ethereum address');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validateAddress(newIssuerAddress)) {
      return;
    }

    const addr = newIssuerAddress as Address;
    
    // Check if address already in the list
    if (issuers.includes(addr)) {
      setAddressError('This address already has the issuer role');
      return;
    }

    try {
      grantRole({
        args: [TEMPLATE_MANAGER_ROLE, addr],
      });
    } catch (err) {
      console.error('Error granting role:', err);
    }
  };

  const handleRevokeRole = async (address: Address) => {
    setSuccessMessage(null);

    if (window.confirm(`Are you sure you want to revoke issuer role from ${address}?`)) {
      try {
        revokeRole({
          args: [TEMPLATE_MANAGER_ROLE, address],
        });
      } catch (err) {
        console.error('Error revoking role:', err);
      }
    }
  };

  const isLoading = isGranting || isGrantConfirming || isRevoking || isRevokeConfirming;
  const error = grantError || revokeError;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Admin Dashboard
      </Link>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Issuer Management</h2>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800">
                {error.message.includes('AccessControl') || error.message.includes('Unauthorized')
                  ? 'You do not have permission to manage issuer roles'
                  : 'Failed to update issuer role. Please try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Grant Role Form */}
        <form onSubmit={handleGrantRole} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Issuer Role</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newIssuerAddress}
                onChange={(e) => {
                  setNewIssuerAddress(e.target.value);
                  setAddressError('');
                  setSuccessMessage(null);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  addressError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x... Ethereum address"
              />
              {addressError && <p className="mt-1 text-sm text-red-600">{addressError}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isGranting || isGrantConfirming ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isGranting ? 'Granting...' : 'Confirming...'}
                </span>
              ) : (
                'Grant Role'
              )}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Grant TEMPLATE_MANAGER_ROLE to allow an address to create templates and issue cards
          </p>
        </form>
      </div>

      {/* Issuers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Issuers</h3>

        {issuers.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-gray-600">No issuers found</p>
            <p className="text-sm text-gray-500 mt-2">
              Note: This list is maintained locally. In production, issuer addresses would be indexed from blockchain
              events.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issuers.map((issuer) => (
              <div
                key={issuer}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-mono text-sm text-gray-900">{issuer}</p>
                    <p className="text-xs text-gray-500">TEMPLATE_MANAGER_ROLE</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeRole(issuer)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {isRevoking || isRevokeConfirming ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
