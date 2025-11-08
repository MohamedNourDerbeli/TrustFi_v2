import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Profile updates will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: number;
  address: string;
  username?: string;
  display_name?: string;
  bio?: string;
  email?: string;
  website_url?: string;
  avatar_url?: string;
  banner_url?: string;
  twitter_handle?: string;
  github_handle?: string;
  linkedin_url?: string;
  discord_handle?: string;
  telegram_handle?: string;
  last_signature?: string;
  last_message?: string;
  updated_at: string;
  created_at: string;
}
