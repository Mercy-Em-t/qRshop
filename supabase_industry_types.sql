-- =============================================================
-- Dynamic Industry Types Registry
-- =============================================================

create table if not exists public.industry_types (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.industry_types enable row level security;

-- Public can read them to fuel the provisioning dropdowns
create policy "Allow public read access on industry types" 
on public.industry_types for select using (true);

-- Only System Admins can create, edit, or delete them
create policy "Allow system admins to configure industry types" 
on public.industry_types
for all using (
  exists (
    select 1 from public.shop_users 
    where shop_users.id = auth.uid() 
    and shop_users.role = 'system_admin'
  )
);

-- Seed with the standard baseline classifications
insert into public.industry_types (slug, name, description) values
('food', 'Food & Beverage', 'Restaurants, cafes, food stalls'),
('retail', 'Retail & Stores', 'Boutiques, convenience stores, pharmacies'),
('service', 'Services', 'Salons, spas, clinics, consulting'),
('other', 'Other', 'General classification')
on conflict (slug) do nothing;
