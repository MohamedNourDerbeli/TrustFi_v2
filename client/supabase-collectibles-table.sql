-- Create collectibles table for user-facing items
CREATE TABLE IF NOT EXISTS collectibles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id INT8 NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  banner_url TEXT,
  token_uri TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('direct', 'signature')),
  requirements JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collectibles_template_id ON collectibles(template_id);
CREATE INDEX IF NOT EXISTS idx_collectibles_active ON collectibles(is_active);
CREATE INDEX IF NOT EXISTS idx_collectibles_created_by ON collectibles(created_by);

-- Enable Row Level Security
ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active collectibles
CREATE POLICY "Anyone can view active collectibles" ON collectibles
  FOR SELECT USING (is_active = true);

-- Only creators can insert/update their collectibles
CREATE POLICY "Creators can manage their collectibles" ON collectibles
  FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE collectibles IS 'User-facing collectible metadata linked to on-chain templates';
