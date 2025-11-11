/**
 * Shared components for collectibles feature and error handling
 * Export all shared UI components for easier imports
 */

export { MintingModeBadge } from './MintingModeBadge';
export { RarityIndicator } from './RarityIndicator';
export { SupplyIndicator } from './SupplyIndicator';
export { EligibilityChecker } from './EligibilityChecker';
export { TimeRemainingBadge } from './TimeRemainingBadge';
export { CelebrationAnimation } from './CelebrationAnimation';

// Error handling components
export { ErrorBoundary } from './ErrorBoundary';
export { ErrorFallback, ErrorMessage } from './ErrorFallback';
export { TransactionStatus, InlineTransactionStatus } from './TransactionStatus';
export type { TransactionStatusType } from './TransactionStatus';
