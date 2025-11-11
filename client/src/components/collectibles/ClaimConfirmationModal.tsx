/**
 * ClaimConfirmationModal - Confirmation dialog for claiming a collectible
 * Shows transaction summary, gas estimate, and handles the claim process
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RarityIndicator, 
  CelebrationAnimation 
} from '@/components/shared';
import { useCollectibleClaim } from '@/hooks/useCollectibleClaim';
import type { CollectibleTemplate, GasEstimate } from '@/types/collectible';
import {
  Sparkles,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClaimConfirmationModalProps {
  template: CollectibleTemplate;
  gasEstimate: GasEstimate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  claimStatus?: any; // ClaimStatus from useClaimStatus
}

export function ClaimConfirmationModal({
  template,
  gasEstimate,
  open,
  onOpenChange,
  onSuccess,
  claimStatus,
}: ClaimConfirmationModalProps) {
  const { claim, claimingState, txHash, cardId, error } = useCollectibleClaim();
  const [showCelebration, setShowCelebration] = useState(false);

  const { category, description, rarityTier, value } = template;

  const isHighGas = gasEstimate && parseFloat(gasEstimate.gasCostEth) > 0.01;

  const handleConfirm = async () => {
    // Check eligibility before claiming
    if (claimStatus && !claimStatus.canClaimNow) {
      return;
    }

    const result = await claim(template.templateId);
    
    if (result) {
      setShowCelebration(true);
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    }
  };

  const handleCancel = () => {
    if (claimingState !== 'claiming') {
      onOpenChange(false);
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `https://etherscan.io/tx/${hash}`;
  };

  const renderSuccessState = () => (
    <>
      {showCelebration && <CelebrationAnimation rarity={rarityTier} />}
      
      <DialogHeader>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <DialogTitle className="text-center text-2xl">
          Collectible Claimed!
        </DialogTitle>
        <DialogDescription className="text-center">
          You've successfully claimed this collectible
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold mb-1 truncate">{category}</div>
                <div className="text-sm text-muted-foreground truncate">{description}</div>
                <div className="mt-2">
                  <RarityIndicator rarity={rarityTier} size="sm" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Card ID</div>
          <div className="text-2xl font-bold text-primary">#{cardId}</div>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Transaction Hash</div>
            <div className="font-mono text-xs break-all">{txHash}</div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => txHash && window.open(getExplorerUrl(txHash), '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
          <Button
            className="flex-1"
            onClick={() => window.location.href = '/dashboard'}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Card
          </Button>
        </div>
      </div>
    </>
  );

  const renderErrorState = () => (
    <>
      <DialogHeader>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <DialogTitle className="text-center text-2xl">
          Claim Failed
        </DialogTitle>
        <DialogDescription className="text-center">
          There was an error claiming the collectible
        </DialogDescription>
      </DialogHeader>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || 'An unknown error occurred'}
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button variant="outline" onClick={handleCancel}>
          Close
        </Button>
        <Button onClick={handleConfirm}>
          Try Again
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirmationState = () => (
    <>
      <DialogHeader>
        <DialogTitle>
          {claimingState === 'claiming' ? 'Claiming Collectible' : 'Confirm Claim'}
        </DialogTitle>
        <DialogDescription>
          {claimingState === 'claiming' 
            ? 'Please confirm the transaction in your wallet'
            : 'Review the details before claiming this collectible'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Show transaction status during claiming */}
        {claimingState === 'claiming' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Waiting for wallet confirmation... Please check your wallet to approve the transaction.
            </AlertDescription>
          </Alert>
        )}

        {/* Show eligibility warning if not eligible */}
        {claimStatus && !claimStatus.canClaimNow && claimingState !== 'claiming' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {claimStatus.reason || 'You are not eligible to claim this collectible'}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold mb-1 truncate">{category}</div>
                <div className="text-sm text-muted-foreground truncate">{description}</div>
                <div className="mt-2 flex items-center gap-2">
                  <RarityIndicator rarity={rarityTier} size="sm" />
                  <Badge variant="outline" className="text-xs">
                    +{value} Rep
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {gasEstimate && (
          <Card className={cn(
            'border-2',
            isHighGas && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
          )}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Gas Fee:</span>
                  <span className="font-bold">{gasEstimate.gasCostEth} ETH</span>
                </div>
                {gasEstimate.gasCostUsd && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">USD Equivalent:</span>
                    <span className="text-sm font-medium">${gasEstimate.gasCostUsd}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isHighGas && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Gas fees are currently high. You may want to wait for lower fees.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This transaction will mint the collectible NFT to your wallet</p>
          <p>• You will pay gas fees to complete the transaction</p>
          <p>• The collectible will appear in your collection immediately</p>
          <p>• Your reputation score will increase by +{value}</p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={claimingState === 'claiming'}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={claimingState === 'claiming' || (claimStatus && !claimStatus.canClaimNow)}
        >
          {claimingState === 'claiming' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            'Confirm & Claim'
          )}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {claimingState === 'success' && txHash && cardId !== null && renderSuccessState()}
        {claimingState === 'error' && error && renderErrorState()}
        {(claimingState === 'idle' || claimingState === 'claiming' || claimingState === 'estimating') && renderConfirmationState()}
      </DialogContent>
    </Dialog>
  );
}
