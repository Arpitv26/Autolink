-- AutoLink Mod Planner: builds, build items, cost sync, and optional Feed link.

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  is_public boolean not null default true,
  is_active boolean not null default true,
  total_cost numeric(12, 2) not null default 0 check (total_cost >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.build_items (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references public.builds(id) on delete cascade,
  catalog_part_id text not null,
  category text not null check (char_length(btrim(category)) between 1 and 60),
  part_name text not null check (char_length(btrim(part_name)) between 1 and 160),
  brand text not null check (char_length(btrim(brand)) between 1 and 80),
  price numeric(12, 2) not null check (price >= 0),
  notes text check (notes is null or char_length(notes) <= 500),
  sort_order integer not null default 0,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  status text not null default 'planned'
    check (status in ('planned', 'ordered', 'installed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.posts
add column if not exists build_id uuid references public.builds(id) on delete set null;

create index if not exists builds_user_vehicle_idx
  on public.builds(user_id, vehicle_id, created_at desc);

create unique index if not exists builds_one_active_per_vehicle_idx
  on public.builds(user_id, vehicle_id)
  where is_active = true;

create index if not exists build_items_build_sort_idx
  on public.build_items(build_id, category, sort_order, created_at);

create index if not exists posts_build_id_idx
  on public.posts(build_id)
  where build_id is not null;

drop trigger if exists builds_set_updated_at on public.builds;
create trigger builds_set_updated_at
before update on public.builds
for each row
execute function public.set_updated_at();

drop trigger if exists build_items_set_updated_at on public.build_items;
create trigger build_items_set_updated_at
before update on public.build_items
for each row
execute function public.set_updated_at();

create or replace function public.validate_build_vehicle_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.vehicles
    where id = new.vehicle_id
      and user_id = new.user_id
  ) then
    raise exception 'Builds may only reference a vehicle owned by their author';
  end if;

  return new;
end;
$$;

drop trigger if exists builds_validate_vehicle_ownership on public.builds;
create trigger builds_validate_vehicle_ownership
before insert or update of user_id, vehicle_id on public.builds
for each row
execute function public.validate_build_vehicle_ownership();

create or replace function public.recalculate_build_total_cost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_build_id uuid;
begin
  target_build_id := coalesce(new.build_id, old.build_id);

  update public.builds
  set total_cost = coalesce((
    select sum(price)
    from public.build_items
    where build_id = target_build_id
  ), 0)
  where id = target_build_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists build_items_recalculate_total on public.build_items;
create trigger build_items_recalculate_total
after insert or update of price, build_id or delete on public.build_items
for each row
execute function public.recalculate_build_total_cost();

create or replace function public.get_or_create_active_build(target_vehicle_id uuid)
returns public.builds
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  vehicle_label text;
  result_build public.builds;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select trim(both from format('%s %s %s', year, make, model))
  into vehicle_label
  from public.vehicles
  where id = target_vehicle_id
    and user_id = caller_id
  for update;

  if not found then
    raise exception 'Vehicle not found';
  end if;

  select *
  into result_build
  from public.builds
  where user_id = caller_id
    and vehicle_id = target_vehicle_id
    and is_active = true
  limit 1
  for update;

  if found then
    return result_build;
  end if;

  insert into public.builds (user_id, vehicle_id, title, description, is_active)
  values (
    caller_id,
    target_vehicle_id,
    vehicle_label || ' Build',
    'Primary build plan for this vehicle.',
    true
  )
  returning * into result_build;

  return result_build;
end;
$$;

create or replace function public.validate_post_build_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.build_id is not null
    and not exists (
      select 1
      from public.builds
      where id = new.build_id
        and user_id = new.user_id
    )
  then
    raise exception 'Posts may only reference a build owned by their author';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_validate_build_ownership on public.posts;
create trigger posts_validate_build_ownership
before insert or update of build_id, user_id on public.posts
for each row
execute function public.validate_post_build_ownership();

alter table public.builds enable row level security;
alter table public.build_items enable row level security;

drop policy if exists builds_select_own on public.builds;
create policy builds_select_own
  on public.builds for select to authenticated
  using (auth.uid() = user_id or is_public = true);

drop policy if exists builds_insert_own on public.builds;
create policy builds_insert_own
  on public.builds for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists builds_update_own on public.builds;
create policy builds_update_own
  on public.builds for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists builds_delete_own on public.builds;
create policy builds_delete_own
  on public.builds for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists build_items_select_visible on public.build_items;
create policy build_items_select_visible
  on public.build_items for select to authenticated
  using (
    exists (
      select 1
      from public.builds
      where builds.id = build_items.build_id
        and (builds.user_id = auth.uid() or builds.is_public = true)
    )
  );

drop policy if exists build_items_insert_own on public.build_items;
create policy build_items_insert_own
  on public.build_items for insert to authenticated
  with check (
    exists (
      select 1
      from public.builds
      where builds.id = build_id
        and builds.user_id = auth.uid()
    )
  );

drop policy if exists build_items_update_own on public.build_items;
create policy build_items_update_own
  on public.build_items for update to authenticated
  using (
    exists (
      select 1
      from public.builds
      where builds.id = build_items.build_id
        and builds.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.builds
      where builds.id = build_id
        and builds.user_id = auth.uid()
    )
  );

drop policy if exists build_items_delete_own on public.build_items;
create policy build_items_delete_own
  on public.build_items for delete to authenticated
  using (
    exists (
      select 1
      from public.builds
      where builds.id = build_items.build_id
        and builds.user_id = auth.uid()
    )
  );

revoke all on function public.get_or_create_active_build(uuid) from public;
grant execute on function public.get_or_create_active_build(uuid) to authenticated;
