-- Add claim_nonce column to verifiable_credentials table
-- This column links pending credentials to claim links via the nonce value

ALTER TABLE verifiable_credentials
ADD COLUMN IF NOT EXISTS claim_nonce TEXT;

-- Create index for efficient claim_nonce lookups
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_claim_nonce 
ON verifiable_credentials(claim_nonce);

-- Add comment for documentation
COMMENT ON COLUMN verifiable_credentials.claim_nonce IS 'Nonce value from claim link, used to link pending credentials to claims';
