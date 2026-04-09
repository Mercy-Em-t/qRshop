-- =============================================================
-- API Gateway Logging & Routing Schema
-- =============================================================

-- 1. Create the gateway_logs table
create table if not exists public.gateway_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  direction text not null check (direction in ('SENT', 'RECEIVED')),
  method text not null,
  endpoint text not null,
  payload jsonb,
  response jsonb,
  status_code int,
  latency_ms int,
  system text not null -- e.g., 'SYSTEM_B', 'INTERNAL', 'MPESA'
);

-- 2. Enable RLS
alter table public.gateway_logs enable row level security;

-- 3. Create policies for System Admins
create policy "Allow system admins to read gateway logs"
on public.gateway_logs
for select
using (
  exists (
    select 1 from public.shop_users
    where shop_users.id = auth.uid()
    and shop_users.role = 'system_admin'
  )
);

-- Note: Insertions will be handled by the backend API using the service role key
-- to ensure that every routed request is logged regardless of the user's frontend session.
