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
import { Award, Check, X, AlertCircle, Wallet, UserCircle, Sparkles, Gift } from 'lucide-react';

export const PublicClaimPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { address, isConnected, hasProfile, connect } = useAuth();
  const { profileId } = useProfile();
  const { claimWithSignature, isProcessing, error: claimError } = useReputationCards();
  // Include all templates (even paused/expired) so claims from older links still work
  const { templates, loading: templatesLoading } = useTemplates(undefined, true);

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
      console.log('[PublicClaimPage] Searching for template:', claimParams.templateId.toString());
      console.log('[PublicClaimPage] Available templates:', templates.map(t => ({ id: t.templateId.toString(), name: t.name })));
      
      const foundTemplate = templates.find(
        (t) => t.templateId === claimParams.templateId
      );
      
      console.log('[PublicClaimPage] Found template:', foundTemplate);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-2 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <Gift className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded-full w-3/4 mx-auto animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded-full w-1/2 mx-auto animate-pulse"></div>
              </div>
              <p className="text-gray-600 mt-6 font-medium">Loading your reward...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !claimParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
            <div className="text-center">
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                <X className="w-10 h-10 text-red-600 relative z-10" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">
                Invalid Claim Link
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  Go to Home
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (claimSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
            <div className="text-center">
              {/* Success Animation */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full animate-scaleIn"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-12 h-12 text-white animate-checkmark" strokeWidth={4} />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
              </div>
              
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Claimed Successfully!
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                🎉 Your reputation card has been added to your profile.
              </p>
              
              {claimedCardId && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-8 border border-gray-200 shadow-inner">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-700">Card ID</p>
                  </div>
                  <p className="font-mono text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    #{claimedCardId.toString()}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="group w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    View My Profile
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main claim interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Claim Your Reward
          </h1>
          <p className="text-gray-600 text-lg">Unlock your exclusive reputation card</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Template Information */}
          {template ? (
            <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-8 text-white">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-24 -translate-x-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-6 h-6" />
                      <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        Tier {template.tier}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{template.name}</h2>
                    <p className="text-white/90 leading-relaxed">{template.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <p className="text-white/70 text-sm mb-1">Tier Level</p>
                    <p className="text-3xl font-bold">Tier {template.tier}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <p className="text-white/70 text-sm mb-1">Issuer</p>
                    <p className="text-sm font-mono truncate">
                      {template.issuer.slice(0, 8)}...{template.issuer.slice(-6)}
                    </p>
                  </div>
                </div>

                {template.isPaused && (
                  <div className="mt-4 bg-yellow-500/20 border border-yellow-300/30 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-300" />
                      <p className="text-sm font-medium text-yellow-100">
                        This template is currently paused
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : templatesLoading ? (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-300 rounded-xl"></div>
                  <div className="h-20 bg-gray-300 rounded-xl"></div>
                </div>
              </div>
            </div>
          ) : claimParams ? (
            <div className="relative bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 p-8 text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-6 h-6" />
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    Template #{claimParams.templateId.toString()}
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Reputation Card</h2>
                <p className="text-white/90 leading-relaxed">Loading template details...</p>
              </div>
            </div>
          ) : null}

          {/* Claim Actions */}
          <div className="p-8">
            {!isConnected ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-2">
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-600 mb-6">Sign in to claim your reputation card</p>
                </div>
                <button
                  onClick={connect}
                  className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-3">
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </span>
                </button>
              </div>
            ) : !hasProfile ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl mb-2">
                  <UserCircle className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Profile</h3>
                  <p className="text-gray-600 mb-6">You need a profile to start collecting reputation cards</p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="group px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-3">
                    <UserCircle className="w-5 h-5" />
                    Create Profile
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Connected Status */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-green-700" />
                        <p className="text-sm font-semibold text-green-900">Wallet Connected</p>
                      </div>
                      <p className="text-sm text-green-700 font-mono truncate">
                        {address?.slice(0, 10)}...{address?.slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Messages */}
                {(error || claimError) && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 animate-shake">
                    <div className="flex gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 mb-1">Unable to Claim</p>
                        <p className="text-sm text-red-700">
                          {error || claimError?.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim Button */}
                <button
                  onClick={handleClaim}
                  disabled={isProcessing || template?.isPaused}
                  className={`group w-full px-8 py-5 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg relative overflow-hidden ${
                    isProcessing || template?.isPaused
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl transform hover:-translate-y-1'
                  }`}
                >
                  {!isProcessing && !template?.isPaused && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  
                  <span className="relative flex items-center justify-center gap-3">
                    {isProcessing ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing Claim...
                      </>
                    ) : template?.isPaused ? (
                      <>
                        <AlertCircle className="w-6 h-6" />
                        Template Paused
                      </>
                    ) : (
                      <>
                        <Gift className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        Claim My Card
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </span>
                </button>

                {template?.isPaused && (
                  <p className="text-center text-sm text-gray-500">
                    This template is currently paused. Please try again later.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by TrustFi • Secure blockchain-based reputation system
          </p>
        </div>
      </div>
    </div>
  );
};
