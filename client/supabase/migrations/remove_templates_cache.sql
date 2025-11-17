-- Migration: remove_templates_cache.sql
-- Purpose: Drop legacy templates_cache table now replaced by on-chain template reads.
-- Review BEFORE applying in production. Ensure no critical off-chain data remains.
-- Safe backup suggestion (run manually before applying):
--   CREATE TABLE templates_cache_backup AS SELECT * FROM templates_cache;
--   
-- Apply: psql or Supabase SQL editor.

BEGIN;
DROP TABLE IF EXISTS templates_cache CASCADE;
COMMIT;
