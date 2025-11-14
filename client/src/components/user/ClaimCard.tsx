// components/user/ClaimCard.tsx
import { useState, useEffect } from 'react';
import { type Hex } from 'viem';
import { useReputationCards } from '../../hooks/useReputationCards';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { usePublicClient } from 'wagmi';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../../lib/contracts';
import ReputationCardABI from '../../lib/ReputationCard.abi.json';
import type { Template } from '../../types/template';
import { showCardClaimedNotification, showErrorNotification } from '../../lib/notifications';

export interface ClaimCardProps {
  templateId: bigint;
  nonce: bigint;
  tokenURI: string;
  signature: Hex;
  onSuccess?: (cardId: bigint, txHash: Hex) => void;
  onError?: (error: Error) => void;
}

export function ClaimCard({ 
  templateId, 
  nonce, 
  tokenURI, 
  signature,
  onSuccess,
  onError 
}: ClaimCardProps) {
  const { address, hasProfile, isConnected } = useAuth();
  const { profileId } = useProfile();
  const { claimWithSignature, isProcessing, error: claimError } = useReputationCards();
  const publicClient = usePublicClient();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [claimedCardId, setClaimedCardId] = useState<bigint | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fetch template details
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!publicClient) return;

      try {
        setLoadingTemplate(true);
        const templateData = await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as `0x${string}`,
          abi: ReputationCardABI,
          functionName: 'templates',
          args: [templateId],
        }) as [string, bigint, bigint, number, bigint, bigint, boolean];

        const [issuer, maxSupply, currentSupply, tier, startTime, endTime, isPaused] = templateData;

        setTemplate({
          templateId,
          issuer: issuer as `0x${string}`,
          name: `Template #${templateId}`,
          description: `Tier ${tier} credential`,
          maxSupply,
          currentSupply,
          tier,
          startTime,
          endTime,
          isPaused,
        });
      } catch (err) {
        console.error('Error fetching template:', err);
        setLocalError('Failed to load template information');
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [templateId, publicClient]);

  const handleClaim = async () => {
    if (!address || !profileId || !template) {
      const errorMsg = 'Profile not found. Please create a profile first.';
      setLocalError(errorMsg);
      showErrorNotification('Cannot Claim Card', errorMsg);
      return;
    }

    try {
      setLocalError(null);
      
      const result = await claimWithSignature({
        user: address,
        profileOwner: address,
        templateId,
        nonce,
        tokenURI,
        signature,
      });

      setClaimedCardId(result.cardId);
      
      // Show success notification with confetti
      showCardClaimedNotification(result.cardId, result.txHash);
      
      if (onSuccess) {
        onSuccess(result.cardId, result.txHash);
      }
    } catch (err) {
      const error = err as Error;
      setLocalError(error.message);
      showErrorNotification('Card Claim Failed', error.message);
      
      if (onError) {
        onError(error);
      }
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-bronze-500 text-bronze-900';
      case 2:
        return 'bg-silver-500 text-silver-900';
      case 3:
        return 'bg-gold-500 text-gold-900';
      default:
        return 'bg-gray-500 text-gray-900';
    }
  };

  const getTierName = (tier: number) => {
    switch (tier) {
      case 1:
        return 'Bronze';
      case 2:
        return 'Silver';
      case 3:
        return 'Gold';
      default:
        return 'Unknown';
    }
  };

  if (loadingTemplate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">Loading template information...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Template Not Found</h3>
          <p className="text-red-600">The requested template could not be loaded.</p>
        </div>
      </div>
    );
  }

  if (claimedCardId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Claimed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your reputation card has been minted and attached to your profile.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Card ID</p>
              <p className="text-lg font-mono font-semibold text-gray-900">#{claimedCardId.toString()}</p>
            </div>
            <button
              onClick={() => window.location.href = '/profile'}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              View My Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayError = localError || claimError?.message;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Claim Reputation Card</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(template.tier)}`}>
              {getTierName(template.tier)}
            </span>
          </div>
          <p className="text-gray-600">{template.description}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Template ID:</span>
            <span className="font-semibold text-gray-900">#{template.templateId.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tier:</span>
            <span className="font-semibold text-gray-900">{getTierName(template.tier)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Issuer:</span>
            <span className="font-mono text-sm text-gray-900">
              {template.issuer.slice(0, 6)}...{template.issuer.slice(-4)}
            </span>
          </div>
        </div>

        {!isConnected && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <span className="font-semibold">Connect your wallet</span> to claim this card.
            </p>
          </div>
        )}

        {isConnected && !hasProfile && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <span className="font-semibold">Create a profile</span> before claiming this card.
            </p>
          </div>
        )}

        {template.isPaused && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              <span className="font-semibold">This template is paused</span> and cannot be claimed at this time.
            </p>
          </div>
        )}

        {displayError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-semibold mb-1">Error</h4>
            <p className="text-red-600 text-sm">{displayError}</p>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={!isConnected || !hasProfile || template.isPaused || isProcessing}
          className={`w-full py-3 rounded-md font-medium transition-colors ${
            isConnected && hasProfile && !template.isPaused && !isProcessing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Claiming...
            </span>
          ) : (
            'Claim Card'
          )}
        </button>
      </div>
    </div>
  );
}
