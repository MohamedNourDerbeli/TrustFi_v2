/**
 * Error classification utility for contract interactions
 * Maps contract errors to user-friendly messages with retry logic
 */

import { 
  ContractError, 
  NetworkError, 
  ValidationError, 
  TransactionError 
} from '../services/contractService';

export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  TRANSACTION: 'TRANSACTION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  INITIALIZATION: 'INITIALIZATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

export interface ClassifiedError {
  type: ErrorType;
  code?: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  action?: 'retry' | 'reconnect' | 'switch-network' | 'contact-support' | 'check-wallet';
  originalError?: any;
}

/**
 * Classify an error and provide user-friendly information
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle custom error types
  if (error instanceof NetworkError) {
    return {
      type: ErrorType.NETWORK,
      code: error.code,
      message: error.message,
      userMessage: getNetworkErrorMessage(error),
      retryable: true,
      action: error.message.includes('Unsupported network') ? 'switch-network' : 'reconnect',
      originalError: error.originalError
    };
  }

  if (error instanceof ValidationError) {
    return {
      type: ErrorType.VALIDATION,
      code: error.code,
      message: error.message,
      userMessage: error.message, // Validation errors are already user-friendly
      retryable: false,
      originalError: error.originalError
    };
  }

  if (error instanceof TransactionError) {
    return {
      type: ErrorType.TRANSACTION,
      code: error.code,
      message: error.message,
      userMessage: getTransactionErrorMessage(error),
      retryable: error.message.includes('rejected') ? false : true,
      action: error.message.includes('rejected') ? 'check-wallet' : 'retry',
      originalError: error.originalError
    };
  }

  if (error instanceof ContractError) {
    // Check for specific contract error types
    if (error.message.includes('not initialized')) {
      return {
        type: ErrorType.INITIALIZATION,
        code: error.code,
        message: error.message,
        userMessage: 'Please connect your wallet to continue',
        retryable: false,
        action: 'reconnect',
        originalError: error.originalError
      };
    }

    if (error.message.includes('UnauthorizedAccess') || error.message.includes('not authorized')) {
      return {
        type: ErrorType.AUTHORIZATION,
        code: error.code,
        message: error.message,
        userMessage: 'You do not have permission to perform this action',
        retryable: false,
        originalError: error.originalError
      };
    }

    if (error.message.includes('not found') || error.message.includes('ProfileNotFound')) {
      return {
        type: ErrorType.NOT_FOUND,
        code: error.code,
        message: error.message,
        userMessage: error.message,
        retryable: false,
        originalError: error.originalError
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      code: error.code,
      message: error.message,
      userMessage: 'A contract error occurred. Please try again.',
      retryable: true,
      action: 'retry',
      originalError: error.originalError
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        type: ErrorType.NETWORK,
        message: error.message,
        userMessage: 'Network connection issue. Please check your connection and try again.',
        retryable: true,
        action: 'retry',
        originalError: error
      };
    }

    if (error.message.includes('user rejected') || error.message.includes('User denied')) {
      return {
        type: ErrorType.TRANSACTION,
        message: error.message,
        userMessage: 'Transaction was cancelled. Please try again if you want to proceed.',
        retryable: false,
        action: 'check-wallet',
        originalError: error
      };
    }

    if (error.message.includes('insufficient funds')) {
      return {
        type: ErrorType.TRANSACTION,
        message: error.message,
        userMessage: 'Insufficient funds to complete the transaction. Please add more funds to your wallet.',
        retryable: false,
        originalError: error
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      userMessage: error.message || 'An unexpected error occurred. Please try again.',
      retryable: true,
      action: 'retry',
      originalError: error
    };
  }

  // Handle unknown error types
  return {
    type: ErrorType.UNKNOWN,
    message: 'Unknown error',
    userMessage: 'An unknown error occurred. Please try again.',
    retryable: true,
    action: 'contact-support',
    originalError: error
  };
}

/**
 * Get user-friendly message for network errors
 */
function getNetworkErrorMessage(error: NetworkError): string {
  if (error.message.includes('Unsupported network')) {
    return 'Please switch to a supported network (Hardhat Local or Moonbase Alpha)';
  }

  if (error.message.includes('Failed to initialize')) {
    return 'Failed to connect to the blockchain. Please check your wallet connection.';
  }

  return 'Network connection issue. Please check your internet connection and try again.';
}

/**
 * Get user-friendly message for transaction errors
 */
function getTransactionErrorMessage(error: TransactionError): string {
  if (error.message.includes('rejected') || error.message.includes('User denied')) {
    return 'Transaction was cancelled. Please try again if you want to proceed.';
  }

  if (error.message.includes('insufficient funds')) {
    return 'Insufficient funds to complete the transaction. Please add more funds to your wallet.';
  }

  if (error.message.includes('gas')) {
    return 'Transaction failed due to gas estimation. Please try again.';
  }

  if (error.message.includes('nonce')) {
    return 'Transaction nonce error. Please reset your wallet or try again.';
  }

  return 'Transaction failed. Please try again.';
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.retryable;
}

/**
 * Get suggested action for an error
 */
export function getErrorAction(error: unknown): ClassifiedError['action'] {
  const classified = classifyError(error);
  return classified.action;
}

/**
 * Log error with classification context
 */
export function logClassifiedError(error: unknown, context?: string): void {
  const classified = classifyError(error);
  const contextMessage = context ? `[${context}] ` : '';
  
  console.error(
    `${contextMessage}${classified.type}: ${classified.message}`,
    {
      userMessage: classified.userMessage,
      retryable: classified.retryable,
      action: classified.action,
      originalError: classified.originalError
    }
  );
  
  // Also log to error tracking service if available
  if (typeof window !== 'undefined') {
    import('../services/errorTrackingService').then(({ logError }) => {
      logError(error, { component: context });
    }).catch(() => {
      // Ignore if service is not available
    });
  }
}
