/**
 * KILT Error Utilities
 * 
 * Factory functions for creating KILT errors with proper typing
 */

import type { KiltError, KiltErrorCode } from '../../types/kilt';

/**
 * Create a KILT error
 */
export function createKiltError(
  message: string,
  code: KiltErrorCode,
  details?: any
): KiltError {
  return {
    name: 'KiltError',
    message,
    code,
    details,
  };
}

/**
 * Check if an error is a KILT error
 */
export function isKiltError(error: unknown): error is KiltError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'KiltError' &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Get error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isKiltError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Log KILT error with context
 */
export function logKiltError(error: KiltError, context?: Record<string, any>): void {
  console.error('[KILT Error]', {
    code: error.code,
    message: error.message,
    details: error.details,
    context,
  });
}
