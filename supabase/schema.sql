-- =============================================================
-- QR Platform V3 — Full Database Schema
-- =============================================================
-- Run this in the Supabase SQL Editor to set up the complete
-- table structure for shops, QR nodes, deployments, telemetry,
-- device tracking, sessions, visits, users, and events.
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Shops
create table if not exists public.shops (
  shop_id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp default now()
);

-- 2. QR Nodes
create table if not exists public.qrs (
  qr_id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(shop_id) on delete cascade,
  action_type text not null,
  campaign_id uuid,
  status text default 'active',
  scan_count integer default 0,
  created_at timestamp default now()
);

-- 3. Deployments
create table if not exists public.deployments (
  deployment_id uuid primary key default gen_random_uuid(),
  qr_id uuid references public.qrs(qr_id) on delete cascade,
  location_name text,
  zone text,
  environment text,
  installed_at timestamp default now()
);

-- 4. Devices
create table if not exists public.devices (
  device_id uuid primary key default gen_random_uuid(),
  device_type text,
  os text,
  browser text,
  created_at timestamp default now()
);

-- 5. Sessions
create table if not exists public.sessions (
  session_id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(device_id),
  started_at timestamp default now(),
  ended_at timestamp
);

-- 6. Visits
create table if not exists public.visits (
  visit_id uuid primary key default gen_random_uuid(),
  qr_id uuid references public.qrs(qr_id),
  deployment_id uuid references public.deployments(deployment_id),
  shop_id uuid references public.shops(shop_id),
  session_id uuid references public.sessions(session_id),
  device_id uuid references public.devices(device_id),
  visit_start timestamp default now(),
  visit_end timestamp
);

-- 7. Users
create table if not exists public.users (
  user_id uuid primary key default gen_random_uuid(),
  phone text unique,
  signup_timestamp timestamp default now()
);

-- 8. Events
create table if not exists public.events (
  event_id uuid primary key default gen_random_uuid(),
  event_type text not null,
  qr_id uuid references public.qrs(qr_id),
  shop_id uuid references public.shops(shop_id),
  session_id uuid references public.sessions(session_id),
  device_id uuid references public.devices(device_id),
  user_id uuid references public.users(user_id),
  visit_id uuid references public.visits(visit_id),
  metadata jsonb,
  timestamp timestamp default now()
);

-- =============================================================
-- Trigger: Auto-increment scan_count on qr_scanned events
-- =============================================================
create or replace function increment_scan_count()
returns trigger as $$
begin
  if NEW.event_type = 'qr_scanned' then
    update public.qrs
      set scan_count = coalesce(scan_count, 0) + 1
      where qr_id = NEW.qr_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_increment_scan_count
after insert on public.events
for each row execute function increment_scan_count();
