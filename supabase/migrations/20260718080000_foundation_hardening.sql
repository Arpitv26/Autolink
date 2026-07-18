-- AutoLink foundation hardening:
-- - public profile fields required by onboarding/feed
-- - server-owned Pro entitlement
-- - server-enforced vehicle limits
-- - atomic primary vehicle switching/deletion

alter table public.profiles
add column if not exists bio text;

alter table public.profiles
add column if not exists pronouns text;

create or replace function public.protect_profile_entitlement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_pro is distinct from old.is_pro
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Pro entitlement is server-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_entitlement on public.profiles;
create trigger profiles_protect_entitlement
before update on public.profiles
for each row
execute function public.protect_profile_entitlement();

create or replace function public.enforce_vehicle_insert_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_count integer;
  vehicle_limit integer;
  user_is_pro boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select coalesce(is_pro, false)
  into user_is_pro
  from public.profiles
  where id = new.user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  select count(*)
  into existing_count
  from public.vehicles
  where user_id = new.user_id;

  vehicle_limit := case when user_is_pro then 5 else 1 end;

  if existing_count >= vehicle_limit then
    raise exception 'Vehicle limit reached for this account';
  end if;

  if existing_count = 0 then
    new.is_primary := true;
  else
    new.is_primary := false;
  end if;

  return new;
end;
$$;

drop trigger if exists vehicles_enforce_insert_rules on public.vehicles;
create trigger vehicles_enforce_insert_rules
before insert on public.vehicles
for each row
execute function public.enforce_vehicle_insert_rules();

create or replace function public.protect_vehicle_primary_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_primary is distinct from old.is_primary
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Primary vehicle state must be changed atomically';
  end if;

  return new;
end;
$$;

drop trigger if exists vehicles_protect_primary_state on public.vehicles;
create trigger vehicles_protect_primary_state
before update on public.vehicles
for each row
execute function public.protect_vehicle_primary_state();

-- Deletion goes through delete_vehicle_and_reassign so a remaining garage
-- never loses its primary vehicle. The RPC still permits deleting the last car.
drop policy if exists vehicles_delete_own on public.vehicles;

create or replace function public.set_primary_vehicle(target_vehicle_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  perform 1
  from public.vehicles
  where id = target_vehicle_id and user_id = caller_id
  for update;

  if not found then
    raise exception 'Vehicle not found';
  end if;

  update public.vehicles
  set is_primary = false
  where user_id = caller_id and is_primary = true;

  update public.vehicles
  set is_primary = true
  where id = target_vehicle_id and user_id = caller_id;
end;
$$;

create or replace function public.delete_vehicle_and_reassign(target_vehicle_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  deleted_was_primary boolean;
  next_primary_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select is_primary
  into deleted_was_primary
  from public.vehicles
  where id = target_vehicle_id and user_id = caller_id
  for update;

  if not found then
    raise exception 'Vehicle not found';
  end if;

  delete from public.vehicles
  where id = target_vehicle_id and user_id = caller_id;

  if deleted_was_primary then
    select id
    into next_primary_id
    from public.vehicles
    where user_id = caller_id
    order by created_at desc
    limit 1
    for update;

    if next_primary_id is not null then
      update public.vehicles
      set is_primary = true
      where id = next_primary_id and user_id = caller_id;
    end if;
  end if;

  return next_primary_id;
end;
$$;

revoke all on function public.set_primary_vehicle(uuid) from public;
grant execute on function public.set_primary_vehicle(uuid) to authenticated;

revoke all on function public.delete_vehicle_and_reassign(uuid) from public;
grant execute on function public.delete_vehicle_and_reassign(uuid) to authenticated;
