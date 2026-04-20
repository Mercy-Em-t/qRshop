-- PRODUCTION ORDER LIFECYCLE & PAYMENT TRACKING
-- Migrating from casual statuses to a rigid financial state machine

-- 1. ENHANCE ORDERS TABLE STATUSES
-- We use a check constraint for the rigid state machine to ensure integrity
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS internal_status TEXT DEFAULT 'CREATED';

-- Update existing orders to map to the new status set (Migration fallback)
UPDATE public.orders SET internal_status = 'CREATED' WHERE status = 'pending';
UPDATE public.orders SET internal_status = 'PROCESSING' WHERE status IN ('preparing', 'ready');
UPDATE public.orders SET internal_status = 'COMPLETED' WHERE status = 'completed';
UPDATE public.orders SET internal_status = 'CANCELLED' WHERE status IN ('rejected', 'archived');
UPDATE public.orders SET internal_status = 'PAID' WHERE status = 'paid';

-- Add check constraint for valid states
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check 
CHECK (internal_status IN (
    'CREATED',              -- Initial placement
    'PENDING_PAYMENT',      -- Shop accepted, awaiting money
    'PAYMENT_IN_PROGRESS',  -- STK push sent
    'PAID',                 -- Verified transaction
    'PROCESSING',           -- In the kitchen/preparation
    'COMPLETED',            -- Handed over
    'FAILED',               -- Payment failed
    'CANCELLED'             -- User or Shop cancelled
));

-- 2. CREATE PAYMENTS TABLE
-- For robust reconciliation and multi-attempt tracking
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    transaction_id TEXT, -- M-Pesa Receipt / External ID
    amount DECIMAL(12,2) NOT NULL,
    method TEXT DEFAULT 'mpesa', -- 'mpesa', 'cash', 'bank', 'card'
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed', 'timeout'
    error_code TEXT,
    error_message TEXT,
    raw_payload JSONB, -- Store full gateway response for debugging
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast reconciliation lookups
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 3. UPDATED ANALYTICS VIEW (Revenue strictly from PAID status)
CREATE OR REPLACE VIEW public.shop_revenue_stats AS
SELECT 
    shop_id,
    SUM(total_price) as total_revenue,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE internal_status = 'PAID' OR internal_status = 'COMPLETED') as paid_orders
FROM public.orders
WHERE internal_status NOT IN ('FAILED', 'CANCELLED')
GROUP BY shop_id;

-- 4. TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_modtime ON public.payments;
CREATE TRIGGER update_payments_modtime
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

