-- Insert Kusama Living Profile collectible into Supabase
INSERT INTO collectibles (
  template_id,
  title,
  description,
  image_url,
  banner_url,
  token_uri,
  claim_type,
  requirements,
  created_by,
  is_active
) VALUES (
  999,
  'Kusama Living Profile',
  'A dynamic NFT collectible that reflects your real-time on-chain reputation score, powered by Kusama EVM. The visual representation evolves as you earn more reputation points.',
  'https://via.placeholder.com/400x400?text=Kusama+Living+Profile',
  'https://via.placeholder.com/1200x400?text=Kusama+Living+Profile+Banner',
  'https://kuqfccqirhwaqjkiglmf.supabase.co/functions/v1/dynamic-metadata?profileId=',
  'signature',
  '{"description": "You must have a TrustFi profile to claim this dynamic collectible", "requiresProfile": true}',
  '0x91eD606b65D33e3446d9450AD15115f6a1e0E7f5',
  true
);

-- Verify the insert
SELECT id, template_id, title, token_uri, is_active FROM collectibles WHERE template_id = 999;
