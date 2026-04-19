-- Migration: Create order_ratings table
-- Stores customer feedback (stars + optional comment) per order.
-- Uses order_id as the unique constraint so ratings can be upserted.

create table if not exists public.order_ratings (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null unique references public.orders(id) on delete cascade,
  shop_id       uuid references public.shops(id) on delete set null,
  rating        smallint not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.order_ratings enable row level security;

-- Allow anyone (including anonymous customers) to submit a rating
create policy "Anyone can submit ratings"
  on public.order_ratings for insert
  with check (true);

-- Allow any authenticated user to read ratings
-- (operators filter by shop_id in the application layer)
create policy "Authenticated users can read ratings"
  on public.order_ratings for select
  using (auth.role() = 'authenticated');
