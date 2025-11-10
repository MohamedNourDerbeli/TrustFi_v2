import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';

export function useOffChainProfile(address: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'offchain', address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;
      return profileService.getProfile(address);
    },
    enabled: !!address,
    staleTime: 30000,
  });
}

export function useProfileByUsername(username: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'username', username?.toLowerCase()],
    queryFn: async () => {
      if (!username) return null;
      return profileService.getProfileByUsername(username);
    },
    enabled: !!username,
    staleTime: 30000,
  });
}

export function useUsernameAvailability(username: string | undefined) {
  return useQuery({
    queryKey: ['username', 'available', username?.toLowerCase()],
    queryFn: async () => {
      if (!username || username.length < 3) return null;
      return profileService.isUsernameAvailable(username);
    },
    enabled: !!username && username.length >= 3,
    staleTime: 10000,
  });
}
