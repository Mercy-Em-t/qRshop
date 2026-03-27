-- DINE-IN & IN-STORE SCHEMA UPGRADE
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_routing_type') THEN
        CREATE TYPE order_routing_type AS ENUM ('delivery', 'dine_in', 'takeaway', 'instore');
    END IF;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type order_routing_type DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS spot_id TEXT; -- For spots in a mall or parking bay

-- Add index for fast local order filtering
CREATE INDEX IF NOT EXISTS idx_orders_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_shop_type ON public.orders(shop_id, order_type);

-- Constraint: Dine-in orders must have a table or spot
-- ALTER TABLE public.orders ADD CONSTRAINT check_dine_in_spot CHECK (
--     (order_type = 'dine_in' AND (table_number IS NOT NULL OR spot_id IS NOT NULL)) OR 
--     (order_type != 'dine_in')
-- );
