import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  FileText, Award, CheckCircle, Link2, Send, Package, 
  Activity, TrendingUp, Zap, Lock, AlertCircle 
} from 'lucide-react';

interface TemplateData {
  template_id: string;
  issuer: string;
  name: string | null;
  description: string | null;
  max_supply: string;
  current_supply: string;
  tier: number;
  start_time: string;
  end_time: string;
  is_paused: boolean;
}

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
  const [issuerTemplates, setIssuerTemplates] = useState<TemplateData[]>([]);
  const [stats, setStats] = useState<IssuerStats>({
    totalTemplates: 0,
    totalCardsIssued: 0,
    claimsByTemplate: {},
  });
  const [recentIssuances, setRecentIssuances] = useState<RecentIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssuerStats = async () => {
      if (!address || !isIssuer) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch templates for this issuer from Supabase
        const { data: templates, error: templatesError } = await supabase
          .from('templates_cache')
          .select('*')
          .eq('issuer', address.toLowerCase());

        if (templatesError) throw templatesError;

        setIssuerTemplates(templates || []);

        if (!templates || templates.length === 0) {
          setStats({
            totalTemplates: 0,
            totalCardsIssued: 0,
            claimsByTemplate: {},
          });
          setRecentIssuances([]);
          setLoading(false);
          return;
        }

        // Get template IDs for this issuer
        const templateIds = templates.map((t) => t.template_id);

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
          totalTemplates: templates.length,
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

    if (isIssuer && !authLoading) {
      fetchIssuerStats();
    }
  }, [address, isIssuer, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">Loading issuer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isIssuer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You do not have issuer permissions to access this dashboard.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Issuer Dashboard
              </h1>
              <p className="text-gray-600">Manage your templates and issue credentials</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">My Templates</p>
                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stats.totalTemplates}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">Card types</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Total Cards Issued</p>
                <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {stats.totalCardsIssued}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <Zap className="w-3 h-3" />
                  <span className="font-medium">Total claims</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Active Templates</p>
                <p className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {issuerTemplates.filter((t) => !t.is_paused).length}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <Activity className="w-3 h-3" />
                  <span className="font-medium">Live now</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/issuer/templates"
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">My Templates</h3>
              <p className="text-sm text-gray-600">View and manage your templates</p>
            </Link>

            <Link
              to="/issuer/collectibles"
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Collectibles</h3>
              <p className="text-sm text-gray-600">Create user-facing collectibles</p>
            </Link>

            <Link
              to="/issuer/issue"
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Issue Card</h3>
              <p className="text-sm text-gray-600">Directly issue cards to users</p>
            </Link>

            <Link
              to="/issuer/claim-links"
              className="group bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105 text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <svg className="w-6 h-6 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Generate Claim Link</h3>
              <p className="text-sm text-white/90">Create shareable claim links</p>
            </Link>
          </div>
        </div>

        {/* Claims by Template */}
        {issuerTemplates.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Claims by Template
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issuerTemplates.map((template) => (
                <div key={template.template_id} className="group bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{template.name || `Template #${template.template_id}`}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full ${
                        template.is_paused
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}
                    >
                      {template.is_paused ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Paused
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg">
                      <Award className="w-3 h-3" />
                      Tier {template.tier}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Claims:</span>
                      <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {stats.claimsByTemplate[template.template_id] || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Supply:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {template.current_supply} / {template.max_supply}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Issuances */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Recent Issuances
            </h2>
            <span className="text-sm text-gray-600 font-medium">Last 10 claims</span>
          </div>
          
          {recentIssuances.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Issuances</h3>
              <p className="text-gray-600">Card claims will appear here</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Profile ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Template ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Card ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Claim Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentIssuances.map((issuance, index) => (
                      <tr key={issuance.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {issuance.profile_id.slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              #{issuance.profile_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            #{issuance.template_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-purple-600">
                            #{issuance.card_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                              issuance.claim_type === 'direct'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {issuance.claim_type === 'direct' ? (
                              <>
                                <Zap className="w-3 h-3" />
                                Direct
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                Signature
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(issuance.claimed_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(issuance.claimed_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="mt-8 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-2xl shadow-xl p-1">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Issuer Status</h3>
                <p className="text-sm text-gray-600">All systems operational</p>
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
