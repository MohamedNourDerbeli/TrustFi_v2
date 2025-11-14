import React from 'react';
import { parseContractError, isUserRejection, isNetworkError, type ParsedError } from '../../lib/errors';
import { Button } from './Button';

export interface ErrorMessageProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
  showRetryButton?: boolean;
  retryCount?: number;
}

/**
 * ErrorMessage component for displaying user-friendly error messages
 * Parses contract errors and provides optional retry and dismiss actions
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  dismissible = false,
  className = '',
  showRetryButton = true,
  retryCount = 0,
}) => {
  if (!error) return null;

  // Parse the error into a user-friendly format
  const parsedError: ParsedError = parseContractError(error);
  
  // Determine if we should show retry button
  const canRetry = showRetryButton && onRetry && parsedError.retryable && !isUserRejection(error);
  
  // Get error severity color
  const isWarning = isUserRejection(error);
  const colorClasses = isWarning 
    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
    : 'bg-red-50 border-red-200 text-red-800';
  
  const iconColor = isWarning ? 'text-yellow-400' : 'text-red-400';
  const textColor = isWarning ? 'text-yellow-700' : 'text-red-700';
  const codeColor = isWarning ? 'text-yellow-600' : 'text-red-600';

  return (
    <div
      className={`border rounded-lg p-4 ${colorClasses} ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          {isWarning ? (
            <svg
              className={`h-5 w-5 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className={`h-5 w-5 ${iconColor}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Error Content */}
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${colorClasses.split(' ')[2]}`}>
            {parsedError.message}
          </h3>
          
          {parsedError.action && (
            <p className={`mt-2 text-sm ${textColor}`}>
              {parsedError.action}
            </p>
          )}

          {/* Retry count indicator */}
          {retryCount > 0 && (
            <p className={`mt-1 text-xs ${textColor}`}>
              Retry attempt {retryCount}
            </p>
          )}

          {/* Network error specific guidance */}
          {isNetworkError(error) && (
            <p className={`mt-2 text-xs ${textColor}`}>
              💡 Tip: Check your internet connection and RPC endpoint status.
            </p>
          )}

          {parsedError.code && (
            <p className={`mt-1 text-xs ${codeColor} font-mono`}>
              Error Code: {parsedError.code}
            </p>
          )}

          {/* Gas estimate if available */}
          {parsedError.gasEstimate && (
            <p className={`mt-1 text-xs ${textColor}`}>
              Estimated gas: {parsedError.gasEstimate.toString()}
            </p>
          )}

          {/* Action Buttons */}
          {(canRetry || (dismissible && onDismiss)) && (
            <div className="mt-4 flex gap-2">
              {canRetry && (
                <Button
                  variant={isWarning ? "secondary" : "danger"}
                  size="small"
                  onClick={onRetry}
                >
                  Try Again
                </Button>
              )}
              
              {dismissible && onDismiss && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss Button (X) */}
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 ${
                isWarning 
                  ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50'
                  : 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={onDismiss}
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
