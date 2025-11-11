import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Wallet,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransactionStatusType = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface TransactionStatusProps {
  status: TransactionStatusType;
  message?: string;
  txHash?: string;
  error?: string;
  onClose?: () => void;
  open?: boolean;
  title?: string;
  successMessage?: string;
  explorerUrl?: string;
}

/**
 * TransactionStatus component to show blockchain transaction progress
 * Provides clear visual feedback for all transaction states
 */
export function TransactionStatus({
  status,
  message,
  txHash,
  error,
  onClose,
  open = true,
  title = 'Transaction',
  successMessage = 'Transaction completed successfully',
  explorerUrl,
}: TransactionStatusProps) {
  // Calculate progress based on status
  const getProgress = () => {
    switch (status) {
      case 'idle':
        return 0;
      case 'pending':
        return 33;
      case 'confirming':
        return 66;
      case 'success':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Wallet className="h-8 w-8 text-primary animate-pulse" />;
      case 'confirming':
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (message) return message;

    switch (status) {
      case 'pending':
        return 'Please confirm the transaction in your wallet';
      case 'confirming':
        return 'Transaction submitted. Waiting for confirmation...';
      case 'success':
        return successMessage;
      case 'error':
        return error || 'Transaction failed';
      default:
        return 'Preparing transaction...';
    }
  };

  // Get explorer link if available
  const getExplorerLink = () => {
    if (!txHash) return null;

    const baseUrl = explorerUrl || 'https://moonbase.moonscan.io/tx/';
    return `${baseUrl}${txHash}`;
  };

  // Don't show dialog for idle state
  if (status === 'idle') return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {status === 'success' ? 'Your transaction has been processed' : 'Processing your transaction'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Icon */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          {/* Progress Bar */}
          {status !== 'error' && status !== 'success' && (
            <div className="space-y-2">
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Confirming</span>
                <span>{getProgress()}%</span>
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className="text-center space-y-2">
            <p className={cn(
              "text-sm font-medium",
              status === 'error' && "text-destructive",
              status === 'success' && "text-green-600"
            )}>
              {getStatusMessage()}
            </p>

            {/* Additional context for pending state */}
            {status === 'pending' && (
              <Alert className="text-left">
                <Wallet className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  A wallet popup should appear. If you don't see it, check your wallet extension.
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction hash */}
            {txHash && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-mono break-all">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
                {getExplorerLink() && (
                  <a
                    href={getExplorerLink()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(status === 'success' || status === 'error') && onClose && (
            <div className="flex justify-center pt-2">
              <Button onClick={onClose} variant={status === 'error' ? 'destructive' : 'default'}>
                {status === 'error' ? 'Close' : 'Done'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline transaction status for compact displays
 */
export function InlineTransactionStatus({
  status,
  message,
}: {
  status: TransactionStatusType;
  message?: string;
}) {
  if (status === 'idle') return null;

  const getIcon = () => {
    switch (status) {
      case 'pending':
      case 'confirming':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (status) {
      case 'pending':
        return 'Confirm in wallet...';
      case 'confirming':
        return 'Confirming...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Failed';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {getIcon()}
      <span className={cn(
        status === 'error' && "text-destructive",
        status === 'success' && "text-green-600"
      )}>
        {getMessage()}
      </span>
    </div>
  );
}
