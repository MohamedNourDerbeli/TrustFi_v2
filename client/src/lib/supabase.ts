// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Some features may not work.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      templates_cache: {
        Row: TemplateCacheRow;
        Insert: TemplateCacheInsert;
        Update: TemplateCacheUpdate;
      };
      claims_log: {
        Row: ClaimLogRow;
        Insert: ClaimLogInsert;
        Update: ClaimLogUpdate;
      };
    };
  };
}

export interface ProfileRow {
  id: string;
  wallet: string;
  profile_id: string;
  token_uri: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  twitter_handle: string | null;
  discord_handle: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  wallet: string;
  profile_id: string;
  token_uri: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  twitter_handle?: string;
  discord_handle?: string;
  website_url?: string;
}

export interface ProfileUpdate {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  twitter_handle?: string;
  discord_handle?: string;
  website_url?: string;
  updated_at?: string;
}

export interface TemplateCacheRow {
  template_id: string;
  issuer: string;
  name: string | null;
  description: string | null;
  max_supply: string;
  current_supply: string;
  tier: number;
  start_time: string;
  end_time: string;
  is_paused: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCacheInsert {
  template_id: string;
  issuer: string;
  name?: string;
  description?: string;
  max_supply: string;
  current_supply: string;
  tier: number;
  start_time: string;
  end_time: string;
  is_paused?: boolean;
}

export interface TemplateCacheUpdate {
  name?: string;
  description?: string;
  current_supply?: string;
  is_paused?: boolean;
  updated_at?: string;
}

export interface ClaimLogRow {
  id: string;
  profile_id: string;
  template_id: string;
  card_id: string;
  claim_type: 'direct' | 'signature';
  claimed_at: string;
}

export interface ClaimLogInsert {
  profile_id: string;
  template_id: string;
  card_id: string;
  claim_type: 'direct' | 'signature';
}

export interface ClaimLogUpdate {
  // Claims are immutable, no updates needed
}
