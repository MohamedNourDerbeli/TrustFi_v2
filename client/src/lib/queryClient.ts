// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache times based on data volatility
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query key factory for consistent key management
export const queryKeys = {
  // Profile queries
  profile: (address?: string) => ['profile', address] as const,
  profileScore: (profileId?: bigint) => ['profile', 'score', profileId?.toString()] as const,
  profileCards: (profileId?: bigint) => ['profile', 'cards', profileId?.toString()] as const,
  
  // Template queries
  templates: () => ['templates'] as const,
  template: (templateId: bigint) => ['template', templateId.toString()] as const,
  templateEligibility: (templateId: bigint, profileId: bigint) => 
    ['template', 'eligibility', templateId.toString(), profileId.toString()] as const,
  
  // Role queries
  roles: (address?: string) => ['roles', address] as const,
  isAdmin: (address?: string) => ['roles', 'admin', address] as const,
  isIssuer: (address?: string) => ['roles', 'issuer', address] as const,
};
