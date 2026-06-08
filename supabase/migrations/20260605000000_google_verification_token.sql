-- Add google_verification_token column to shops table
-- This allows each shop to store their own Google Search Console verification token
-- The api/google-verify.js endpoint reads this dynamically, so no per-shop code changes needed
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_verification_token TEXT;
