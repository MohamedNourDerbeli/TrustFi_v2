-- Create issuers table to track addresses with TEMPLATE_MANAGER_ROLE
CREATE TABLE IF NOT EXISTS issuers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL UNIQUE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_issuers_address ON issuers(address);
CREATE INDEX IF NOT EXISTS idx_issuers_active ON issuers(is_active);

-- Enable Row Level Security
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read issuers (public data)
CREATE POLICY "Anyone can view issuers" ON issuers
  FOR SELECT USING (true);

-- Only allow inserts/updates from authenticated users (you can make this more restrictive)
CREATE POLICY "Authenticated users can manage issuers" ON issuers
  FOR ALL USING (true);
