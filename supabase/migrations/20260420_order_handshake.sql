-- Migration: Handshake Order Completion
-- Adds columns for two-party confirmation before an order is marked as completed.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shop_confirmed_at TIMESTAMPTZ;

-- Function to automatically mark order as completed once both parties handshake
CREATE OR REPLACE FUNCTION public.check_order_handshake()
RETURNS TRIGGER AS $$
BEGIN
    -- If both confirmations are present, move to COMPLETED
    IF NEW.customer_confirmed_at IS NOT NULL AND NEW.shop_confirmed_at IS NOT NULL THEN
        NEW.status := 'completed';
        NEW.internal_status := 'COMPLETED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to watch for handshake updates
DROP TRIGGER IF EXISTS tr_order_handshake ON public.orders;
CREATE TRIGGER tr_order_handshake
BEFORE UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.customer_confirmed_at IS NOT NULL OR NEW.shop_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.check_order_handshake();
