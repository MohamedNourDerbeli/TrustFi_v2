import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTemplates } from '../../hooks/useTemplates';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface IssuerStats {
  totalTemplates: number;
  totalCardsIssued: number;
  claimsByTemplate: Record<string, number>;
}

interface RecentIssuance {
  id: string;
  profile_id: string;
  template_id: string;
  card_id: string;
  claim_type: 'direct' | 'signature';
  claimed_at: string;
}

export const IssuerDashboard: React.FC = () => {
  const { address, isIssuer, isLoading: authLoading } = useAuth();
  const { templates, loading: templatesLoading } = useTemplates();
  const [stats, setStats] = useState<IssuerStats>({
    totalTemplates: 0,
    totalCardsIssued: 0,
    claimsByTemplate: {},
  });
  const [recentIssuances, setRecentIssuances] = useState<RecentIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter templates where issuer matches connected wallet
  const issuerTemplates = templates.filter(
    (template) => template.issuer.toLowerCase() === address?.toLowerCase()
  );

  useEffect(() => {
    const fetchIssuerStats = async () => {
      if (!address) return;

      try {
        setLoading(true);
        setError(null);

        // Get template IDs for this issuer
        const templateIds = issuerTemplates.map((t) => t.templateId.toString());

        if (templateIds.length === 0) {
          setStats({
            totalTemplates: 0,
            totalCardsIssued: 0,
            claimsByTemplate: {},
          });
          setRecentIssuances([]);
          setLoading(false);
          return;
        }

        // Get total cards issued from these templates
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims_log')
          .select('*')
          .in('template_id', templateIds)
          .order('claimed_at', { ascending: false });

        if (claimsError) throw claimsError;

        // Calculate claims by template
        const claimsByTemplate: Record<string, number> = {};
        templateIds.forEach((id) => {
          claimsByTemplate[id] = 0;
        });

        claimsData?.forEach((claim) => {
          if (claimsByTemplate[claim.template_id] !== undefined) {
            claimsByTemplate[claim.template_id]++;
          }
        });

        setStats({
          totalTemplates: issuerTemplates.length,
          totalCardsIssued: claimsData?.length || 0,
          claimsByTemplate,
        });

        // Get recent issuances (last 10)
        setRecentIssuances(claimsData?.slice(0, 10) || []);
      } catch (err) {
        console.error('Error fetching issuer stats:', err);
        setError('Failed to load issuer statistics');
      } finally {
        setLoading(false);
      }
    };

    if (isIssuer && !authLoading && !templatesLoading) {
      fetchIssuerStats();
    }
  }, [address, isIssuer, authLoading, templatesLoading, issuerTemplates.length]);

  if (authLoading || templatesLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading issuer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isIssuer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            You do not have issuer permissions to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Issuer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your templates and issue credentials</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Templates</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTemplates}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cards Issued</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCardsIssued}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {issuerTemplates.filter((t) => !t.isPaused).length}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/issuer/templates"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Templates</h3>
                <p className="text-gray-600 mt-1">View and manage your templates</p>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            to="/issuer/issue"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Issue Card</h3>
                <p className="text-gray-600 mt-1">Directly issue cards to users</p>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            to="/issuer/claim-links"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Generate Claim Link</h3>
                <p className="text-gray-600 mt-1">Create shareable claim links</p>
              </div>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Claims by Template */}
        {issuerTemplates.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Claims by Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issuerTemplates.map((template) => (
                <div key={template.templateId.toString()} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Template #{template.templateId.toString()}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        template.isPaused
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {template.isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Tier {template.tier}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Claims:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats.claimsByTemplate[template.templateId.toString()] || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">Supply:</span>
                    <span className="text-sm text-gray-900">
                      {template.currentSupply.toString()} / {template.maxSupply.toString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Issuances */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Issuances</h2>
          {recentIssuances.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No recent issuances</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profile ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Card ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentIssuances.map((issuance) => (
                    <tr key={issuance.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issuance.profile_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issuance.template_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issuance.card_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            issuance.claim_type === 'direct'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {issuance.claim_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(issuance.claimed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
