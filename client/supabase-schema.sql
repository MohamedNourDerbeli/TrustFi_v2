-- Supabase Database Schema for TrustFi
-- This file contains the SQL commands to set up the database tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet VARCHAR(42) UNIQUE NOT NULL,
  profile_id BIGINT UNIQUE NOT NULL,
  token_uri TEXT NOT NULL,
  display_name VARCHAR(255),
  username VARCHAR(20) UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  twitter_handle VARCHAR(255),
  discord_handle VARCHAR(255),
  website_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Templates cache table (for faster queries)
CREATE TABLE IF NOT EXISTS templates_cache (
  template_id BIGINT PRIMARY KEY,
  issuer VARCHAR(42) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  max_supply BIGINT NOT NULL,
  current_supply BIGINT NOT NULL DEFAULT 0,
  tier SMALLINT NOT NULL CHECK (tier >= 1 AND tier <= 3),
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for templates_cache table
CREATE INDEX IF NOT EXISTS idx_templates_issuer ON templates_cache(issuer);
CREATE INDEX IF NOT EXISTS idx_templates_tier ON templates_cache(tier);
CREATE INDEX IF NOT EXISTS idx_templates_paused ON templates_cache(is_paused);

-- Claims log table (for analytics and tracking)
CREATE TABLE IF NOT EXISTS claims_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id BIGINT NOT NULL,
  template_id BIGINT NOT NULL,
  card_id BIGINT NOT NULL,
  claim_type VARCHAR(20) NOT NULL CHECK (claim_type IN ('direct', 'signature')),
  claimed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for claims_log table
CREATE INDEX IF NOT EXISTS idx_claims_profile ON claims_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_claims_template ON claims_log(template_id);
CREATE INDEX IF NOT EXISTS idx_claims_card ON claims_log(card_id);
CREATE INDEX IF NOT EXISTS idx_claims_type ON claims_log(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_date ON claims_log(claimed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for templates_cache
CREATE TRIGGER update_templates_cache_updated_at
  BEFORE UPDATE ON templates_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, only service role can write
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Profiles can be inserted by service role"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Profiles can be updated by service role"
  ON profiles FOR UPDATE
  USING (true);

-- Templates: Anyone can read, only service role can write
CREATE POLICY "Templates are viewable by everyone"
  ON templates_cache FOR SELECT
  USING (true);

CREATE POLICY "Templates can be inserted by service role"
  ON templates_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Templates can be updated by service role"
  ON templates_cache FOR UPDATE
  USING (true);

-- Claims log: Anyone can read, only service role can write
CREATE POLICY "Claims are viewable by everyone"
  ON claims_log FOR SELECT
  USING (true);

CREATE POLICY "Claims can be inserted by service role"
  ON claims_log FOR INSERT
  WITH CHECK (true);
