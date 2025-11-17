-- Backfill card_id into credential_data.claim.contents for existing credentials
-- This ensures dashboard mapping works for credentials issued before card_id was added to claim contents.
-- Safe to run multiple times (idempotent for rows that already have card_id key)

UPDATE verifiable_credentials
SET credential_data = jsonb_set(
  credential_data,
  '{claim,contents,card_id}',
  to_jsonb(card_id::text),
  true
)
WHERE card_id IS NOT NULL
  AND (
    (credential_data->'claim'->'contents' ? 'card_id') = FALSE
    OR (credential_data->'claim'->'contents'->>'card_id') IS NULL
    OR (credential_data->'claim'->'contents'->>'card_id') = ''
  );

-- Verify
-- SELECT credential_id, card_id, credential_data->'claim'->'contents'->>'card_id' AS card_id_in_claim
-- FROM verifiable_credentials;
