-- Step 1: Check current credentials and their card_ids
SELECT 
  credential_id,
  card_id,
  holder_did,
  issuer_did,
  credential_data->'claim'->'contents'->>'card_id' as claim_card_id,
  credential_data->'claim'->'contents'->>'template_id' as template_id,
  revoked,
  created_at
FROM verifiable_credentials
ORDER BY created_at DESC;

-- Step 2: If you see card_id = '0' or NULL, update it to match an existing card
-- Replace '1' with the actual card ID you want to verify
-- You can run this for each credential that needs fixing

UPDATE verifiable_credentials 
SET 
  card_id = '1',  -- Change this to your actual card ID (1, 3, or 4)
  credential_data = jsonb_set(
    credential_data,
    '{claim,contents,card_id}',
    '"1"'  -- Change this to match the card_id above
  )
WHERE card_id = '0' OR card_id IS NULL;

-- Step 3: Verify the fix
SELECT 
  credential_id,
  card_id,
  credential_data->'claim'->'contents'->>'card_id' as claim_card_id,
  holder_did,
  revoked
FROM verifiable_credentials
ORDER BY created_at DESC;
