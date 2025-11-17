import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTemplates } from '../../hooks/useTemplates'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
// Removed direct contract interaction & Supabase cache update for pause state
// We now rely solely on useTemplates().pauseTemplate which handles on-chain update & refetch
import {
  FileText,
  ArrowLeft,
  Pause,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Users,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'

interface TemplateData {
  template_id: string
  issuer: string
  name: string | null
  description: string | null
  max_supply: string
  current_supply: string
  tier: number
  start_time: string
  end_time: string
  is_paused: boolean
  totalClaims: number
}

export const TemplateList: React.FC = () => {
  const { address, isIssuer, isLoading: authLoading } = useAuth()
  const { templates: blockchainTemplates, loading: templatesLoading, refreshTemplates, pauseTemplate } = useTemplates(null, true)

  const [templatesWithClaims, setTemplatesWithClaims] = useState<
    TemplateData[]
  >([])
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pausingTemplate, setPausingTemplate] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState<'all' | 1 | 2 | 3>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>(
    'all'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  // Convert blockchain templates to component format
  useEffect(() => {
    const loadTemplates = async () => {
      if (!address || !isIssuer || !blockchainTemplates || blockchainTemplates.length === 0) return

      try {
        setError(null)

        // Filter templates for this issuer
        const issuerTemplates = blockchainTemplates.filter(
          t => t.issuer.toLowerCase() === address.toLowerCase()
        )

        if (issuerTemplates.length === 0) {
          setTemplatesWithClaims([])
          return
        }

        // Fetch claim counts for all templates
        const templateIds = issuerTemplates.map(t => t.templateId.toString())
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims_log')
          .select('template_id')
          .in('template_id', templateIds)

        if (claimsError) throw claimsError

        // Count claims per template
        const claimCounts: Record<string, number> = {}
        templateIds.forEach(id => (claimCounts[id] = 0))
        claimsData?.forEach(claim => {
          if (claimCounts[claim.template_id] !== undefined) {
            claimCounts[claim.template_id]++
          }
        })

        // Combine templates with claim counts
        const templatesWithClaimsData = issuerTemplates.map(template => ({
          template_id: template.templateId.toString(),
          issuer: template.issuer,
          name: template.name,
          description: template.description,
          max_supply: template.maxSupply.toString(),
          current_supply: template.currentSupply.toString(),
          tier: template.tier,
          start_time: template.startTime.toString(),
          end_time: template.endTime.toString(),
          is_paused: template.isPaused,
          totalClaims: claimCounts[template.templateId.toString()] || 0
        }))

        setTemplatesWithClaims(templatesWithClaimsData)
      } catch (err) {
        console.error('Error fetching templates:', err)
        setError('Failed to load templates')
        toast.error('Failed to load templates')
      }
    }

    loadTemplates()
  }, [isIssuer, address, blockchainTemplates?.length])

  // Filtering logic
  useEffect(() => {
    let filtered = [...templatesWithClaims]

    if (searchQuery) {
      filtered = filtered.filter(
        template =>
          template.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.template_id.includes(searchQuery)
      )
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(template => template.tier === selectedTier)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(template =>
        statusFilter === 'active' ? !template.is_paused : template.is_paused
      )
    }

    setFilteredTemplates(filtered)
  }, [templatesWithClaims, searchQuery, selectedTier, statusFilter])

  const handlePauseToggle = async (templateId: string, currentPauseState: boolean) => {
    if (!templateId) {
      toast.error('Invalid template ID')
      return
    }
    try {
      setPausingTemplate(templateId)
      setError(null)
      // Invoke hook pauseTemplate with desired state (contract + refetch handled internally)
      await pauseTemplate(BigInt(templateId), !currentPauseState)
      // Update local state immediately for responsiveness; authoritative state comes from refetch
      setTemplatesWithClaims(prev => prev.map(t => t.template_id === templateId ? { ...t, is_paused: !currentPauseState } : t))
      toast.success(`Template ${currentPauseState ? 'unpaused' : 'paused'} successfully`)
      // Refresh full template list to sync with on-chain state
      await refreshTemplates()
    } catch (err: any) {
      console.error('Error toggling template pause state:', err)
      setError(err.message || 'Failed to update template pause state')
      toast.error(err.message || 'Failed to update template pause state')
    } finally {
      setPausingTemplate(null)
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    const ts = BigInt(timestamp)
    if (ts === 0n) return 'Immediate'
    return new Date(Number(ts) * 1000).toLocaleDateString()
  }

  if (authLoading || templatesLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
        <div className='text-center'>
          <div className='relative inline-block'>
            <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
            <div
              className='absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin'
              style={{
                animationDirection: 'reverse',
                animationDuration: '1.5s'
              }}
            ></div>
          </div>
          <p className='mt-6 text-lg font-medium text-gray-700 animate-pulse'>
            Loading templates...
          </p>
        </div>
      </div>
    )
  }

  if (!isIssuer) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
        <div className='bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl shadow-xl p-8 max-w-md'>
          <h2 className='text-2xl font-bold text-red-900 mb-3'>
            Access Denied
          </h2>
          <p className='text-red-700'>
            You do not have issuer permissions to access this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8'>
      <div className='container mx-auto px-4 max-w-7xl'>
        <Link
          to='/issuer'
          className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-colors group'
        >
          <ArrowLeft className='w-5 h-5 group-hover:-translate-x-1 transition-transform' />
          Back to Issuer Dashboard
        </Link>

        {/* Header */}
        <div className='mb-8 flex items-center gap-3'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center'>
            <FileText className='w-6 h-6 text-white' />
          </div>
          <div>
            <h1 className='text-4xl font-black text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              My Templates
            </h1>
            <p className='text-gray-600'>Manage your credential templates</p>
          </div>
        </div>

        {/* Controls */}
        <div className='mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20'>
          <div className='flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search templates...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all'
              />
            </div>

            <div className='flex items-center gap-3'>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-all ${
                  showFilters
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className='w-5 h-5' />
              </button>

              <div className='flex bg-gray-100 rounded-xl p-1'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className='w-5 h-5 text-gray-600' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <List className='w-5 h-5 text-gray-600' />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className='mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top space-y-4'>
              {/* Tier Filter */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <p className='text-sm font-semibold text-gray-700 mb-3'>
                    Filter by Tier
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={() => setSelectedTier('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTier === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      All Tiers
                    </button>
                    {[1, 2, 3].map(tier => (
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
                  <p className='text-sm font-semibold text-gray-700 mb-3'>
                    Filter by Status
                  </p>
                  <div className='flex flex-wrap gap-2'>
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

              <p className='text-sm text-gray-600'>
                Showing {filteredTemplates.length} of{' '}
                {templatesWithClaims.length} templates
              </p>
            </div>
          )}
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-white/20 text-center'>
            <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center'>
              <FileText className='w-10 h-10 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {templatesWithClaims.length === 0
                ? 'No Templates Found'
                : 'No Matching Templates'}
            </h3>
            <p className='text-gray-600 mb-1'>
              {templatesWithClaims.length === 0
                ? "You don't have any templates yet"
                : 'Try adjusting your search or filters'}
            </p>
            <p className='text-sm text-gray-500'>
              {templatesWithClaims.length === 0
                ? 'Contact an admin to create templates for you'
                : `${templatesWithClaims.length} total templates available`}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredTemplates.map(template => {
              const isProcessing = pausingTemplate === template.template_id
              const maxSupply = Number(template.max_supply)
              const currentSupply = Number(template.current_supply)
              const supplyPercentage =
                maxSupply > 0 ? (currentSupply / maxSupply) * 100 : 0

              if (viewMode === 'list') {
                return (
                  <div
                    key={template.template_id}
                    className='bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col sm:flex-row'
                  >
                    <div className='relative sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl'>
                      <FileText className='w-12 h-12 text-white' />
                      <span className='absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white'>
                        Tier {template.tier}
                      </span>
                    </div>
                    <div className='flex-1 p-6 flex flex-col justify-between'>
                      <div>
                        <div className='flex items-start justify-between mb-3'>
                          <div className='flex-1'>
                            <h3 className='text-xl font-bold text-gray-900 mb-1'>
                              {template.name ||
                                template.description ||
                                `Template #${template.template_id}`}
                            </h3>
                            <p className='text-sm text-gray-600 mb-2'>
                              Tier {template.tier} • ID #{template.template_id}
                            </p>
                            <p className='text-xs text-gray-500 font-mono truncate'>
                              {template.issuer}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              template.is_paused
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}
                          >
                            {template.is_paused ? (
                              <><Pause className='w-3 h-3' /> Paused</>
                            ) : (
                              <><CheckCircle className='w-3 h-3' /> Active</>
                            )}
                          </span>
                        </div>

                        <div className='flex flex-wrap gap-4 mb-4'>
                          <div className='flex items-center gap-2'>
                            <Users className='w-4 h-4 text-gray-500' />
                            <span className='text-sm text-gray-600'>
                              {currentSupply} / {maxSupply} issued
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <TrendingUp className='w-4 h-4 text-purple-600' />
                            <span className='text-sm text-purple-600 font-medium'>
                              {supplyPercentage.toFixed(0)}% filled
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Clock className='w-4 h-4 text-gray-500' />
                            <span className='text-sm text-gray-600'>
                              {formatTimestamp(template.start_time)}
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Activity className='w-4 h-4 text-blue-600' />
                            <span className='text-sm text-blue-600 font-medium'>
                              {template.totalClaims} claims
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <button
                          onClick={() =>
                            handlePauseToggle(
                              template.template_id,
                              template.is_paused
                            )
                          }
                          disabled={isProcessing}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                            template.is_paused
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isProcessing
                            ? 'Processing...'
                            : template.is_paused
                            ? 'Unpause'
                            : 'Pause'}
                        </button>

                        <Link
                          to={`/issuer/template/${template.template_id}`}
                          className='flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white text-center transition-all'
                        >
                          View / Issue
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={template.template_id}
                  className='group bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between min-h-[350px]'
                >
                  <div className='relative flex items-center justify-center h-32 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4'>
                    <FileText className='w-12 h-12 text-white' />
                    <span className='absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white'>
                      Tier {template.tier}
                    </span>
                  </div>
                  <h3 className='text-lg font-bold text-gray-900 mb-1'>
                    {template.name ||
                      template.description ||
                      `Template #${template.template_id}`}
                  </h3>
                  <p className='text-xs text-gray-500 mb-2'>
                    Tier {template.tier} • ID #{template.template_id}
                  </p>

                  <div className='flex flex-wrap gap-2 mb-4'>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                        template.is_paused
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-green-100 text-green-800 border-green-200'
                      }`}
                    >
                      {template.is_paused ? (
                        <><Pause className='w-3 h-3' /> Paused</>
                      ) : (
                        <><CheckCircle className='w-3 h-3' /> Active</>
                      )}
                    </span>
                    <span className='flex items-center gap-1 text-sm text-gray-600'>
                      <Users className='w-4 h-4' /> {currentSupply}/{maxSupply}
                    </span>
                    <span className='flex items-center gap-1 text-sm text-blue-600 font-medium'>
                      <Activity className='w-4 h-4' /> {template.totalClaims}{' '}
                      claims
                    </span>
                  </div>

                  <div className='flex gap-3 mt-auto'>
                    <button
                      onClick={() =>
                        handlePauseToggle(
                          template.template_id,
                          template.is_paused
                        )
                      }
                      disabled={isProcessing}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                        template.is_paused
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isProcessing
                        ? 'Processing...'
                        : template.is_paused
                        ? 'Unpause'
                        : 'Pause'}
                    </button>

                    <Link
                      to={`/issuer/template/${template.template_id}`}
                      className='flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white text-center transition-all'
                    >
                      View / Issue
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
