// pages/PublicClaimPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { type Hex } from 'viem';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useReputationCards } from '../hooks/useReputationCards';
import { useTemplates } from '../hooks/useTemplates';
import { parseContractError } from '../lib/errors';
import { showCardClaimedNotification, showErrorNotification } from '../lib/notifications';
import { getPendingCredentialByNonce, updatePendingCredential } from '../lib/kilt/credential-service';
import { getDid } from '../lib/kilt/did-manager';

export const PublicClaimPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, isConnected, hasProfile, connect } = useAuth();
  const { profileId } = useProfile();
  const { claimWithSignature, isProcessing, error: claimError } = useReputationCards();
  const { templates, loading: templatesLoading } = useTemplates();

  const [claimParams, setClaimParams] = useState<{
    templateId: bigint;
    nonce: bigint;
    tokenURI: string;
    signature: Hex;
  } | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimedCardId, setClaimedCardId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse URL parameters on mount
  useEffect(() => {
    try {
      const templateIdParam = searchParams.get('templateId');
      const nonceParam = searchParams.get('nonce');
      const tokenURIParam = searchParams.get('tokenURI');
      const signatureParam = searchParams.get('signature');

      if (!templateIdParam || !nonceParam || !tokenURIParam || !signatureParam) {
        setError('Invalid claim link: Missing required parameters');
        return;
      }

      const parsedParams = {
        templateId: BigInt(templateIdParam),
        nonce: BigInt(nonceParam),
        tokenURI: decodeURIComponent(tokenURIParam),
        signature: signatureParam as Hex,
      };

      setClaimParams(parsedParams);
    } catch (err) {
      console.error('Error parsing URL parameters:', err);
      setError('Invalid claim link: Unable to parse parameters');
    }
  }, [searchParams]);

  // Fetch template information when params are available
  useEffect(() => {
    if (claimParams && templates.length > 0) {
      const foundTemplate = templates.find(
        (t) => t.templateId === claimParams.templateId
      );
      setTemplate(foundTemplate || null);
    }
  }, [claimParams, templates]);

  // Handle claim button click
  const handleClaim = async () => {
    if (!claimParams || !address || !profileId) {
      return;
    }

    try {
      setError(null);

      // Check for duplicate claim (KILT integration)
      // Verify if credential has already been claimed
      try {
        const pendingCredential = await getPendingCredentialByNonce(claimParams.nonce.toString());
        
        if (pendingCredential && pendingCredential.holderDid && pendingCredential.holderDid !== '') {
          // Credential already has a holder - it's been claimed
          setError('This credential has already been claimed');
          showErrorNotification('Claim Failed', 'This credential has already been claimed');
          return;
        }
      } catch (checkError) {
        console.error('[PublicClaimPage] Error checking credential status:', checkError);
        // Continue with claim if check fails - don't block on KILT errors
      }

      const result = await claimWithSignature({
        user: address,
        profileOwner: address,
        templateId: claimParams.templateId,
        nonce: claimParams.nonce,
        tokenURI: claimParams.tokenURI,
        signature: claimParams.signature,
      });

      setClaimedCardId(result.cardId);
      setClaimSuccess(true);
      
      // Show success notification with confetti
      showCardClaimedNotification(result.cardId, result.txHash);

      // Update pending verifiable credential (KILT integration)
      // This is wrapped in try-catch to not block the claim success flow
      try {
        console.log('[PublicClaimPage] Updating pending credential...');

        // Retrieve pending credential by nonce
        const pendingCredential = await getPendingCredentialByNonce(claimParams.nonce.toString());

        if (pendingCredential) {
          // Get user's DID
          const userDid = await getDid(address, false);

          if (userDid) {
            // Update credential with holder DID and card ID
            await updatePendingCredential(
              pendingCredential.credentialId,
              userDid.uri,
              result.cardId.toString()
            );

            console.log('[PublicClaimPage] Credential updated successfully');
          } else {
            console.log('[PublicClaimPage] User DID not found, credential not updated');
          }
        } else {
          console.log('[PublicClaimPage] No pending credential found for this claim');
        }
      } catch (kiltError) {
        console.error('[PublicClaimPage] Failed to update credential:', kiltError);
        // Don't block the claim success - credential update is optional
      }
    } catch (err) {
      console.error('Error claiming card:', err);
      const parsed = parseContractError(err);
      setError(parsed.message);
      showErrorNotification('Card Claim Failed', parsed.message);
    }
  };

  // Loading state
  if (!claimParams || templatesLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading claim information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !claimParams) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Claim Link</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (claimSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Card Claimed Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your reputation card has been added to your profile.
            </p>
            {claimedCardId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Card ID</p>
                <p className="font-mono text-lg text-gray-900">{claimedCardId.toString()}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View My Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main claim interface
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Claim Your Reputation Card
        </h1>

        {/* Template Information */}
        {template ? (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{template.name}</h2>
            <p className="text-gray-700 mb-4">{template.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Tier</p>
                <p className="text-2xl font-bold text-blue-600">Tier {template.tier}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Issuer</p>
                <p className="text-xs font-mono text-gray-900 truncate">
                  {template.issuer.slice(0, 6)}...{template.issuer.slice(-4)}
                </p>
              </div>
            </div>

            {template.isPaused && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ This template is currently paused
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <p className="text-gray-600 text-center">Loading template information...</p>
          </div>
        )}

        {/* Wallet Connection */}
        {!isConnected ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">Connect your wallet to claim this card</p>
            <button
              onClick={connect}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Connect Wallet
            </button>
          </div>
        ) : !hasProfile ? (
          <div className="text-center">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
              <p className="text-orange-800 font-medium mb-2">Profile Required</p>
              <p className="text-orange-700 text-sm">
                You need to create a profile before claiming reputation cards.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-lg"
            >
              Create Profile
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✓ Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <p className="text-sm text-green-800">
                ✓ Profile found
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium mb-1">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {claimError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium mb-1">Claim Failed</p>
                <p className="text-red-700 text-sm">{claimError.message}</p>
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={isProcessing || template?.isPaused}
              className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
                isProcessing || template?.isPaused
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Claiming...
                </span>
              ) : template?.isPaused ? (
                'Template Paused'
              ) : (
                'Claim Card'
              )}
            </button>

            {template?.isPaused && (
              <p className="text-sm text-gray-600 mt-3">
                This template is currently paused. Please try again later.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
