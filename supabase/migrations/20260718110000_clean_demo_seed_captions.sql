-- Remove the internal idempotency marker from already-seeded demo captions.

update public.posts
set caption = regexp_replace(caption, '^\[demo-seed\] ', '')
where caption like '[demo-seed] %';
