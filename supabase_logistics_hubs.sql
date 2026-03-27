-- LOGISTICS NODES & HUBS INFRASTRUCTURE
-- Enables centralized pickup points for delivery optimization

CREATE TABLE IF NOT EXISTS public.delivery_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    address TEXT NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    contact_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Associate orders with hubs for tiered delivery (Shop -> Hub -> Rider -> Customer)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS hub_id UUID REFERENCES public.delivery_hubs(id),
ADD COLUMN IF NOT EXISTS is_at_hub BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hub_arrival_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hub_departure_at TIMESTAMPTZ;

-- RLS for Logistics Hubs
ALTER TABLE public.delivery_hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Managers can manage hubs" 
ON public.delivery_hubs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND public.shop_users.role IN ('system_admin', 'delivery_manager')
  )
);

CREATE POLICY "Public can view active hubs" 
ON public.delivery_hubs 
FOR SELECT 
USING (is_active = true);

-- Add some default hubs for the platform
INSERT INTO public.delivery_hubs (name, slug, address)
VALUES 
('Central Nairobi Node', 'nairobi-central', 'CBD Plaza, Kenyatta Ave'),
('Mombasa Gateway', 'mombasa-gateway', 'Moi Ave Terminal'),
('Kisumu Distribution', 'kisumu-dist', 'Oginga Odinga Rd')
ON CONFLICT (slug) DO NOTHING;
