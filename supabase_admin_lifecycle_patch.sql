-- ==========================================
-- Admin Lifecycle Controls: Phase 8
-- ==========================================

-- 1. Add Suspension Status to core Shops
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 2. Ensure Marketplace Status has a clean default
-- Values: 'not_listed', 'pending_review', 'approved', 'rejected', 'suspended'
ALTER TABLE shops 
ALTER COLUMN marketplace_status SET DEFAULT 'not_listed';

-- 3. Update existing NULLs to 'not_listed'
UPDATE shops SET marketplace_status = 'not_listed' WHERE marketplace_status IS NULL;

-- 4. Secure the 'is_suspended' column by enforcing it at the API level
-- (Already handled by our system_admin role check in the API, but good to note)

-- 5. Add a system-wide notice for suspended shops (Optional Trigger)
-- This ensures that even if the frontend doesn't check 'is_suspended', 
-- the database can natively reject orders from suspended shops.
CREATE OR REPLACE FUNCTION block_suspended_shop_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT is_suspended FROM shops WHERE id = NEW.shop_id) = true THEN
        RAISE EXCEPTION 'SHOP_SUSPENDED: This store is currently under maintenance or has been suspended by the administrator.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_shop_suspension ON orders;
CREATE TRIGGER check_shop_suspension
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION block_suspended_shop_orders();
