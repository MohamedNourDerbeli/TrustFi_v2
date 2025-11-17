-- Fix credential card_id mismatch
-- This updates the credential to point to card ID 1 (which exists in your wallet)

UPDATE verifiable_credentials 
SET 
  card_id = '1',
  credential_data = jsonb_set(
    credential_data,
    '{claim,contents,card_id}',
    '"1"'
  )
WHERE credential_id = 'cred_1763347135991_pphsn0kcb';

-- Verify the update
SELECT 
  credential_id,
  card_id,
  credential_data->'claim'->'contents'->>'card_id' as claim_card_id,
  holder_did,
  revoked
FROM verifiable_credentials
WHERE credential_id = 'cred_1763347135991_pphsn0kcb';
