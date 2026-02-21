-- AutoLink Phase 1 entitlement flag for Pro access
-- Safe to run multiple times.

alter table public.profiles
add column if not exists is_pro boolean;

update public.profiles
set is_pro = false
where is_pro is null;

alter table public.profiles
alter column is_pro set default false;

alter table public.profiles
alter column is_pro set not null;
