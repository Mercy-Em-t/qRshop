-- =============================================================
-- Admin Dashboard Row-Level Security (RLS) Patch
-- =============================================================
-- Problem: System Admins could click "Approve" or "Set PRO",
-- but Supabase silently ignored the update because there were 
-- no UPDATE policies defined for these tables.
-- =============================================================

-- 1. Grant System Admins the ability to update Shops (e.g. changing plans)
create policy "Allow system admins to update shops" 
on public.shops 
for update 
using (
  exists (
    select 1 from public.shop_users 
    where shop_users.id = auth.uid() 
    and shop_users.role = 'system_admin'
  )
);

-- 2. Grant System Admins the ability to update Upgrade Requests
alter table public.upgrade_requests enable row level security;

-- Ensure admins can read upgrade requests
drop policy if exists "Allow admins to read upgrade requests" on public.upgrade_requests;
create policy "Allow admins to read upgrade requests" 
on public.upgrade_requests 
for select 
using (
  exists (
    select 1 from public.shop_users 
    where shop_users.id = auth.uid() 
    and shop_users.role = 'system_admin'
  )
);

-- Ensure admins can update upgrade requests
drop policy if exists "Allow admins to update upgrade requests" on public.upgrade_requests;
create policy "Allow admins to update upgrade requests" 
on public.upgrade_requests 
for update 
using (
  exists (
    select 1 from public.shop_users 
    where shop_users.id = auth.uid() 
    and shop_users.role = 'system_admin'
  )
);

-- 3. Grant System Admins the ability to update KYC Profiles
alter table public.shop_kyc enable row level security;

-- Ensure admins can read KYC profiles
drop policy if exists "Allow admins to read KYC profiles" on public.shop_kyc;
create policy "Allow admins to read KYC profiles" 
on public.shop_kyc 
for select 
using (
  exists (
    select 1 from public.shop_users 
    where shop_users.id = auth.uid() 
    and shop_users.role = 'system_admin'
  )
);

-- Ensure admins can update KYC profiles
drop policy if exists "Allow admins to update KYC profiles" on public.shop_kyc;
create policy "Allow admins to update KYC profiles" 
on public.shop_kyc 
for update 
using (
  exists (
    select 1 from public.shop_users 
    where shop_users.id = auth.uid() 
    and shop_users.role = 'system_admin'
  )
);
