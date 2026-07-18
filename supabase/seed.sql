-- Optional demo seed. Run after at least one profile exists.
-- Idempotent marker captions prevent duplicate inserts.

with demo_profile as (
  select id
  from public.profiles
  order by created_at asc
  limit 1
)
insert into public.posts (user_id, caption)
select demo_profile.id, seed.caption
from demo_profile
cross join (
  values
    ('Welcome to AutoLink — share what you are building.'),
    ('What is the first modification on your wish list?'),
    ('Garage setup complete. Time to plan the next upgrade.')
) as seed(caption)
where not exists (
  select 1
  from public.posts existing
  where existing.caption = seed.caption
);
