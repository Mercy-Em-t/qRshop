-- RESTORE ALPHANUMERIC QR IDS
-- Converts qr_id from UUID to TEXT to allow short-codes (e.g. 'A1B2C3')

BEGIN;

-- 1. DROP CONSTRAINTS
-- We must drop foreign key constraints before altering the column type
ALTER TABLE public.deployments DROP CONSTRAINT IF EXISTS deployments_qr_id_fkey;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_qr_id_fkey;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_qr_id_fkey;

-- 2. ALTER COLUMNS TO TEXT
-- Primary Table
ALTER TABLE public.qrs ALTER COLUMN qr_id TYPE TEXT;

-- Dependent Tables
ALTER TABLE public.deployments ALTER COLUMN qr_id TYPE TEXT;
ALTER TABLE public.visits ALTER COLUMN qr_id TYPE TEXT;
ALTER TABLE public.events ALTER COLUMN qr_id TYPE TEXT;

-- 3. RE-APPLY CONSTRAINTS
ALTER TABLE public.deployments 
ADD CONSTRAINT deployments_qr_id_fkey 
FOREIGN KEY (qr_id) REFERENCES public.qrs(qr_id) ON DELETE CASCADE;

ALTER TABLE public.visits 
ADD CONSTRAINT visits_qr_id_fkey 
FOREIGN KEY (qr_id) REFERENCES public.qrs(qr_id) ON DELETE SET NULL;

ALTER TABLE public.events 
ADD CONSTRAINT events_qr_id_fkey 
FOREIGN KEY (qr_id) REFERENCES public.qrs(qr_id) ON DELETE SET NULL;

COMMIT;
