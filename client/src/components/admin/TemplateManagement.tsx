import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWalletClient, useAccount, usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardAbi from '../../lib/ReputationCard.abi.json';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
  FileText,
  ArrowLeft,
  Play,
  Pause,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Users,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';

interface Template {
  template_id: string;
  name: string;
  issuer: string;
  max_supply: string;
  current_supply: string;
  tier: number;
  start_time: string;
  end_time: string;
  is_paused: boolean;
}

export const TemplateManagement: React.FC = () => {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTemplate, setProcessingTemplate] = useState<string | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 1 | 2 | 3>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter templates based on search and filters
  useEffect(() => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.template_id.toString().includes(searchQuery)
      );
    }

    // Tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter((template) => template.tier === selectedTier);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((template) =>
        statusFilter === 'active' ? !template.is_paused : template.is_paused
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedTier, statusFilter]);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error} = await supabase
          .from('templates_cache')
          .select('*')
          .order('template_id', { ascending: true });

        if (error) {
          console.error('Error fetching templates:', error);
          toast.error('Failed to load templates');
        } else {
          setTemplates(data || []);
          console.log('Loaded templates:', data);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTogglePause = async (templateId: string, currentPauseState: boolean) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setProcessingTemplate(templateId);
      toast.loading(currentPauseState ? 'Unpausing template...' : 'Pausing template...', {
        id: 'pause',
      });

      const hash = await walletClient.writeContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardAbi,
        functionName: 'setTemplatePaused',
        args: [BigInt(templateId), !currentPauseState],
        account: address,
      } as any);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await supabase
        .from('templates_cache')
        .update({ is_paused: !currentPauseState })
        .eq('template_id', templateId);

      setTemplates((prev) =>
        prev.map((t) =>
          t.template_id === templateId ? { ...t, is_paused: !currentPauseState } : t
        )
      );

      toast.success(
        `Template ${templateId} ${currentPauseState ? 'unpaused' : 'paused'} successfully`,
        { id: 'pause' }
      );
    } catch (err: any) {
      console.error('Error toggling pause state:', err);
      toast.error(err.message || 'Failed to update template pause state', { id: 'pause' });
    } finally {
      setProcessingTemplate(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">
            Loading templates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Template Management
              </h1>
              <p className="text-gray-600">Manage template pause states and view details</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all ${
                  showFilters
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Tier Filter */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Tier</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTier('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTier === 'all'
                          ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      All Tiers
                    </button>
                    {[1, 2, 3].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier as 1 | 2 | 3)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedTier === tier
                            ? tier === 1
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                              : tier === 2
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        Tier {tier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === 'all'
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === 'active'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setStatusFilter('paused')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === 'paused'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      Paused
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Showing {filteredTemplates.length} of {templates.length} templates
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  {searchQuery || selectedTier !== 'all' || statusFilter !== 'all' ? 'Filtered' : 'Total'} Templates
                </p>
                <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {filteredTemplates.length}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <Activity className="w-3 h-3" />
                  <span className="font-medium">Active card templates</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-white/20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {templates.length === 0 ? 'No Templates Found' : 'No Matching Templates'}
            </h3>
            <p className="text-gray-600 mb-1">
              {templates.length === 0 
                ? 'Create a new template to get started' 
                : 'Try adjusting your search or filters'}
            </p>
            <p className="text-sm text-gray-500">
              {templates.length === 0 
                ? 'Templates will appear here once created'
                : `${templates.length} total templates available`}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredTemplates.map((template) => {
              const isProcessing = processingTemplate === template.template_id;
              const maxSupply = Number(template.max_supply);
              const currentSupply = Number(template.current_supply);
              const supplyPercentage = maxSupply > 0 ? (currentSupply / maxSupply) * 100 : 0;

              // List View
              if (viewMode === 'list') {
                return (
                  <div
                    key={template.template_id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Icon Section */}
                      <div className="relative sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-white" />
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
                          Tier {template.tier}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{template.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">ID #{template.template_id}</p>
                            <p className="text-xs text-gray-500 font-mono truncate">{template.issuer}</p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              template.is_paused
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}
                          >
                            {template.is_paused ? (
                              <>
                                <Pause className="w-3 h-3" />
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

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {currentSupply} / {maxSupply} issued
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">
                              {supplyPercentage.toFixed(0)}% filled
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {(() => {
                                const startTime = template.start_time;
                                if (!startTime || startTime === '0' || Number(startTime) === 0) {
                                  return 'Immediate';
                                }
                                return new Date(Number(startTime) * 1000).toLocaleDateString();
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => handleTogglePause(template.template_id, template.is_paused)}
                          disabled={isProcessing}
                          className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                            template.is_paused
                              ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white'
                              : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                          } disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : template.is_paused ? (
                            <>
                              <Play className="w-4 h-4" />
                              Unpause
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4" />
                              Pause
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Grid View
              return (
                <div
                  key={template.template_id}
                  className="group bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                          template.is_paused
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                            : 'bg-gradient-to-br from-blue-500 to-purple-500'
                        }`}
                      >
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Tier {template.tier} • ID #{template.template_id}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                        (template as any).isPaused || (template as any).is_paused
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-green-100 text-green-800 border-green-200'
                      }`}
                    >
                      {((template as any).isPaused || (template as any).is_paused) ? (
                        <>
                          <Pause className="w-3 h-3" />
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

                  <div className="space-y-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-600 font-medium">Issuer</span>
                      </div>
                      <span className="font-mono text-xs text-gray-900 break-all">
                        {template.issuer}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-800">Supply</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">
                          {currentSupply} / {maxSupply}
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-800">Progress</span>
                        </div>
                        <p className="text-lg font-bold text-purple-900">
                          {supplyPercentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Start Time
                        </span>
                        <span className="text-gray-900 font-medium">
                          {(() => {
                            const startTime = (template as any).startTime || (template as any).start_time;
                            if (!startTime || startTime === 0n || startTime === '0' || Number(startTime) === 0) {
                              return 'Immediate';
                            }
                            const timestamp = typeof startTime === 'bigint' ? Number(startTime) : parseInt(startTime);
                            return new Date(timestamp * 1000).toLocaleDateString();
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          End Time
                        </span>
                        <span className="text-gray-900 font-medium">
                          {(() => {
                            const endTime = (template as any).endTime || (template as any).end_time;
                            if (!endTime || endTime === 0n || endTime === '0' || Number(endTime) === 0) {
                              return 'No expiration';
                            }
                            const timestamp = typeof endTime === 'bigint' ? Number(endTime) : parseInt(endTime);
                            return new Date(timestamp * 1000).toLocaleDateString();
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${supplyPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTogglePause(template.template_id, template.is_paused)}
                    disabled={isProcessing}
                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                      template.is_paused
                        ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white'
                        : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                    } disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : template.is_paused ? (
                      <>
                        <Play className="w-5 h-5" />
                        Unpause Template
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause Template
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-2xl shadow-xl p-1">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Template Management System
                </h3>
                <p className="text-sm text-gray-600">Pause and unpause templates on-chain</p>
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
