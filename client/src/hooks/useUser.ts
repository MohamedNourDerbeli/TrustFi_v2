import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Define the shape of our profile data
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  bio?: string;
  profile_nft_id?: number;
  created_at: string;
}

// Define the state for our Zustand store
interface UserState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  fetchProfile: () => Promise<void>;
  refetchProfile: () => Promise<void>; // Add this for manual refetching
}

export const useUser = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,

  // This function is called by our useAuth hook when the auth state changes
  setUser: (user) => {
    set({ user });
    if (user) {
      get().fetchProfile(); // Fetch profile immediately after user is set
    } else {
      // If user logs out, clear the profile
      set({ profile: null, isLoading: false });
    }
  },

  // This function fetches the profile from the 'profiles' table
  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

      if (error) {
        throw error;
      }

      set({ profile: data, isLoading: false });
    } catch (e: any) {
      console.error("Failed to fetch profile:", e);
      set({ error: e.message, isLoading: false });
    }
  },

  // A separate function for manual refetching, like after creating a profile
  refetchProfile: async () => {
    await get().fetchProfile();
  },
}));
