-- LOGISTICS BATCHING INFRASTRUCTURE
-- Groups multiple orders for efficient rider routing

CREATE TABLE IF NOT EXISTS public.delivery_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID REFERENCES public.delivery_hubs(id),
    rider_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'preparing' CHECK (status IN ('preparing', 'dispatched', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Associate orders with batches
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.delivery_batches(id);

-- RLS for Batches
ALTER TABLE public.delivery_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and riders can see relevant batches" 
ON public.delivery_batches 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND (role = 'delivery_manager' OR role = 'system_admin')
  )
  OR rider_id = auth.uid()
);

-- Allow batch creation by managers
CREATE POLICY "Managers can manage batches" 
ON public.delivery_batches 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND (role = 'delivery_manager' OR role = 'system_admin')
  )
);
