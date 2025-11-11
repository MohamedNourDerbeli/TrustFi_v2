import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { classifyError, ErrorType } from '@/utils/errorClassification';
import { AlertCircle, WifiOff, ShieldAlert, XCircle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | unknown;
  resetError?: () => void;
  title?: string;
  showRetry?: boolean;
  compact?: boolean;
}

/**
 * ErrorFallback component to display user-friendly error messages
 * Provides contextual information and actions based on error type
 */
export function ErrorFallback({
  error,
  resetError,
  title,
  showRetry = true,
  compact = false,
}: ErrorFallbackProps) {
  const classified = classifyError(error);

  // Get appropriate icon based on error type
  const getErrorIcon = () => {
    switch (classified.type) {
      case ErrorType.NETWORK:
        return <WifiOff className="h-5 w-5" />;
      case ErrorType.AUTHORIZATION:
        return <ShieldAlert className="h-5 w-5" />;
      case ErrorType.TRANSACTION:
      case ErrorType.VALIDATION:
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // Get action button text based on error action
  const getActionText = () => {
    switch (classified.action) {
      case 'retry':
        return 'Try Again';
      case 'reconnect':
        return 'Reconnect Wallet';
      case 'switch-network':
        return 'Switch Network';
      case 'check-wallet':
        return 'Check Wallet';
      default:
        return 'Retry';
    }
  };

  // Compact version for inline errors
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive p-2 rounded-md bg-destructive/10">
        {getErrorIcon()}
        <span>{classified.userMessage}</span>
        {showRetry && classified.retryable && resetError && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetError}
            className="ml-auto h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Full version for page-level errors
  return (
    <Alert variant="destructive" className="my-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getErrorIcon()}</div>
        <div className="flex-1 space-y-2">
          <AlertTitle>{title || 'Error'}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{classified.userMessage}</p>
            
            {/* Show additional context for certain error types */}
            {classified.type === ErrorType.NETWORK && (
              <p className="text-xs opacity-80">
                Please check your internet connection and ensure you're connected to a supported network.
              </p>
            )}
            
            {classified.type === ErrorType.AUTHORIZATION && (
              <p className="text-xs opacity-80">
                You may need to request access or connect with a different wallet.
              </p>
            )}

            {classified.type === ErrorType.INITIALIZATION && (
              <p className="text-xs opacity-80">
                Make sure your wallet is connected and you're on the correct network.
              </p>
            )}

            {/* Show retry button if error is retryable */}
            {showRetry && classified.retryable && resetError && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetError}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {getActionText()}
                </Button>
              </div>
            )}

            {/* Show contact support for non-retryable errors */}
            {!classified.retryable && classified.action === 'contact-support' && (
              <p className="text-xs opacity-80">
                If this problem persists, please contact support with the error details.
              </p>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

/**
 * Minimal error display for small spaces
 */
export function ErrorMessage({ error }: { error: Error | unknown }) {
  const classified = classifyError(error);
  
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" />
      <span>{classified.userMessage}</span>
    </div>
  );
}
