-- AutoLink Phase 1 baseline schema (profiles + vehicles)
-- Safe to run multiple times.

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null check (year between 1886 and 2100),
  trim text,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists updated_at timestamptz;
update public.profiles
set updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where updated_at is null;
alter table public.profiles alter column updated_at set default timezone('utc', now());
alter table public.profiles alter column updated_at set not null;

alter table public.vehicles add column if not exists updated_at timestamptz;
update public.vehicles
set updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where updated_at is null;
alter table public.vehicles alter column updated_at set default timezone('utc', now());
alter table public.vehicles alter column updated_at set not null;

create index if not exists vehicles_user_id_idx on public.vehicles(user_id);
create index if not exists vehicles_user_created_idx on public.vehicles(user_id, created_at desc);
create unique index if not exists vehicles_one_primary_per_user_idx
  on public.vehicles(user_id)
  where is_primary = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles
  for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists vehicles_select_own on public.vehicles;
create policy vehicles_select_own
  on public.vehicles
  for select
  using (auth.uid() = user_id);

drop policy if exists vehicles_insert_own on public.vehicles;
create policy vehicles_insert_own
  on public.vehicles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists vehicles_update_own on public.vehicles;
create policy vehicles_update_own
  on public.vehicles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists vehicles_delete_own on public.vehicles;
create policy vehicles_delete_own
  on public.vehicles
  for delete
  using (auth.uid() = user_id);
