# Supabase Setup Guide

Your project relies on Supabase for its backend database and API. Follow these steps to create your project, apply the database schema, and get the keys needed for Vercel.

## 1. Create a Supabase Project
1. Go to [database.new](https://database.new) (which redirects to Supabase).
2. Sign in with GitHub or your email.
3. Click **New Project**.
4. Select your Organization (or create one).
5. Give your project a name (e.g., `qrshop-backend`).
6. Generate a strong Database Password and save it somewhere safe.
7. Choose a Region closest to your users.
8. Click **Create new project**. (It will take 1-2 minutes to provision the database).

## 2. Get Your API Keys (For Vercel)
Once the project is ready:
1. In your Supabase dashboard, click the **Settings** (gear icon) on the bottom left.
2. Under "Configuration", select **API**.
3. Under **Project URL**, copy the URL. This is your `VITE_SUPABASE_URL` in Vercel.
4. Under **Project API keys**, find the one labeled `anon` `public`. Copy this. This is your `VITE_SUPABASE_ANON_KEY` in Vercel.

## 3. Apply the Database Schema
To make your app work, you need to create the tables. Supabase provides a powerful SQL editor.

1. On the left sidebar of the Supabase dashboard, click the **SQL Editor** icon (it looks like a terminal window `>_`).
2. Click **New Query**.
3. Copy and paste the entire SQL block below into the editor.
4. Click the **Run** button (or press `Cmd/Ctrl + Enter`).

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Shops Table
create table if not exists public.shops (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    phone text,
    latitude decimal,
    longitude decimal,
    plan text default 'free',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tables/Counters Table
create table if not exists public.tables (
    id uuid default uuid_generate_v4() primary key,
    shop_id uuid references public.shops(id) on delete cascade not null,
    table_number text not null,
    qr_code_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Menu Items
create table if not exists public.menu_items (
    id uuid default uuid_generate_v4() primary key,
    shop_id uuid references public.shops(id) on delete cascade not null,
    name text not null,
    description text,
    price decimal not null,
    category text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Upsell Relationships
create table if not exists public.upsell_items (
    id uuid default uuid_generate_v4() primary key,
    item_id uuid references public.menu_items(id) on delete cascade not null,
    upsell_id uuid references public.menu_items(id) on delete cascade not null
);

-- 5. Orders Table
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    shop_id uuid references public.shops(id) on delete cascade not null,
    table_id uuid references public.tables(id) on delete set null,
    total_price decimal not null,
    status text default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Order Items
create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    menu_item_id uuid references public.menu_items(id) on delete cascade not null,
    quantity integer not null default 1,
    price decimal not null
);

-- 7. QR Nodes (Programmable Infrastructure)
create table if not exists public.qrs (
    id text primary key, -- Small string ID (e.g., 'A1B2')
    shop_id uuid references public.shops(id) on delete cascade not null,
    location text not null,
    action text not null default 'open_menu',
    status text default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Event Telemetry (Analytics)
create table if not exists public.events (
    id uuid default uuid_generate_v4() primary key,
    event_type text not null,
    qr_id text references public.qrs(id) on delete set null,
    shop_id uuid references public.shops(id) on delete cascade not null,
    session_id text,
    device_id text,
    device_info jsonb,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Basic RLS (Row Level Security) Configuration
-- For production, these should be locked down. For initial development, we'll open reading.
alter table public.shops enable row level security;
alter table public.menu_items enable row level security;
alter table public.qrs enable row level security;
alter table public.events enable row level security;

-- Read policies (Allow public reading for frontend)
create policy "Allow public read access on shops" on public.shops for select using (true);
create policy "Allow public read access on menu items" on public.menu_items for select using (true);
create policy "Allow public read access on qrs" on public.qrs for select using (true);

-- Allow public insertion for telemetry and orders (since frontend users are unauthenticated currently)
create policy "Allow public insert on events" on public.events for insert with check (true);
create policy "Allow public insert on orders" on public.orders for insert with check (true);
create policy "Allow public insert on order_items" on public.order_items for insert with check (true);

-- Create a mock test shop so the frontend doesn't crash on load
insert into public.shops (id, name, phone, plan) 
values ('test-shop-id-1234-5678-9abcdef01234', 'QR Shop Demo', '+1234567890', 'free')
on conflict do nothing;
```

## 4. Finish Vercel Deployment
Now that you have your project created and your API keys copied (from Step 2):
1. Go back to Vercel.
2. In the Environment Variables section of your new deployment, paste the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Click "Deploy".

## 5. V3 Schema (Full Telemetry)

The V3 schema adds server-side device tracking, visit logging, and enriched events. To apply it:

1. Open the **SQL Editor** in Supabase.
2. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) into a new query.
3. Click **Run**.

This creates the following additional tables:
- **deployments** — Where QR codes are physically installed
- **devices** — Device fingerprints (type, OS, browser)
- **sessions** — Browsing sessions tied to devices
- **visits** — Full-context QR scan visit records
- **users** — End-user accounts (phone-based)
- **events** (enriched) — Telemetry events with user_id, visit_id, and metadata

It also adds a `scan_count` trigger on the `qrs` table that auto-increments on each `qr_scanned` event.

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for the full table reference.
