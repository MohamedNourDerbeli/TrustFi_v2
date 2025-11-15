import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWalletClient, useAccount, usePublicClient } from 'wagmi';
import { type Address, isAddress, keccak256, toHex } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardABI from '../../lib/ReputationCard.abi.json';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const TEMPLATE_MANAGER_ROLE = keccak256(toHex('TEMPLATE_MANAGER_ROLE'));

export const IssuerManagement: React.FC = () => {
  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [issuers, setIssuers] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingIssuers, setFetchingIssuers] = useState(true);
  
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Fetch issuers from Supabase
  useEffect(() => {
    fetchIssuers();
  }, []);

  const fetchIssuers = async () => {
    try {
      setFetchingIssuers(true);
      const { data, error } = await supabase
        .from('issuers')
        .select('address')
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      
      setIssuers((data || []).map(i => i.address as Address));
    } catch (error) {
      console.error('Error fetching issuers:', error);
      toast.error('Failed to fetch issuers');
    } finally {
      setFetchingIssuers(false);
    }
  };

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

    if (!validateAddress(newIssuerAddress)) {
      return;
    }

    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    const issuerAddr = newIssuerAddress.toLowerCase() as Address;
    
    // Check if address already has the role
    if (issuers.some(i => i.toLowerCase() === issuerAddr)) {
      setAddressError('This address already has the issuer role');
      return;
    }

    try {
      setLoading(true);
      
      // Grant role on-chain
      const hash = await walletClient.writeContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'grantRole',
        args: [TEMPLATE_MANAGER_ROLE, newIssuerAddress as Address],
        account: address,
      });

      toast.loading('Granting role...', { id: 'grant' });

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Store in Supabase
      const { error: dbError } = await supabase
        .from('issuers')
        .upsert({
          address: issuerAddr,
          granted_by: address.toLowerCase(),
          is_active: true,
          granted_at: new Date().toISOString(),
        }, { onConflict: 'address' });

      if (dbError) {
        console.error('Error storing issuer in database:', dbError);
        toast.error('Role granted on-chain but failed to store in database', { id: 'grant' });
      } else {
        toast.success(`Issuer role granted to ${newIssuerAddress}`, { id: 'grant' });
      }

      // Refresh the list
      await fetchIssuers();
      setNewIssuerAddress('');
      setAddressError('');
    } catch (err: any) {
      console.error('Error granting role:', err);
      toast.error(err.message || 'Failed to grant issuer role', { id: 'grant' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async (issuerAddress: Address) => {
    if (!window.confirm(`Are you sure you want to revoke issuer role from ${issuerAddress}?`)) {
      return;
    }

    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      
      // Revoke role on-chain
      const hash = await walletClient.writeContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'revokeRole',
        args: [TEMPLATE_MANAGER_ROLE, issuerAddress],
        account: address,
      });

      toast.loading('Revoking role...', { id: 'revoke' });

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Update in Supabase
      const { error: dbError } = await supabase
        .from('issuers')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('address', issuerAddress.toLowerCase());

      if (dbError) {
        console.error('Error updating issuer in database:', dbError);
        toast.error('Role revoked on-chain but failed to update database', { id: 'revoke' });
      } else {
        toast.success(`Issuer role revoked from ${issuerAddress}`, { id: 'revoke' });
      }

      // Refresh the list
      await fetchIssuers();
    } catch (err: any) {
      console.error('Error revoking role:', err);
      toast.error(err.message || 'Failed to revoke issuer role', { id: 'revoke' });
    } finally {
      setLoading(false);
    }
  };

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
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  addressError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x... Ethereum address"
                disabled={loading}
              />
              {addressError && <p className="mt-1 text-sm text-red-600">{addressError}</p>}
            </div>
            <button
              type="submit"
              disabled={loading || fetchingIssuers}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Processing...' : 'Grant Role'}
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

        {fetchingIssuers ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 text-sm">Loading issuers...</p>
          </div>
        ) : issuers.length === 0 ? (
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
              Grant issuer roles to addresses to allow them to create templates and issue cards.
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
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loading ? 'Processing...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
