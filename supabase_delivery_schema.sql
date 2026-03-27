-- ==========================================
-- DELIVERY HUB SCHEMA & ROLES
-- Last-Mile Logistics Infrastructure
-- ==========================================

-- 1. Extend Orders with Delivery Metadata
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'none' CHECK (delivery_status IN ('none', 'pending_pickup', 'picked_up', 'dispatched', 'delivered')),
ADD COLUMN IF NOT EXISTS delivery_agent_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delivery_payout_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8);

-- 2. Delivery Agents Profile
CREATE TABLE IF NOT EXISTS public.delivery_agents (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT, -- 'bike', 'motorcycle', 'car'
    is_active BOOLEAN DEFAULT true,
    current_status TEXT DEFAULT 'offline' CHECK (current_status IN ('available', 'busy', 'offline')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;

-- 3. Delivery Roles & Permissions
-- Managers can see all delivery orders and agents
-- Workers can only see orders assigned to them or available for pickup

CREATE POLICY "Delivery managers can see all agents"
ON public.delivery_agents FOR SELECT
USING (EXISTS (SELECT 1 FROM shop_users WHERE id = auth.uid() AND role = 'delivery_manager'));

CREATE POLICY "Delivery agents can see their own profile"
ON public.delivery_agents FOR SELECT
USING (id = auth.uid());

-- 4. Order Visibility for Delivery Team
CREATE POLICY "Delivery team can see orders for delivery"
ON public.orders FOR SELECT
USING (
    EXISTS (SELECT 1 FROM shop_users WHERE id = auth.uid() AND role IN ('delivery_manager', 'delivery_worker'))
    OR delivery_agent_id = auth.uid()
);

-- 5. Delivery Log for Tracking
CREATE TABLE IF NOT EXISTS public.delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id),
    agent_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.delivery_logs TO authenticated;
GRANT ALL ON public.delivery_logs TO service_role;
