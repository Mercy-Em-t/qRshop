-- Migration: Operator Feature Suite
-- 1. Force-password-change flag on shop_users
alter table public.shop_users
  add column if not exists must_change_password boolean not null default false;

-- 2. Comprehensive shop fields (safe if already exist)
alter table public.shops
  add column if not exists logo_url        text,
  add column if not exists tagline         text,
  add column if not exists operating_hours jsonb,
  add column if not exists offers_delivery  boolean not null default false,
  add column if not exists offers_pickup    boolean not null default false,
  add column if not exists offers_dine_in   boolean not null default true;

-- 3. Peak Hours RPC
create or replace function get_peak_hours(p_shop_id uuid)
returns table(hour int, order_count bigint)
language sql stable as $$
  select
    extract(hour from created_at)::int as hour,
    count(*)                           as order_count
  from public.orders
  where shop_id = p_shop_id
    and internal_status in ('PAID', 'COMPLETED', 'PROCESSING')
  group by 1
  order by 1;
$$;
