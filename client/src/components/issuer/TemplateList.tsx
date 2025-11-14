import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTemplates } from '../../hooks/useTemplates';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import type { Template } from '../../types/template';

interface TemplateWithClaims extends Template {
  totalClaims: number;
}

export const TemplateList: React.FC = () => {
  const { address, isIssuer, isLoading: authLoading } = useAuth();
  const { templates, loading: templatesLoading, pauseTemplate } = useTemplates();
  const [templatesWithClaims, setTemplatesWithClaims] = useState<TemplateWithClaims[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pausingTemplate, setPausingTemplate] = useState<bigint | null>(null);

  // Filter templates where issuer matches connected wallet
  const issuerTemplates = templates.filter(
    (template) => template.issuer.toLowerCase() === address?.toLowerCase()
  );

  useEffect(() => {
    const fetchClaimCounts = async () => {
      if (issuerTemplates.length === 0) {
        setTemplatesWithClaims([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const templateIds = issuerTemplates.map((t) => t.templateId.toString());

        // Get claim counts for each template
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims_log')
          .select('template_id')
          .in('template_id', templateIds);

        if (claimsError) throw claimsError;

        // Count claims per template
        const claimCounts: Record<string, number> = {};
        templateIds.forEach((id) => {
          claimCounts[id] = 0;
        });

        claimsData?.forEach((claim) => {
          if (claimCounts[claim.template_id] !== undefined) {
            claimCounts[claim.template_id]++;
          }
        });

        // Combine templates with claim counts
        const templatesWithClaimsData = issuerTemplates.map((template) => ({
          ...template,
          totalClaims: claimCounts[template.templateId.toString()] || 0,
        }));

        setTemplatesWithClaims(templatesWithClaimsData);
      } catch (err) {
        console.error('Error fetching claim counts:', err);
        setError('Failed to load template data');
      } finally {
        setLoading(false);
      }
    };

    if (isIssuer && !authLoading && !templatesLoading) {
      fetchClaimCounts();
    }
  }, [isIssuer, authLoading, templatesLoading, issuerTemplates.length, address]);

  const handlePauseToggle = async (templateId: bigint, currentPauseState: boolean) => {
    try {
      setPausingTemplate(templateId);
      setError(null);
      await pauseTemplate(templateId, !currentPauseState);
      // The templates will be refreshed automatically by the hook
    } catch (err: any) {
      console.error('Error toggling template pause state:', err);
      setError(err.message || 'Failed to update template pause state');
    } finally {
      setPausingTemplate(null);
    }
  };

  const formatTimestamp = (timestamp: bigint): string => {
    if (timestamp === 0n) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  if (authLoading || templatesLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
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
            You do not have issuer permissions to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Templates</h1>
            <p className="text-gray-600 mt-2">Manage your credential templates</p>
          </div>
          <Link
            to="/issuer"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {templatesWithClaims.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-2 text-gray-600">
              You don't have any templates yet. Contact an admin to create templates for you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {templatesWithClaims.map((template) => (
              <div
                key={template.templateId.toString()}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Template #{template.templateId.toString()}
                        </h3>
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            template.isPaused
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {template.isPaused ? 'Paused' : 'Active'}
                        </span>
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                          Tier {template.tier}
                        </span>
                      </div>
                      <p className="text-gray-600">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSelectedTemplate(
                            selectedTemplate?.templateId === template.templateId ? null : template
                          )
                        }
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {selectedTemplate?.templateId === template.templateId
                          ? 'Hide Details'
                          : 'Show Details'}
                      </button>
                      <Link
                        to={`/issuer/issue?templateId=${template.templateId}`}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Issue Card
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Supply</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.currentSupply.toString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Supply</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {template.maxSupply.toString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Claims</p>
                      <p className="text-lg font-semibold text-gray-900">{template.totalClaims}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(template.maxSupply - template.currentSupply).toString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Pause Template:</span>
                      <button
                        onClick={() => handlePauseToggle(template.templateId, template.isPaused)}
                        disabled={pausingTemplate === template.templateId}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          template.isPaused ? 'bg-red-600' : 'bg-green-600'
                        } ${pausingTemplate === template.templateId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            template.isPaused ? 'translate-x-1' : 'translate-x-6'
                          }`}
                        />
                      </button>
                      {pausingTemplate === template.templateId && (
                        <span className="text-sm text-gray-600">Updating...</span>
                      )}
                    </div>
                  </div>

                  {selectedTemplate?.templateId === template.templateId && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Template ID</p>
                          <p className="text-gray-900 font-mono">{template.templateId.toString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Issuer Address</p>
                          <p className="text-gray-900 font-mono text-sm break-all">
                            {template.issuer}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Start Time</p>
                          <p className="text-gray-900">{formatTimestamp(template.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">End Time</p>
                          <p className="text-gray-900">{formatTimestamp(template.endTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Claims</p>
                          <p className="text-gray-900">{template.totalClaims}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="text-gray-900">
                            {template.isPaused ? 'Paused' : 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
