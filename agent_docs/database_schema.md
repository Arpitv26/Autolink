agent_docs/database_schema.md
Save as: agent_docs/database_schema.md
Database Schema — AutoLink

Canonical source of truth: `supabase/migrations/` (not this file).
Apply with `npx supabase db push`. The SQL below is a short accurate summary only.

---
Implemented tables (Foundation + Feed + Planner)

profiles
- Extends auth.users: username, display_name, avatar_url, bio, pronouns, is_pro
- Server protects entitlement fields on insert/update

vehicles
- user_id, year/make/model/trim, is_primary
- Free vs Pro limits enforced in DB; atomic primary switch/delete RPCs

posts
- caption, image_urls[], likes_count, comments_count
- Optional vehicle_id (ON DELETE SET NULL, ownership trigger)
- Optional build_id (ON DELETE SET NULL; set when sharing from Planner)
- Feed UI does not yet display a build chip

likes / comments / follows
- likes unique(post_id, user_id)
- comments support threaded replies via parent_id
- follows unique(follower_id, following_id)

builds
- user_id, vehicle_id, title, description, is_public, is_active, total_cost
- One active build per (user_id, vehicle_id) via unique partial index
- RPC: get_or_create_active_build

build_items
- catalog_part_id, category, part_name, brand, price, notes
- sort_order (category zones), position_x/y reserved, status planned|ordered|installed
- Trigger recalculates builds.total_cost

Storage
- avatars (public read, owner write)
- post-images (public read, owner write)

---
Phase 4 — ai_query_log (Edge Function rate limit)

create table public.ai_query_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query_date date not null default (timezone('utc', now()))::date,
  query_count int not null default 0 check (query_count >= 0),
  unique (user_id, query_date)
);

RLS: users can SELECT own rows; inserts/updates performed by Edge Function with service role.

---
Key RPCs / triggers (see migrations)
- Vehicle limit + primary/delete RPCs (foundation hardening)
- posts vehicle/build ownership validation
- build total_cost recalculation
- get_or_create_active_build

---
App TypeScript types
- `types/feed.ts` — posts, comments, feed rows
- `types/planner.ts` — builds, build items, catalog shapes
Do not assume a generated `types/database.ts` exists yet.
