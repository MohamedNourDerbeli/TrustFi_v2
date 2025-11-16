-- Update Kusama Living Profile collectible with proper token URI
-- Run this in Supabase SQL Editor

UPDATE collectibles
SET token_uri = 'ipfs://QmYourMetadataHash/'
WHERE template_id = 999;

-- Or if you want to use a dynamic metadata endpoint:
-- UPDATE collectibles
-- SET token_uri = 'https://your-project.supabase.co/functions/v1/dynamic-metadata?profileId='
-- WHERE template_id = 999;

-- Verify the update
SELECT id, template_id, title, token_uri FROM collectibles WHERE template_id = 999;
