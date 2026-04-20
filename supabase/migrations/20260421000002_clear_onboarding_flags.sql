-- CLEAR PERSISTENT PASSWORD RESET FLAGS
-- This migration ensures that merchants who have already set their passwords are not locked in a reset loop.

BEGIN;

-- 1. Ensure the column exists (defensive)
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

-- 2. Clear the flag for all existing shops
UPDATE public.shops SET needs_password_change = FALSE;

-- 3. Also ensure kyc_completed is handled correctly
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE;

-- 4. Set Mama Rosy, Savannah Atelier, and Aura & Co as "onboarded" to prevent stuck gates
UPDATE public.shops 
SET kyc_completed = TRUE, 
    needs_password_change = FALSE 
WHERE shop_id IN (
    'deada001-1111-4444-8888-deada0016666', -- Mama Rosy
    '1971e852-47b4-43fa-b77b-d90642273e95', -- Savannah Atelier
    '5442ce63-9c3d-45e7-bb22-35f04a698dfc'  -- Aura & Co.
);

COMMIT;
