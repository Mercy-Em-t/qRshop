-- =============================================================
-- Wholesale Checkout Trigger Fix
-- =============================================================
-- The block_order_spam trigger (from supabase_security_patch.sql)
-- references NEW.device_id which does NOT exist on the orders table.
-- This patch fixes it to use client_phone instead.
-- =============================================================

CREATE OR REPLACE FUNCTION block_order_spam()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_count
    FROM orders
    WHERE client_phone = NEW.client_phone
      AND created_at > NOW() - INTERVAL '5 minutes';

    IF recent_count >= 5 THEN
        RAISE EXCEPTION 'ORDER_RATE_LIMIT_REACHED: You are sending orders too quickly. Please wait 5 minutes.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_order_spam ON orders;
CREATE TRIGGER check_order_spam
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION block_order_spam();
