import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWalletClient, useAccount, usePublicClient } from 'wagmi';
import { type Address, isAddress, keccak256, toHex } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardABI from '../../lib/ReputationCard.abi.json';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Shield, UserPlus, UserMinus, Users, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

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
      } as any);

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
      } as any);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back Button */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Issuer Management
              </h1>
              <p className="text-gray-600">Grant and revoke issuer roles for template creation</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Active Issuers</p>
                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {fetchingIssuers ? '...' : issuers.length}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span className="font-medium">Template managers</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Grant Role Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Grant Issuer Role</h2>
          </div>

          <form onSubmit={handleGrantRole}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ethereum Address
                </label>
                <input
                  type="text"
                  value={newIssuerAddress}
                  onChange={(e) => {
                    setNewIssuerAddress(e.target.value);
                    setAddressError('');
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    addressError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0x... Ethereum address"
                  disabled={loading}
                />
                {addressError && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{addressError}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Grant <span className="font-bold">TEMPLATE_MANAGER_ROLE</span> to allow an address to create templates and issue cards
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || fetchingIssuers}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Grant Role
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Issuers List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Current Issuers</h2>
          </div>

          {fetchingIssuers ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading issuers...</p>
            </div>
          ) : issuers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issuers Found</h3>
              <p className="text-gray-600 mb-1">
                Grant issuer roles to addresses to allow them to create templates and issue cards.
              </p>
              <p className="text-sm text-gray-500">
                Use the form above to add your first issuer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {issuers.map((issuer) => (
                <div
                  key={issuer}
                  className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-semibold text-gray-900 truncate">
                          {issuer}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <CheckCircle className="w-3 h-3" />
                            TEMPLATE_MANAGER_ROLE
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeRole(issuer)}
                      disabled={loading}
                      className="ml-4 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Revoke
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-1">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Issuer Management System</h3>
                <p className="text-sm text-gray-600">On-chain role management with database sync</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
