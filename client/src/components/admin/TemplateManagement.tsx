import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractWrite, useWaitForTransaction, useContractRead, useContractEvent } from 'wagmi';
import { type Address } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardAbi from '../../lib/ReputationCard.abi.json';

interface Template {
  templateId: bigint;
  issuer: Address;
  maxSupply: bigint;
  currentSupply: bigint;
  tier: number;
  startTime: bigint;
  endTime: bigint;
  isPaused: boolean;
}

export const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [templateIds, setTemplateIds] = useState<bigint[]>([]);

  // Pause/unpause template hook
  const {
    data: pauseData,
    write: setPausedWrite,
    isLoading: isPausing,
    error: pauseError,
  } = useContractWrite({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    functionName: 'setTemplatePaused',
  });

  // Wait for pause transaction
  const { isLoading: isPauseConfirming, isSuccess: isPauseSuccess } = useWaitForTransaction({
    hash: pauseData?.hash,
  });

  // Listen for TemplatePaused events
  useContractEvent({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardAbi,
    eventName: 'TemplatePaused',
    listener(logs) {
      const log = logs[0];
      if (log && log.args) {
        const templateId = log.args.templateId;
        const isPaused = log.args.isPaused;
        setSuccessMessage(
          `Template ${templateId?.toString()} ${isPaused ? 'paused' : 'unpaused'} successfully`
        );
        // Refresh templates
        fetchTemplates();
      }
    },
  });

  // Fetch templates - we'll try template IDs 0-99
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedTemplates: Template[] = [];
      const ids: bigint[] = [];

      // Try to fetch templates with IDs 0-99
      // In production, you'd want to index TemplateCreated events or store IDs in Supabase
      for (let i = 0; i < 100; i++) {
        try {
          // We'll need to use a different approach since we can't directly call contract reads in a loop
          // For now, we'll just add template IDs that we know exist
          // In production, this would be fetched from indexed events or Supabase
          ids.push(BigInt(i));
        } catch (err) {
          // Template doesn't exist, continue
          break;
        }
      }

      setTemplateIds(ids);
      setTemplates(fetchedTemplates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleTogglePause = async (templateId: bigint, currentPauseState: boolean) => {
    setSuccessMessage(null);
    setError(null);

    try {
      setPausedWrite({
        args: [templateId, !currentPauseState],
      });
    } catch (err) {
      console.error('Error toggling pause state:', err);
      setError('Failed to update template pause state');
    }
  };

  // Component to fetch and display individual template
  const TemplateCard: React.FC<{ templateId: bigint }> = ({ templateId }) => {
    const { data: templateData, isLoading: isLoadingTemplate } = useContractRead({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardAbi,
      functionName: 'templates',
      args: [templateId],
    });

    if (isLoadingTemplate) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }

    if (!templateData || templateData[0] === '0x0000000000000000000000000000000000000000') {
      // Template doesn't exist (issuer is zero address)
      return null;
    }

    const template: Template = {
      templateId,
      issuer: templateData[0] as Address,
      maxSupply: templateData[1] as bigint,
      currentSupply: templateData[2] as bigint,
      tier: Number(templateData[3]),
      startTime: templateData[4] as bigint,
      endTime: templateData[5] as bigint,
      isPaused: templateData[6] as boolean,
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Template #{template.templateId.toString()}</h3>
            <p className="text-sm text-gray-500 mt-1">Tier {template.tier}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                template.isPaused ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}
            >
              {template.isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Issuer:</span>
            <span className="font-mono text-gray-900 text-xs">{template.issuer}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Supply:</span>
            <span className="text-gray-900">
              {template.currentSupply.toString()} / {template.maxSupply.toString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Start Time:</span>
            <span className="text-gray-900">
              {template.startTime === 0n
                ? 'Immediate'
                : new Date(Number(template.startTime) * 1000).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">End Time:</span>
            <span className="text-gray-900">
              {template.endTime === 0n
                ? 'No expiration'
                : new Date(Number(template.endTime) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  template.maxSupply > 0n
                    ? (Number(template.currentSupply) / Number(template.maxSupply)) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => handleTogglePause(template.templateId, template.isPaused)}
          disabled={isPausing || isPauseConfirming}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            template.isPaused
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          } disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {isPausing || isPauseConfirming ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isPausing ? 'Updating...' : 'Confirming...'}
            </span>
          ) : template.isPaused ? (
            'Unpause Template'
          ) : (
            'Pause Template'
          )}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Admin Dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
        <p className="text-gray-600 mt-2">Manage template pause states and view details</p>
      </div>

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

      {(error || pauseError) && (
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
              {pauseError?.message.includes('AccessControl') || pauseError?.message.includes('Unauthorized')
                ? 'You do not have permission to manage templates'
                : error || 'Failed to update template. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templateIds.map((id) => (
          <TemplateCard key={id.toString()} templateId={id} />
        ))}
      </div>

      {templateIds.length === 0 && (
        <div className="text-center py-12">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-gray-600">No templates found</p>
          <p className="text-sm text-gray-500 mt-2">Create a new template to get started</p>
        </div>
      )}
    </div>
  );
};
