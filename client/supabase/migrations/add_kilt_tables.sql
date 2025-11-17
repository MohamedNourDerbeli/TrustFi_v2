-- KILT Protocol Integration Tables
-- Migration to add DID and Verifiable Credentials support
-- This migration adds tables for user DIDs, issuer DIDs, and verifiable credentials

-- Ensure UUID extension is enabled (should already exist from main schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User DIDs table
-- Stores decentralized identifiers for regular users
CREATE TABLE IF NOT EXISTS user_dids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  did_uri TEXT NOT NULL UNIQUE,
  did_document JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for wallet_address lookups
CREATE INDEX IF NOT EXISTS idx_user_dids_wallet ON user_dids(wallet_address);

-- Issuer DIDs table
-- Stores decentralized identifiers for issuers/attesters with encrypted keys
CREATE TABLE IF NOT EXISTS issuer_dids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_address TEXT NOT NULL UNIQUE,
  did_uri TEXT NOT NULL UNIQUE,
  did_document JSONB NOT NULL,
  encrypted_keys TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for issuer_address lookups
CREATE INDEX IF NOT EXISTS idx_issuer_dids_address ON issuer_dids(issuer_address);

-- Verifiable Credentials table
-- Stores KILT verifiable credentials linked to reputation cards
CREATE TABLE IF NOT EXISTS verifiable_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id TEXT NOT NULL UNIQUE,
  holder_did TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  credential_data JSONB NOT NULL,
  card_id TEXT,
  template_id BIGINT,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_template
    FOREIGN KEY (template_id)
    REFERENCES templates_cache(template_id)
    ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_holder ON verifiable_credentials(holder_did);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_credential_id ON verifiable_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_template ON verifiable_credentials(template_id);
CREATE INDEX IF NOT EXISTS idx_verifiable_credentials_card ON verifiable_credentials(card_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all new tables
ALTER TABLE user_dids ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_dids ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiable_credentials ENABLE ROW LEVEL SECURITY;

-- User DIDs: Anyone can read, only service role can write
CREATE POLICY "User DIDs are viewable by everyone"
  ON user_dids FOR SELECT
  USING (true);

CREATE POLICY "User DIDs can be inserted by service role"
  ON user_dids FOR INSERT
  WITH CHECK (true);

CREATE POLICY "User DIDs can be updated by service role"
  ON user_dids FOR UPDATE
  USING (true);

-- Issuer DIDs: Anyone can read, only service role can write
CREATE POLICY "Issuer DIDs are viewable by everyone"
  ON issuer_dids FOR SELECT
  USING (true);

CREATE POLICY "Issuer DIDs can be inserted by service role"
  ON issuer_dids FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Issuer DIDs can be updated by service role"
  ON issuer_dids FOR UPDATE
  USING (true);

-- Verifiable Credentials: Anyone can read, only service role can write
CREATE POLICY "Verifiable credentials are viewable by everyone"
  ON verifiable_credentials FOR SELECT
  USING (true);

CREATE POLICY "Verifiable credentials can be inserted by service role"
  ON verifiable_credentials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Verifiable credentials can be updated by service role"
  ON verifiable_credentials FOR UPDATE
  USING (true);

-- Comments for documentation
COMMENT ON TABLE user_dids IS 'Stores KILT DIDs for regular users, linked to their wallet addresses';
COMMENT ON TABLE issuer_dids IS 'Stores KILT DIDs for issuers/attesters with encrypted signing keys';
COMMENT ON TABLE verifiable_credentials IS 'Stores KILT verifiable credentials linked to reputation cards';

COMMENT ON COLUMN user_dids.wallet_address IS 'Ethereum/Polkadot wallet address of the user';
COMMENT ON COLUMN user_dids.did_uri IS 'KILT DID URI (e.g., did:kilt:4...)';
COMMENT ON COLUMN user_dids.did_document IS 'Full DID document in JSON format';

COMMENT ON COLUMN issuer_dids.issuer_address IS 'Ethereum/Polkadot wallet address of the issuer';
COMMENT ON COLUMN issuer_dids.did_uri IS 'KILT DID URI for the issuer/attester';
COMMENT ON COLUMN issuer_dids.encrypted_keys IS 'Encrypted private keys for signing credentials';

COMMENT ON COLUMN verifiable_credentials.credential_id IS 'Unique identifier for the credential';
COMMENT ON COLUMN verifiable_credentials.holder_did IS 'DID of the credential holder';
COMMENT ON COLUMN verifiable_credentials.issuer_did IS 'DID of the credential issuer';
COMMENT ON COLUMN verifiable_credentials.credential_data IS 'Full credential data in JSON format';
COMMENT ON COLUMN verifiable_credentials.card_id IS 'Associated reputation card ID';
COMMENT ON COLUMN verifiable_credentials.template_id IS 'Associated template ID from templates_cache';
COMMENT ON COLUMN verifiable_credentials.revoked IS 'Whether the credential has been revoked';
