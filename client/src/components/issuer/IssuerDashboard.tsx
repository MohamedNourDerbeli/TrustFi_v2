import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTemplates } from '../../hooks/useTemplates';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import {
  FileText,
  Award,
  CheckCircle,
  Link2,
  Send,
  Package,
  Activity,
  Zap,
  Lock,
  AlertCircle,
  Copy,
  Check,
  Shield
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
  uniqueProfiles: number;
}

interface RecentIssuance {
  id: string;
  profile_id: string;
  template_id: string;
  card_id: string;
  claim_type: 'direct' | 'signature';
  claimed_at: string;
}

interface ActivityPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export const IssuerDashboard: React.FC = () => {
  const { address, isIssuer, issuerDid, isLoading: authLoading } = useAuth();
  const { templates: blockchainTemplates, loading: templatesLoading } = useTemplates(null, true);
  const [issuerTemplates, setIssuerTemplates] = useState<TemplateData[]>([]);
  const [stats, setStats] = useState<IssuerStats>({
    totalTemplates: 0,
    totalCardsIssued: 0,
    claimsByTemplate: {},
    uniqueProfiles: 0,
  });
  const [recentIssuances, setRecentIssuances] = useState<RecentIssuance[]>([]);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedDid, setCopiedDid] = useState(false);

  const copyDidToClipboard = async () => {
    if (issuerDid?.uri) {
      try {
        await navigator.clipboard.writeText(issuerDid.uri);
        setCopiedDid(true);
        setTimeout(() => setCopiedDid(false), 2000);
      } catch (err) {
        console.error('Failed to copy DID:', err);
      }
    }
  };

  useEffect(() => {
    const fetchIssuerStats = async () => {
      if (!address || !isIssuer || !blockchainTemplates) return;

      try {
        setLoading(true);
        setError(null);

        // Filter templates for this issuer from blockchain
        const templates = blockchainTemplates
          .filter(t => t.issuer.toLowerCase() === address.toLowerCase())
          .map(t => ({
            template_id: t.templateId.toString(),
            issuer: t.issuer,
            name: t.name || `Template #${t.templateId}`,
            description: t.description || '',
            max_supply: t.maxSupply.toString(),
            current_supply: t.currentSupply.toString(),
            tier: t.tier,
            start_time: t.startTime.toString(),
            end_time: t.endTime.toString(),
            is_paused: t.isPaused,
          }));

        setIssuerTemplates(templates);

        if (!templates || templates.length === 0) {
          setStats({
            totalTemplates: 0,
            totalCardsIssued: 0,
            claimsByTemplate: {},
            uniqueProfiles: 0,
          });
          setRecentIssuances([]);
          setActivity([]);
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

        // Calculate claims by template and unique profiles
        const claimsByTemplate: Record<string, number> = {};
        const uniqueProfilesSet = new Set<string>();
        templateIds.forEach((id) => {
          claimsByTemplate[id] = 0;
        });
        claimsData?.forEach((claim) => {
          if (claimsByTemplate[claim.template_id] !== undefined) {
            claimsByTemplate[claim.template_id]++;
          }
          uniqueProfilesSet.add(String(claim.profile_id));
        });

        // Build last 14 days activity (including days with zero)
        const today = new Date();
        const last14: ActivityPoint[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const iso = d.toISOString().slice(0, 10);
          last14.push({ date: iso, count: 0 });
        }
        claimsData?.forEach(c => {
          const iso = new Date(c.claimed_at).toISOString().slice(0, 10);
          const point = last14.find(p => p.date === iso);
          if (point) point.count += 1;
        });
        setActivity(last14);

        setStats({
          totalTemplates: templates.length,
          totalCardsIssued: claimsData?.length || 0,
          claimsByTemplate,
          uniqueProfiles: uniqueProfilesSet.size,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading issuer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isIssuer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <Lock className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-4">You are not registered as an issuer.</p>
          <Link to="/" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Dashboard</h2>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Issuer Dashboard</h1>
              <p className="text-sm text-gray-600">Overview of your issuance activity</p>
            </div>
          </div>
          {/* DID Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-gray-900">KILT Attester DID</h2>
                  {issuerDid && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-medium rounded-md">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                {!issuerDid ? (
                  <p className="text-xs text-gray-500">Creating attester DID...</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-mono truncate">{issuerDid.uri}</code>
                    <button
                      onClick={copyDidToClipboard}
                      className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      {copiedDid ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Templates" value={stats.totalTemplates} icon={<FileText className="w-5 h-5" />} />
          <KpiCard label="Active" value={issuerTemplates.filter(t => !t.is_paused).length} icon={<CheckCircle className="w-5 h-5" />} />
          <KpiCard label="Total Issued" value={stats.totalCardsIssued} icon={<Zap className="w-5 h-5" />} />
          <KpiCard label="Unique Profiles" value={stats.uniqueProfiles} icon={<Activity className="w-5 h-5" />} />
        </div>

        {/* Activity Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" />14-Day Issuance Activity</h2>
            <span className="text-xs text-gray-500">Daily claims</span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {activity.map(p => {
              const max = Math.max(1, ...activity.map(a => a.count));
              const height = (p.count / max) * 100;
              return (
                <div key={p.date} className="flex-1 flex flex-col items-center justify-end">
                  <div className="w-full bg-blue-100 rounded-sm" style={{ height: `${height}%` }} />
                  <span className="mt-1 text-[10px] text-gray-500">{p.date.slice(5)}</span>
                  {p.count > 0 && <span className="text-[10px] text-gray-700 font-medium">{p.count}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-green-600" />Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <ActionLink to="/issuer/templates" icon={<FileText className="w-4 h-4" />} label="Templates" />
            <ActionLink to="/issuer/collectibles" icon={<Package className="w-4 h-4" />} label="Collectibles" />
            <ActionLink to="/issuer/issue" icon={<Send className="w-4 h-4" />} label="Issue Card" />
            <ActionLink to="/issuer/claim-links" icon={<Link2 className="w-4 h-4" />} label="Claim Link" />
          </div>
        </div>

        {/* Claims by Template (table) */}
        {issuerTemplates.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Claims by Template</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-600 border-b">
                    <th className="py-2 text-left">Template</th>
                    <th className="py-2 text-left">Tier</th>
                    <th className="py-2 text-left">Claims</th>
                    <th className="py-2 text-left">Supply</th>
                    <th className="py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuerTemplates.map(t => (
                    <tr key={t.template_id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium text-gray-900 truncate max-w-[160px]" title={t.name || `Template #${t.template_id}`}>{t.name || `Template #${t.template_id}`}</td>
                      <td className="py-2 pr-4">{t.tier}</td>
                      <td className="py-2 pr-4 font-semibold">{stats.claimsByTemplate[t.template_id] || 0}</td>
                      <td className="py-2 pr-4">{t.current_supply}/{t.max_supply}</td>
                      <td className="py-2">
                        {t.is_paused ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-red-50 text-red-600"><AlertCircle className="w-3 h-3" />Paused</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded bg-green-50 text-green-700"><CheckCircle className="w-3 h-3" />Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Issuances simplified */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-green-600" />Recent Issuances</h2>
          {recentIssuances.length === 0 ? (
            <p className="text-xs text-gray-500">No recent claims.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-600 border-b">
                    <th className="py-2 text-left">Profile</th>
                    <th className="py-2 text-left">Template</th>
                    <th className="py-2 text-left">Card</th>
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssuances.map(r => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">#{r.profile_id}</td>
                      <td className="py-2 pr-4">#{r.template_id}</td>
                      <td className="py-2 pr-4 font-semibold text-purple-600">#{r.card_id}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded ${r.claim_type === 'direct' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {r.claim_type === 'direct' ? <Zap className="w-3 h-3" /> : <FileText className="w-3 h-3" />}{r.claim_type === 'direct' ? 'Direct' : 'Signature'}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-600">{new Date(r.claimed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="pt-4 pb-8 text-center text-[11px] text-gray-500">Issuer analytics v1 • Simplified layout</footer>
      </div>
    </div>
  );
};

// Reusable KPI Card component
const KpiCard: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
      <div className="text-gray-400">{icon}</div>
    </div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
  </div>
);

// Reusable Action Link button
const ActionLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
  >
    {icon}
    {label}
  </Link>
);
