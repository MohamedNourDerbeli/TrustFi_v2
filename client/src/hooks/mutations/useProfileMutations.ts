 import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { supabase } from '@/lib/supabase';

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, username, displayName }: { 
      address: string; 
      username?: string; 
      displayName?: string;
    }) => {
      const defaultUsername = username || `user-${address.slice(2, 8).toLowerCase()}`;
      const defaultDisplayName = displayName || 'Unnamed';

      const { error } = await supabase
        .from('profiles')
        .upsert({
          address: address.toLowerCase(),
          username: defaultUsername,
          display_name: defaultDisplayName,
        }, {
          onConflict: 'address',
          ignoreDuplicates: false
        });

      if (error) throw error;

      return { address, username: defaultUsername, displayName: defaultDisplayName };
    },
    onSuccess: (data) => {
      // Invalidate and refetch profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', data.address.toLowerCase()] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      provider, 
      address, 
      updates 
    }: { 
      provider: any; 
      address: string; 
      updates: any;
    }) => {
      return profileService.updateProfile(provider, address, updates);
    },
    onSuccess: (_result, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', variables.address.toLowerCase()] });
      if (variables.updates.username) {
        queryClient.invalidateQueries({ queryKey: ['profile', 'username'] });
      }
    },
  });
}

export function useIncrementProfileViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string) => {
      return profileService.incrementProfileViews(address);
    },
    onSuccess: (_result, address) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'offchain', address.toLowerCase()] });
    },
  });
}
