-- Run this in the Supabase SQL Editor if the app logs:
-- GET /rest/v1/inventory?... 404 (Not Found)
--
-- That error means the deployed Supabase project does not have the
-- inventory tables from supabase/schema.sql yet.

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  menu_item_id bigint not null references public.menu_items(id) on delete restrict,
  stock_quantity numeric(10, 2) not null default 0 check (stock_quantity >= 0),
  unit text not null default 'pcs' check (unit in ('kg', 'pcs', 'liters')),
  low_stock_threshold numeric(10, 2) not null default 5 check (low_stock_threshold >= 0),
  prevent_order_when_empty boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(menu_item_id)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory(id) on delete set null,
  menu_item_id bigint not null references public.menu_items(id) on delete restrict,
  order_id bigint references public.orders(id) on delete set null,
  movement_type text not null check (movement_type in ('sale', 'manual_adjustment', 'restock', 'waste', 'cancel')),
  quantity_delta numeric(10, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_menu_item_id on public.inventory(menu_item_id);
create index if not exists idx_inventory_low_stock on public.inventory(stock_quantity, low_stock_threshold);
create index if not exists idx_inventory_movements_menu_item_id on public.inventory_movements(menu_item_id);
create index if not exists idx_inventory_movements_order_id on public.inventory_movements(order_id);
create index if not exists idx_inventory_movements_created_at on public.inventory_movements(created_at desc);

alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "public read inventory" on public.inventory;
create policy "public read inventory" on public.inventory
  for select to anon, authenticated using (true);

drop policy if exists "authenticated manage inventory" on public.inventory;
create policy "authenticated manage inventory" on public.inventory
  for all to authenticated using (true) with check (true);

drop policy if exists "public read inventory_movements" on public.inventory_movements;
create policy "public read inventory_movements" on public.inventory_movements
  for select to anon, authenticated using (true);

drop policy if exists "authenticated manage inventory_movements" on public.inventory_movements;
create policy "authenticated manage inventory_movements" on public.inventory_movements
  for all to authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory'
  ) then
    alter publication supabase_realtime add table public.inventory;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory_movements'
  ) then
    alter publication supabase_realtime add table public.inventory_movements;
  end if;
end $$;
