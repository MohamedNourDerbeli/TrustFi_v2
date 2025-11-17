-- Create claim_links table for shareable claim links (not discoverable)
CREATE TABLE IF NOT EXISTS claim_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id INT8 NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  token_uri TEXT NOT NULL,
  claim_url TEXT NOT NULL,       -- added column
  nonce TEXT NOT NULL UNIQUE,
  signature TEXT NOT NULL,
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_claims INT DEFAULT 1,
  current_claims INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claim_links_template_id ON claim_links(template_id);
CREATE INDEX IF NOT EXISTS idx_claim_links_nonce ON claim_links(nonce);
CREATE INDEX IF NOT EXISTS idx_claim_links_active ON claim_links(is_active);
CREATE INDEX IF NOT EXISTS idx_claim_links_created_by ON claim_links(created_by);

-- Enable Row Level Security
ALTER TABLE claim_links ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read claim links (they need the link to access it)
CREATE POLICY "Anyone can view claim links" ON claim_links
  FOR SELECT USING (true);

-- Only creators can insert/update their claim links
CREATE POLICY "Creators can manage their claim links" ON claim_links
  FOR ALL USING (true);

-- Add comment
COMMENT ON TABLE claim_links IS 'Shareable claim links that are not discoverable - only accessible via direct link';
