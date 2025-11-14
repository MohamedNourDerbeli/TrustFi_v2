// lib/errors.ts
/**
 * Error parsing utility to convert contract errors into user-friendly messages
 */

export interface ParsedError {
  message: string;
  code?: string;
  action?: string;
  retryable?: boolean;
  gasEstimate?: bigint;
}

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface TransactionError extends Error {
  code?: string;
  shortMessage?: string;
  details?: string;
  metaMessages?: string[];
  cause?: Error;
}

/**
 * Parse contract errors into user-friendly messages
 */
export function parseContractError(error: unknown): ParsedError {
  const errorMessage = getErrorMessage(error);
  const errorDetails = getErrorDetails(error);
  
  // User rejection - not retryable
  if (isUserRejection(error)) {
    return {
      message: 'Transaction was rejected.',
      code: 'USER_REJECTED',
      action: 'You can try again when ready.',
      retryable: false,
    };
  }
  
  // Gas estimation errors - provide specific guidance
  if (isGasEstimationError(error)) {
    return parseGasError(error);
  }
  
  // Network errors - retryable
  if (isNetworkError(error)) {
    return {
      message: 'Network connection issue.',
      code: 'NETWORK_ERROR',
      action: 'Please check your connection and try again.',
      retryable: true,
    };
  }
  
  // Profile-related errors
  if (errorMessage.includes('Profile exists') || errorMessage.includes('ProfileExists')) {
    return {
      message: 'You already have a profile.',
      code: 'PROFILE_EXISTS',
      action: 'Redirecting to your profile...',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('No profile') || errorMessage.includes('NoProfile')) {
    return {
      message: 'You need to create a profile first.',
      code: 'NO_PROFILE',
      action: 'Please create your profile to continue.',
      retryable: false,
    };
  }
  
  // Card claiming errors
  if (errorMessage.includes('Already claimed') || errorMessage.includes('AlreadyClaimed')) {
    return {
      message: 'You have already claimed this card.',
      code: 'ALREADY_CLAIMED',
      action: 'Check your profile to see your existing cards.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('Invalid signature') || errorMessage.includes('InvalidSignature')) {
    return {
      message: 'The claim link signature is invalid.',
      code: 'INVALID_SIGNATURE',
      action: 'Please request a new claim link from the issuer.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('Nonce used') || errorMessage.includes('NonceUsed')) {
    return {
      message: 'This claim link has already been used.',
      code: 'NONCE_USED',
      action: 'Please request a new claim link from the issuer.',
      retryable: false,
    };
  }
  
  // Template errors
  if (errorMessage.includes('Template paused') || errorMessage.includes('TemplatePaused')) {
    return {
      message: 'This template is currently paused.',
      code: 'TEMPLATE_PAUSED',
      action: 'Please try again later or contact the issuer.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('Max supply') || errorMessage.includes('MaxSupply')) {
    return {
      message: 'This template has reached its maximum supply.',
      code: 'MAX_SUPPLY_REACHED',
      action: 'No more cards can be issued from this template.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('Template exists') || errorMessage.includes('TemplateExists')) {
    return {
      message: 'A template with this ID already exists.',
      code: 'TEMPLATE_EXISTS',
      action: 'Please use a different template ID.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('Invalid tier') || errorMessage.includes('InvalidTier')) {
    return {
      message: 'The tier value must be between 1 and 3.',
      code: 'INVALID_TIER',
      action: 'Please select a valid tier (1, 2, or 3).',
      retryable: false,
    };
  }
  
  // Permission errors
  if (errorMessage.includes('Only issuer') || errorMessage.includes('OnlyIssuer')) {
    return {
      message: 'You do not have permission to issue cards from this template.',
      code: 'UNAUTHORIZED_ISSUER',
      action: 'Only the template issuer can perform this action.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('AccessControl') || errorMessage.includes('Unauthorized') || errorMessage.includes('missing role')) {
    return {
      message: 'You do not have permission to perform this action.',
      code: 'UNAUTHORIZED',
      action: 'Please contact an administrator if you believe this is an error.',
      retryable: false,
    };
  }
  
  // Transaction errors
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('InsufficientFunds')) {
    return {
      message: 'Insufficient funds to complete this transaction.',
      code: 'INSUFFICIENT_FUNDS',
      action: 'Please add more DEV tokens to your wallet.',
      retryable: false,
    };
  }
  
  if (errorMessage.includes('gas required exceeds') || errorMessage.includes('out of gas')) {
    return {
      message: 'Transaction requires more gas than available.',
      code: 'OUT_OF_GAS',
      action: 'Please try again with a higher gas limit.',
      retryable: true,
    };
  }
  
  // Nonce errors - retryable
  if (errorMessage.includes('nonce too low') || errorMessage.includes('nonce too high') || errorMessage.includes('replacement transaction')) {
    return {
      message: 'Transaction nonce conflict.',
      code: 'NONCE_ERROR',
      action: 'Please wait a moment and try again.',
      retryable: true,
    };
  }
  
  // RPC errors - retryable
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      message: 'Too many requests. Please slow down.',
      code: 'RATE_LIMIT',
      action: 'Wait a moment and try again.',
      retryable: true,
    };
  }
  
  // Reputation contract errors
  if (errorMessage.includes('Reputation contract not set') || errorMessage.includes('ReputationNotSet')) {
    return {
      message: 'The reputation contract has not been configured.',
      code: 'REPUTATION_NOT_SET',
      action: 'Please contact an administrator.',
      retryable: false,
    };
  }
  
  // Chain mismatch
  if (errorMessage.includes('chain mismatch') || errorMessage.includes('wrong chain')) {
    return {
      message: 'Wrong network selected.',
      code: 'WRONG_CHAIN',
      action: 'Please switch to Moonbase Alpha network.',
      retryable: false,
    };
  }
  
  // Default error - potentially retryable for unknown errors
  return {
    message: errorMessage || 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
    action: 'Please try again or contact support if the issue persists.',
    retryable: true,
  };
}

/**
 * Extract error message from various error types
 * Handles wagmi/viem error structures
 */
function getErrorMessage(error: unknown): string {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) {
    const err = error as any;
    
    // Check for viem/wagmi specific error properties
    if (err.shortMessage) return err.shortMessage;
    if (err.details) return err.details;
    if (err.message) return err.message;
    
    // Check for nested cause
    if (err.cause) {
      return getErrorMessage(err.cause);
    }
  }
  
  if (typeof error === 'object') {
    const err = error as any;
    
    // Viem error structure
    if (err.shortMessage) return err.shortMessage;
    if (err.details) return err.details;
    
    // Check for common error message properties
    if (err.message) return err.message;
    if (err.reason) return err.reason;
    if (err.data?.message) return err.data.message;
    if (err.error?.message) return err.error.message;
    
    // Check for nested cause
    if (err.cause) {
      return getErrorMessage(err.cause);
    }
    
    // Check for metaMessages (viem)
    if (err.metaMessages && Array.isArray(err.metaMessages) && err.metaMessages.length > 0) {
      return err.metaMessages.join(' ');
    }
    
    // Try to stringify if nothing else works
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
  
  return 'Unknown error';
}

/**
 * Extract detailed error information
 */
function getErrorDetails(error: unknown): string[] {
  const details: string[] = [];
  
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    
    // Collect metaMessages from viem errors
    if (err.metaMessages && Array.isArray(err.metaMessages)) {
      details.push(...err.metaMessages);
    }
    
    // Collect details
    if (err.details && typeof err.details === 'string') {
      details.push(err.details);
    }
    
    // Check cause recursively
    if (err.cause) {
      details.push(...getErrorDetails(err.cause));
    }
  }
  
  return details;
}

/**
 * Check if an error is a user rejection
 */
export function isUserRejection(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const err = error as any;
  
  // Check error code
  if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) {
    return true;
  }
  
  return message.includes('user rejected') || 
         message.includes('user denied') ||
         message.includes('user cancelled') ||
         message.includes('rejected the request');
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const err = error as any;
  
  // Check error codes
  if (err?.code === 'NETWORK_ERROR' || err?.code === 'TIMEOUT') {
    return true;
  }
  
  return message.includes('network') || 
         message.includes('timeout') ||
         message.includes('connection') ||
         message.includes('fetch failed') ||
         message.includes('econnrefused');
}

/**
 * Check if an error is a gas estimation error
 */
export function isGasEstimationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const err = error as any;
  
  return message.includes('gas') ||
         message.includes('intrinsic gas too low') ||
         message.includes('transaction may fail') ||
         err?.code === 'UNPREDICTABLE_GAS_LIMIT';
}

/**
 * Parse gas-related errors with specific guidance
 */
function parseGasError(error: unknown): ParsedError {
  const message = getErrorMessage(error).toLowerCase();
  const err = error as any;
  
  // Insufficient funds for gas
  if (message.includes('insufficient funds')) {
    return {
      message: 'Insufficient funds to pay for gas.',
      code: 'INSUFFICIENT_FUNDS_FOR_GAS',
      action: 'Please add more DEV tokens to your wallet to cover gas fees.',
      retryable: false,
    };
  }
  
  // Gas limit too low
  if (message.includes('intrinsic gas too low') || message.includes('gas too low')) {
    return {
      message: 'Gas limit is too low for this transaction.',
      code: 'GAS_TOO_LOW',
      action: 'Try increasing the gas limit in your wallet settings.',
      retryable: true,
    };
  }
  
  // Transaction may fail or revert
  if (message.includes('transaction may fail') || message.includes('execution reverted')) {
    return {
      message: 'Transaction is likely to fail.',
      code: 'EXECUTION_REVERTED',
      action: 'Check transaction parameters and try again. The contract may have rejected this operation.',
      retryable: false,
    };
  }
  
  // Unpredictable gas limit
  if (err?.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return {
      message: 'Cannot estimate gas for this transaction.',
      code: 'UNPREDICTABLE_GAS_LIMIT',
      action: 'The transaction may fail. Please verify all parameters are correct.',
      retryable: false,
    };
  }
  
  // Generic gas error
  return {
    message: 'Gas estimation failed.',
    code: 'GAS_ESTIMATION_FAILED',
    action: 'Please check your wallet balance and try again.',
    retryable: true,
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Wait before retrying with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Determine if an error should be retried
 */
function shouldRetry(error: unknown): boolean {
  // User rejections should never be retried
  if (isUserRejection(error)) {
    return false;
  }
  
  // Parse the error to check if it's retryable
  const parsed = parseContractError(error);
  return parsed.retryable ?? false;
}

/**
 * Create a transaction error with enhanced information
 */
export function createTransactionError(
  message: string,
  code: string,
  originalError?: unknown
): TransactionError {
  const error = new Error(message) as TransactionError;
  error.code = code;
  error.name = 'TransactionError';
  
  if (originalError) {
    error.cause = originalError instanceof Error ? originalError : new Error(String(originalError));
    
    // Extract additional details from original error
    const err = originalError as any;
    if (err.shortMessage) {
      error.shortMessage = err.shortMessage;
    }
    if (err.details) {
      error.details = err.details;
    }
    if (err.metaMessages) {
      error.metaMessages = err.metaMessages;
    }
  }
  
  return error;
}

/**
 * Format gas value for display
 */
export function formatGasEstimate(gas: bigint): string {
  const gasNumber = Number(gas);
  if (gasNumber > 1000000) {
    return `${(gasNumber / 1000000).toFixed(2)}M`;
  }
  if (gasNumber > 1000) {
    return `${(gasNumber / 1000).toFixed(2)}K`;
  }
  return gasNumber.toString();
}
