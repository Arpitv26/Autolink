-- Close the profile insert path so clients cannot self-grant Pro while
-- creating their own profile row.

create or replace function public.protect_profile_entitlement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'INSERT' and coalesce(new.is_pro, false) then
      raise exception 'Pro entitlement is server-managed';
    end if;

    if tg_op = 'UPDATE' and new.is_pro is distinct from old.is_pro then
      raise exception 'Pro entitlement is server-managed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_entitlement on public.profiles;
create trigger profiles_protect_entitlement
before insert or update on public.profiles
for each row
execute function public.protect_profile_entitlement();
