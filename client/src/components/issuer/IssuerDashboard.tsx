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
  const [lastIssuedByTemplate, setLastIssuedByTemplate] = useState<Record<string, string | null>>({});
  const [periodStats, setPeriodStats] = useState<{ last14: number; prev14: number }>({ last14: 0, prev14: 0 });
  // Internal fetch completion flag (separate from auth/templates loading)
  const [statsFetched, setStatsFetched] = useState(false);
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
      if (!address || !isIssuer || templatesLoading || !blockchainTemplates) return;

      try {
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
          setStatsFetched(true);
          return;
        }

        // Get template IDs for this issuer
        // Use numeric IDs for Supabase query to avoid type mismatch if column is numeric
        const templateIdsNumeric = templates.map((t) => Number(t.template_id));
        const templateIds = templates.map(t => t.template_id);

        // Get total cards issued from these templates
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims_log')
          .select('*')
          .in('template_id', templateIdsNumeric)
          .order('claimed_at', { ascending: false });

        if (claimsError) throw claimsError;

        // Calculate claims by template, unique profiles, last issued per template
        const claimsByTemplate: Record<string, number> = {};
        const uniqueProfilesSet = new Set<string>();
        const lastIssuedMap: Record<string, string | null> = {};
        templateIds.forEach((id) => {
          claimsByTemplate[id] = 0;
          lastIssuedMap[id] = null;
        });
        // claimsData already ordered desc by claimed_at
        claimsData?.forEach((claim) => {
          const tid = claim.template_id;
          if (claimsByTemplate[tid] !== undefined) {
            claimsByTemplate[tid]++;
            if (!lastIssuedMap[tid]) lastIssuedMap[tid] = claim.claimed_at; // first encountered is most recent
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

        // Compute last 14 vs previous 14 day window counts
        const startCurrent = new Date(); startCurrent.setDate(today.getDate() - 13); // inclusive
        startCurrent.setHours(0,0,0,0);
        const startPrevious = new Date(); startPrevious.setDate(today.getDate() - 27); startPrevious.setHours(0,0,0,0);
        const endPrevious = new Date(); endPrevious.setDate(today.getDate() - 14); endPrevious.setHours(23,59,59,999);
        let currentCount = 0, previousCount = 0;
        claimsData?.forEach(c => {
          const dt = new Date(c.claimed_at);
          if (dt >= startCurrent) currentCount++;
          else if (dt >= startPrevious && dt <= endPrevious) previousCount++;
        });
        setPeriodStats({ last14: currentCount, prev14: previousCount });
        setLastIssuedByTemplate(lastIssuedMap);

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
        setStatsFetched(true);
      }
    };

    if (isIssuer && !authLoading) fetchIssuerStats();
  }, [address, isIssuer, authLoading, blockchainTemplates, templatesLoading]);

  // Derived loading state for skeletons
  const dataLoading = authLoading || templatesLoading || !statsFetched;

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

  // Helper skeleton block
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

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
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Templates" value={stats.totalTemplates} loading={dataLoading} icon={<FileText className="w-5 h-5" />} />
          <KpiCard label="Active" value={issuerTemplates.filter(t => !t.is_paused).length} loading={dataLoading} icon={<CheckCircle className="w-5 h-5" />} />
          <KpiCard label="Total Issued" value={stats.totalCardsIssued} loading={dataLoading} icon={<Zap className="w-5 h-5" />} />
          <KpiCard label="Unique Profiles" value={stats.uniqueProfiles} loading={dataLoading} icon={<Activity className="w-5 h-5" />} />
          <KpiCard label="14d Issued" value={periodStats.last14} loading={dataLoading} icon={<Zap className="w-5 h-5" />} diff={periodStats.prev14 ? ((periodStats.last14 - periodStats.prev14) / periodStats.prev14) * 100 : null} />
        </div>
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Issuance Line Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" />Issuances (14d)</h2>
              <span className="text-xs text-gray-500">Trend</span>
            </div>
            {dataLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <LineChart points={activity} />
            )}
          </div>
          {/* Claims Distribution Donut */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-600" />Claims Distribution</h2>
              <span className="text-xs text-gray-500">By template</span>
            </div>
            {dataLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : stats.totalCardsIssued === 0 ? (
              <p className="text-xs text-gray-500">No claims yet.</p>
            ) : (
              <DonutChart claimsByTemplate={stats.claimsByTemplate} />
            )}
          </div>
        </div>

        {/* Progress Bars (Top Templates) */}
        {issuerTemplates.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" />Top Template Share</h2>
            {dataLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-3">
                {issuerTemplates
                  .map(t => ({ id: t.template_id, name: t.name || `Template #${t.template_id}`, claims: stats.claimsByTemplate[t.template_id] || 0 }))
                  .sort((a, b) => b.claims - a.claims)
                  .slice(0, 5)
                  .map(t => {
                    const total = stats.totalCardsIssued || 1;
                    const pct = (t.claims / total) * 100;
                    return (
                      <div key={t.id} className="flex flex-col">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="truncate max-w-[200px]" title={t.name}>{t.name}</span>
                          <span className="font-medium text-gray-700">{t.claims} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded overflow-hidden">
                          <div className="h-2 rounded bg-gradient-to-r from-blue-500 to-indigo-600 transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Claims by Template</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-600 border-b">
                    <th className="py-2 text-left">Template</th>
                    <th className="py-2 text-left">Tier</th>
                    <th className="py-2 text-left">Claims</th>
                    <th className="py-2 text-left">Supply</th>
                    <th className="py-2 text-left">Last Issued</th>
                    <th className="py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataLoading ? (
                    <tr><td colSpan={6} className="py-6"><Skeleton className="h-4 w-full" /></td></tr>
                  ) : issuerTemplates.map(t => (
                    <tr key={t.template_id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium text-gray-900 truncate max-w-[160px]" title={t.name || `Template #${t.template_id}`}>{t.name || `Template #${t.template_id}`}</td>
                      <td className="py-2 pr-4">{t.tier}</td>
                      <td className="py-2 pr-4 font-semibold">{stats.claimsByTemplate[t.template_id] || 0}</td>
                      <td className="py-2 pr-4">{t.current_supply}/{t.max_supply}</td>
                      <td className="py-2 pr-4 text-xs text-gray-600">{lastIssuedByTemplate[t.template_id] ? new Date(lastIssuedByTemplate[t.template_id]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
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
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-fadeIn">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-green-600" />Recent Issuances</h2>
          {dataLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : recentIssuances.length === 0 ? (
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

        <footer className="pt-4 pb-8 text-center text-[11px] text-gray-500">Issuer analytics v2 • Enhanced visualization</footer>
      </div>
    </div>
  );
};

// Reusable KPI Card component
const KpiCard: React.FC<{ label: string; value: number; icon: React.ReactNode; diff?: number | null; loading?: boolean }> = ({ label, value, icon, diff, loading }) => {
  let diffEl: React.ReactNode = null;
  if (diff !== null && diff !== undefined) {
    const positive = diff >= 0;
    const display = `${positive ? '+' : ''}${diff.toFixed(1)}%`;
    diffEl = (
      <span className={`text-[10px] font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>{display}</span>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-semibold text-gray-900">{loading ? <span className="inline-block h-6 w-10 bg-gray-200 rounded animate-pulse" /> : value}</div>
        {diffEl}
      </div>
    </div>
  );
};

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

// Simple responsive line chart using SVG
const LineChart: React.FC<{ points: ActivityPoint[] }> = ({ points }) => {
  const max = Math.max(1, ...points.map(p => p.count));
  const h = 140; // chart height
  const w = 500; // base width
  const gap = w / (points.length - 1);
  const poly = points
    .map((p, i) => `${i * gap},${h - (p.count / max) * (h - 20)}`) // leave 20px top padding
    .join(' ');
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36 animate-fadeIn">
        {/* Gradient */}
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon points={`${poly} ${w},${h} 0,${h}`} fill="url(#lineGrad)" />
        {/* Line */}
        <polyline points={poly} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" className="[stroke-dasharray:1000] [stroke-dashoffset:1000] animate-[dash_1.4s_ease-out_forwards]" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={p.date} cx={i * gap} cy={h - (p.count / max) * (h - 20)} r={3} fill="#1d4ed8" className="opacity-0 animate-fadeIn" style={{ animationDelay: `${i * 40}ms` }} />
        ))}
        {/* X labels */}
        {points.map((p, i) => (
          <text key={p.date + '-label'} x={i * gap} y={h - 4} fontSize={9} textAnchor="middle" fill="#6b7280">
            {p.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Donut chart for template claim distribution
const DonutChart: React.FC<{ claimsByTemplate: Record<string, number> }> = ({ claimsByTemplate }) => {
  const entries = Object.entries(claimsByTemplate).filter(([, v]) => v > 0);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const colors = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b'];
  return (
    <div className="flex items-center gap-4">
      <svg width={120} height={120} className="shrink-0 animate-scaleIn">
        <g transform="translate(60,60)">
          {entries.map(([id, v], idx) => {
            const frac = v / total;
            const dash = frac * circ;
            const strokeDasharray = `${dash} ${circ - dash}`;
            const circle = (
              <circle
                key={id}
                r={radius}
                fill="transparent"
                stroke={colors[idx % colors.length]}
                strokeWidth={14}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
          <text textAnchor="middle" dy="4" fontSize={14} className="fill-gray-700 font-semibold">{total}</text>
        </g>
      </svg>
      <div className="flex-1 space-y-1">
        {entries
          .sort((a,b) => b[1]-a[1])
          .map(([id,v], idx) => {
            const pct = (v/total)*100;
            return (
              <div key={id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{backgroundColor: colors[idx % colors.length]}} />
                  <span className="truncate" title={`Template #${id}`}>Template {id}</span>
                </div>
                <span className="font-medium text-gray-700">{v} ({pct.toFixed(1)}%)</span>
              </div>
            );
          })}
      </div>
    </div>
  );
};
