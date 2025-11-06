import { ContractError, NetworkError, ValidationError, TransactionError } from '../services/contractService';

export interface ErrorInfo {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  actionable?: boolean;
}

export function getErrorInfo(error: unknown): ErrorInfo {
  // Handle our custom error types
  if (error instanceof ValidationError) {
    return {
      title: 'Validation Error',
      message: error.message,
      type: 'warning',
      actionable: true
    };
  }

  if (error instanceof NetworkError) {
    return {
      title: 'Network Error',
      message: error.message,
      type: 'error',
      actionable: true
    };
  }

  if (error instanceof TransactionError) {
    return {
      title: 'Transaction Error',
      message: error.message,
      type: 'error',
      actionable: true
    };
  }

  if (error instanceof ContractError) {
    return {
      title: 'Contract Error',
      message: error.message,
      type: 'error',
      actionable: false
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      title: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred',
      type: 'error',
      actionable: false
    };
  }

  // Handle unknown error types
  return {
    title: 'Unknown Error',
    message: 'An unknown error occurred. Please try again.',
    type: 'error',
    actionable: false
  };
}

export function logError(error: unknown, context?: string): void {
  const errorInfo = getErrorInfo(error);
  const contextMessage = context ? `[${context}] ` : '';
  
  console.error(`${contextMessage}${errorInfo.title}: ${errorInfo.message}`, error);
}

// Helper function to check if an error is user-actionable
export function isActionableError(error: unknown): boolean {
  const errorInfo = getErrorInfo(error);
  return errorInfo.actionable || false;
}

// Helper function to get user-friendly error messages for common scenarios
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    if (error.message.includes('Unsupported network')) {
      return 'Please switch to a supported network (Hardhat Local or Moonbase Alpha)';
    }
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  if (error instanceof TransactionError) {
    if (error.message.includes('rejected')) {
      return 'Transaction was cancelled. Please try again if you want to proceed.';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds to complete the transaction. Please add more funds to your wallet.';
    }
    return 'Transaction failed. Please try again.';
  }

  if (error instanceof ContractError) {
    if (error.message.includes('ProfileAlreadyExists')) {
      return 'You already have a profile. You can only create one profile per wallet.';
    }
    if (error.message.includes('not initialized')) {
      return 'Please connect your wallet first.';
    }
    return 'Smart contract error. Please try again or contact support.';
  }

  return 'An unexpected error occurred. Please try again.';
}