-- ==============================================================================
-- STRATEGIC SUBSCRIPTION ENFORCEMENT ENGINE
-- ==============================================================================

-- 1. Schema Upgrades: Inject Timestamp tracking into the core Shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled'));

-- Grace Period Migration: Grant all current legacy shops 30 days of standard usage 
-- so they aren't instantly frozen upon rollout
UPDATE shops 
SET subscription_expires_at = NOW() + INTERVAL '30 days' 
WHERE subscription_expires_at IS NULL;

-- ==============================================================================
-- IRONCLAD POSTGRES TRIGGER: PREVENT BROWSER HACKING OF TIER LIMITS
-- ==============================================================================

CREATE OR REPLACE FUNCTION enforce_free_tier_limit()
RETURNS TRIGGER AS $$
DECLARE
    shop_plan TEXT;
    expires_at TIMESTAMPTZ;
    item_count INT;
BEGIN
    -- Query the shop's active subscription tier and exact expiration clock
    SELECT plan, subscription_expires_at INTO shop_plan, expires_at FROM shops WHERE id = NEW.shop_id;
    
    -- GRACEFUL DEGRADATION: If the shop paid for Pro, but their clock ran out,
    -- the database engine natively treats them as 'Free' for the sake of write-locks natively.
    IF expires_at IS NOT NULL AND expires_at < NOW() THEN
        shop_plan := 'free';
    END IF;
    
    -- THE INTRINSIC LOCK: If their effective tier is Free, check current catalogue size
    IF shop_plan = 'free' THEN
        SELECT COUNT(*) INTO item_count FROM menu_items WHERE shop_id = NEW.shop_id;
        
        -- Cap at 50 Items. Throw HTTP 403 Forbidden intercept natively to PostgREST.
        IF item_count >= 50 THEN
            RAISE EXCEPTION 'FREE_TIER_LIMIT_REACHED: You cannot add more than 50 items. Please upgrade your subscription to unlock unlimited capabilities.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hook the trigger to explicitly fire BEFORE any HTTP Insert hits the disk
DROP TRIGGER IF EXISTS check_free_tier_limit ON menu_items;
CREATE TRIGGER check_free_tier_limit
BEFORE INSERT ON menu_items
FOR EACH ROW
EXECUTE FUNCTION enforce_free_tier_limit();

-- ==============================================================================
