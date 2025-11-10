/**
 * EligibilityChecker - Display component for showing eligibility requirements and user status
 * Shows checkmarks/X marks for each requirement with helpful messages
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CollectibleTemplate, ClaimStatus } from '@/types/collectible';
import { EligibilityType } from '@/types/collectible';
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EligibilityCheckerProps {
  template: CollectibleTemplate;
  claimStatus: ClaimStatus;
  userAddress: string;
}

export function EligibilityChecker({
  template,
  claimStatus,
  userAddress,
}: EligibilityCheckerProps) {
  const { eligibilityType, startTime, endTime, maxSupply, currentSupply, isPaused } = template;
  const { isEligible, hasClaimed, canClaimNow, reason } = claimStatus;

  const now = Math.floor(Date.now() / 1000);
  const hasStarted = startTime === 0 || now >= startTime;
  const hasNotEnded = endTime === 0 || now <= endTime;
  const hasSupply = maxSupply === 0 || currentSupply < maxSupply;

  const requirements = [
    {
      label: 'Wallet Connected',
      met: !!userAddress,
      message: userAddress ? 'Wallet connected' : 'Please connect your wallet',
      action: !userAddress ? { label: 'Connect Wallet', onClick: () => {} } : undefined,
    },
    {
      label: 'Eligibility Criteria',
      met: isEligible,
      message: isEligible
        ? getEligibilityMessage(eligibilityType)
        : reason || 'You do not meet the eligibility requirements',
      action: !isEligible && eligibilityType === EligibilityType.PROFILE_REQUIRED
        ? { label: 'Create Profile', onClick: () => window.location.href = '/dashboard' }
        : undefined,
    },
    {
      label: 'Claiming Period',
      met: hasStarted && hasNotEnded,
      message: !hasStarted
        ? `Claiming starts ${new Date(startTime * 1000).toLocaleString()}`
        : !hasNotEnded
        ? `Claiming ended ${new Date(endTime * 1000).toLocaleString()}`
        : 'Claiming period is active',
    },
    {
      label: 'Supply Available',
      met: hasSupply,
      message: hasSupply
        ? maxSupply === 0
          ? 'Unlimited supply'
          : `${maxSupply - currentSupply} remaining`
        : 'All collectibles have been claimed',
    },
    {
      label: 'Not Paused',
      met: !isPaused,
      message: isPaused ? 'Claiming is temporarily paused' : 'Claiming is active',
    },
    {
      label: 'Not Already Claimed',
      met: !hasClaimed,
      message: hasClaimed ? 'You have already claimed this collectible' : 'You have not claimed yet',
    },
  ];

  function getEligibilityMessage(type: EligibilityType): string {
    switch (type) {
      case EligibilityType.OPEN:
        return 'Open to all users';
      case EligibilityType.WHITELIST:
        return 'You are on the whitelist';
      case EligibilityType.TOKEN_HOLDER:
        return 'You hold the required tokens';
      case EligibilityType.PROFILE_REQUIRED:
        return 'You have a TrustFi profile';
      default:
        return 'Eligibility verified';
    }
  }

  return (
    <div className="space-y-3">
      {requirements.map((req, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border',
            req.met ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
          )}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {req.met ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm mb-1">{req.label}</div>
            <div className="text-xs text-muted-foreground">{req.message}</div>
            
            {/* Action Button */}
            {req.action && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={req.action.onClick}
              >
                {req.action.label}
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Overall Status */}
      <div className="pt-2">
        {canClaimNow ? (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="w-4 h-4" />
            You can claim this collectible
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="w-4 h-4" />
            {reason || 'Requirements not met'}
          </Badge>
        )}
      </div>
    </div>
  );
}
