// hooks/index.ts
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

export { useProfile } from './useProfile';
export type { UseProfileReturn } from './useProfile';

export { useTransactionHandler, useTransactionConfirmation } from './useTransactionHandler';
export type { UseTransactionHandlerReturn, TransactionState } from './useTransactionHandler';

// React Query versions (optimized with caching)
export { useAuthQuery } from './useAuthQuery';
export { useProfileQuery } from './useProfileQuery';
export { useTemplatesQuery } from './useTemplatesQuery';
