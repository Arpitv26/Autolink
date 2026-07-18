-- Optionally associate a post with one of its author's saved vehicles.

alter table public.posts
add column if not exists vehicle_id uuid
references public.vehicles(id)
on delete set null;

create index if not exists posts_user_vehicle_created_idx
on public.posts(user_id, vehicle_id, created_at desc);

drop policy if exists vehicles_select_feed_linked on public.vehicles;
create policy vehicles_select_feed_linked
on public.vehicles for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.posts
    where posts.vehicle_id = vehicles.id
  )
);

create or replace function public.validate_post_vehicle_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.vehicle_id is not null
    and not exists (
      select 1
      from public.vehicles
      where id = new.vehicle_id
        and user_id = new.user_id
    )
  then
    raise exception 'Posts may only reference a vehicle owned by their author';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_validate_vehicle_ownership on public.posts;
create trigger posts_validate_vehicle_ownership
before insert or update of vehicle_id, user_id on public.posts
for each row
execute function public.validate_post_vehicle_ownership();
