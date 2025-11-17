import { useState, useEffect } from 'react';
import { Check, Shield, AlertCircle, Info, X, Loader2, Trash2 } from 'lucide-react';
import type { VerifiableCredential, VerificationResult } from '../../types/kilt';
import type { Card } from '../../types/card';
import { verifyCredential, revokeCredential } from '../../lib/kilt/credential-service';
import { VerificationStatus } from '../kilt/VerificationStatus';

interface CredentialBadgeProps {
  card: Card;
  credential?: VerifiableCredential;
  compact?: boolean;
}

// Cache for verification results to avoid repeated checks
const verificationCache = new Map<string, VerificationResult>();

export function CredentialBadge({ card, credential }: CredentialBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  useEffect(() => {
    if (!credential) return;

    // Check cache first
    const cached = verificationCache.get(credential.credentialId);
    if (cached) {
      setVerificationResult(cached);
      return;
    }

    // Verify credential on mount
    const verify = async () => {
      setIsVerifying(true);
      try {
        // Convert VerifiableCredential to SignedCredential format for verification
        const signedCredential = {
          claim: {
            cTypeHash: credential.cTypeHash,
            contents: {
              ...credential.claim,
              holder_did: credential.holderDid,
            },
            owner: credential.issuerDid,
          },
          claimerSignature: {
            signature: credential.signature,
            keyUri: `${credential.issuerDid}#authentication`,
          },
        };

        const result = await verifyCredential(signedCredential);
        
        // Cache the result
        verificationCache.set(credential.credentialId, result);
        setVerificationResult(result);
      } catch (error) {
        console.error('[CredentialBadge] Verification failed:', error);
        // Set a failed verification result
        const failedResult: VerificationResult = {
          valid: false,
          issuerDid: credential.issuerDid,
          holderDid: credential.holderDid,
          revoked: false,
          errors: ['Verification failed'],
        };
        setVerificationResult(failedResult);
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [credential]);

  if (!credential) {
    return null;
  }

  const isRevoked = credential.revoked || verificationResult?.revoked || false;
  const isValid = verificationResult?.valid && !isRevoked;
  const issueDate = new Date(credential.createdAt);

  // Determine badge appearance based on verification status
  const getBadgeConfig = () => {
    if (isVerifying) {
      return {
        icon: Loader2,
        text: 'Verifying...',
        bgColor: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-600',
        iconClass: 'animate-spin',
      };
    }
    
    if (isRevoked) {
      return {
        icon: AlertCircle,
        text: 'REVOKED',
        bgColor: 'bg-red-500',
        hoverColor: 'hover:bg-red-600',
        iconClass: '',
      };
    }
    
    if (verificationResult && !isValid) {
      return {
        icon: X,
        text: 'Invalid',
        bgColor: 'bg-red-500',
        hoverColor: 'hover:bg-red-600',
        iconClass: '',
      };
    }
    
    if (verificationResult && isValid) {
      return {
        icon: Check,
        text: 'Verified',
        bgColor: 'bg-green-500',
        hoverColor: 'hover:bg-green-600',
        iconClass: '',
      };
    }
    
    // Default: verification pending or unknown
    return {
      icon: AlertCircle,
      text: 'Pending',
      bgColor: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      iconClass: '',
    };
  };

  const badgeConfig = getBadgeConfig();
  const BadgeIcon = badgeConfig.icon;

  const canRevoke = !isRevoked && credential && credential.issuerDid && credential.issuerDid === verificationResult?.issuerDid;

  const handleRevoke = async () => {
    if (!credential) return;
    setIsRevoking(true);
    setRevokeError(null);
    try {
      await revokeCredential(credential.credentialId);
      // Update cached verification result
      const updated: VerificationResult = {
        valid: false,
        issuerDid: verificationResult?.issuerDid || credential.issuerDid,
        holderDid: verificationResult?.holderDid || credential.holderDid,
        revoked: true,
        errors: ['Credential revoked']
      };
      verificationCache.set(credential.credentialId, updated);
      setVerificationResult(updated);
    } catch (e: any) {
      setRevokeError(e.message || 'Failed to revoke credential');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    // Added z-20 to ensure badge overlays above card image
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
      <div className="absolute top-2 right-2 z-10 pointer-events-auto">
        <div 
          className={`flex items-center gap-1 ${badgeConfig.bgColor} text-white px-2 py-1 rounded-lg shadow-lg cursor-pointer ${badgeConfig.hoverColor} transition-colors`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <BadgeIcon className={`w-3.5 h-3.5 ${badgeConfig.iconClass}`} />
          <span className="text-xs font-semibold">{badgeConfig.text}</span>
        </div>
      </div>

      {showDetails && (
        <div className="absolute top-14 right-2 z-20 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 pointer-events-auto max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Credential Details</h3>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Verification Status */}
            {isVerifying ? (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-semibold text-blue-800">Verifying credential...</span>
                </div>
              </div>
            ) : verificationResult ? (
              <VerificationStatus verificationResult={verificationResult} showDetails={true} />
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Verification pending</span>
                </div>
              </div>
            )}

            {/* Issue Date */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Issue Date</p>
              <p className="text-sm text-gray-600">
                {issueDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Credential ID */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">Credential ID</p>
              <div className="bg-gray-50 rounded-lg p-2 break-all">
                <p className="text-xs font-mono text-gray-600">
                  {credential.credentialId}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                This credential is cryptographically signed and verifiable on the KILT blockchain.
              </p>
            </div>

            {/* Revoke Section */}
            {canRevoke && (
              <div className="bg-red-50 rounded-lg p-3 border border-red-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">Issuer Actions</span>
                </div>
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className={`w-full text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${isRevoking ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  {isRevoking ? 'Revoking...' : 'Revoke Credential'}
                </button>
                {revokeError && <p className="text-xs text-red-700">{revokeError}</p>}
                <p className="text-[10px] text-red-600">Revocation marks the credential invalid for future verifications.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
