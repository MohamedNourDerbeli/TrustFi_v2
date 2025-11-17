/**
 * Logger utility for consistent logging across the application
 * Automatically disabled in production to prevent data leaks and improve performance
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for detailed debugging information
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - only shown in development
   * Use for general information
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - shown in all environments
   * Use for recoverable issues that need attention
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - shown in all environments
   * Use for errors and exceptions
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

export default logger;
