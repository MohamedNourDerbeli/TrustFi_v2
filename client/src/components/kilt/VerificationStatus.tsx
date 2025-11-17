/**
 * VerificationStatus Component
 * 
 * Displays detailed verification information for a verifiable credential.
 * Shows validity status, issuer/holder DIDs, revocation status, and any errors/warnings.
 */

import { Check, X, AlertTriangle, Shield, User, Building2 } from 'lucide-react';
import type { VerificationResult } from '../../types/kilt';

interface VerificationStatusProps {
  verificationResult: VerificationResult;
  showDetails?: boolean;
}

export function VerificationStatus({ 
  verificationResult, 
  showDetails = true 
}: VerificationStatusProps) {
  const { valid, issuerDid, holderDid, revoked, errors, warnings } = verificationResult;

  // Determine overall status
  const getStatusConfig = () => {
    if (revoked) {
      return {
        icon: AlertTriangle,
        text: 'Revoked',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
      };
    }

    if (!valid) {
      return {
        icon: X,
        text: 'Invalid',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      };
    }

    return {
      icon: Check,
      text: 'Valid',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} p-4`}>
      {/* Status Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
          <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${statusConfig.textColor}`}>
            {statusConfig.text}
          </h3>
          <p className="text-sm text-gray-600">
            Credential verification status
          </p>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-3">
          {/* Issuer DID */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 mb-1">Issuer DID</p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {issuerDid || 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Holder DID */}
          {holderDid && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Holder DID</p>
                  <p className="text-xs font-mono text-gray-600 break-all">
                    {holderDid}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Revocation Status */}
          {revoked && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-yellow-800 mb-1">
                    Revocation Notice
                  </p>
                  <p className="text-xs text-yellow-700">
                    This credential has been revoked by the issuer and is no longer valid.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors && errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-800 mb-2">
                    Verification Errors
                  </p>
                  <ul className="space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx} className="text-xs text-red-700 flex items-start gap-1">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">
                    Warnings
                  </p>
                  <ul className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="text-xs text-yellow-700 flex items-start gap-1">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Valid Status Info */}
          {valid && !revoked && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-800 mb-1">
                    Cryptographically Verified
                  </p>
                  <p className="text-xs text-green-700">
                    This credential has been verified and is cryptographically valid. 
                    The signature matches the issuer's DID and the credential has not been revoked.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact View */}
      {!showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${statusConfig.textColor}`}>
              {statusConfig.text}
            </span>
            {revoked && (
              <span className="text-xs text-yellow-600">(Revoked)</span>
            )}
          </div>
          {(errors && errors.length > 0) && (
            <span className="text-xs text-red-600">
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge version for inline display
 */
interface VerificationBadgeProps {
  verificationResult: VerificationResult;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ 
  verificationResult, 
  size = 'md' 
}: VerificationBadgeProps) {
  const { valid, revoked } = verificationResult;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  if (revoked) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-yellow-100 text-yellow-800 rounded-full font-semibold`}>
        <AlertTriangle className={iconSizes[size]} />
        Revoked
      </span>
    );
  }

  if (!valid) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-red-100 text-red-800 rounded-full font-semibold`}>
        <X className={iconSizes[size]} />
        Invalid
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-green-100 text-green-800 rounded-full font-semibold`}>
      <Check className={iconSizes[size]} />
      Verified
    </span>
  );
}
