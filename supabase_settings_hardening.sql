-- ==========================================
-- Shop Settings Hardening: Field Locking
-- ==========================================

-- 1. Add locked_fields array to track immutable properties
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS locked_fields TEXT[] DEFAULT '{}';

-- 2. Optional: Add a trigger to auto-lock fields once set (if desired)
-- For now, we handle the locking logic in the frontend for better UX control
-- but this column allows the Admin to manually lock/unlock via dashboard.

COMMENT ON COLUMN public.shops.locked_fields IS 'Array of field names that the owner cannot modify without admin approval.';
