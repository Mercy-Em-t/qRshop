-- ADVANCED LOGISTICS & CUSTOMER ACCOUNTS foundation
-- Supporting precise GPS pins on orders and persistent customer profiles

-- 1. ENHANCE ORDERS TABLE WITH GPS COORDINATES
-- This allows riders to navigate to a temporary location even if the user changes their profile later.
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(12,9),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(12,9);

-- 2. CREATE CUSTOMER PROFILES TABLE
-- For persistent loyalty, saved addresses, and faster checkout.
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    default_address TEXT,
    latitude DECIMAL(12,9),
    longitude DECIMAL(12,9),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR CUSTOMER PROFILES
CREATE POLICY "Users can view their own profile" 
ON public.customer_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.customer_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.customer_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow Shops and Riders to view customer profiles if they have an active order
-- (Optional: For now keep it strict or allow internal service role)
CREATE POLICY "Service role can see all profiles" 
ON public.customer_profiles FOR SELECT 
TO service_role 
USING (true);

-- 4. LINK ORDERS TO REGISTERED USERS
-- Add user_id to orders if not already present
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. UPDATE VIEWS OR RPCs (if needed)
-- The 'checkout_cart' RPC should handle latitude and longitude in its payload.
