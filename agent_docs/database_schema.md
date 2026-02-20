agent_docs/database_schema.md
Save as: agent_docs/database_schema.md
Database Schema — AutoLink
Overview
PostgreSQL database hosted on Supabase. Row Level Security (RLS) must be enabled on all tables.
---
Full Schema SQL
-- ============================================================
-- Run this in Supabase SQL Editor to set up the full schema
-- ============================================================
-- PROFILES (extends Supabase Auth users)
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
-- VEHICLES (user&apos;s garage)
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  trim text,
  is_primary boolean default false,
  created_at timestamptz default now()
);
-- BUILDS (modification plans)
create table builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  vehicle_id uuid references vehicles(id),
  title text not null,
  description text,
  is_public boolean default true,
  total_cost numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- BUILD_ITEMS (individual mods in a build)
create table build_items (
  id uuid primary key default gen_random_uuid(),
  build_id uuid references builds(id) on delete cascade,
  category text not null,        -- &apos;Suspension&apos;, &apos;Exhaust&apos;, etc.
  part_name text not null,
  brand text,
  price numeric,
  notes text,
  position_x float default 0,   -- for drag-and-drop canvas position
  position_y float default 0,
  status text default &apos;planned&apos;, -- &apos;planned&apos; | &apos;ordered&apos; | &apos;installed&apos;
  created_at timestamptz default now()
);
-- POSTS (social feed)
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  build_id uuid references builds(id),  -- optional link to a build
  caption text,
  image_urls text[] default &apos;{}&apos;,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);
-- LIKES
create table likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)              -- one like per user per post
);
-- COMMENTS
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
-- FOLLOWS
create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);
-- AI_QUERY_LOG (for rate limiting — 20 queries/day per user)
create table ai_query_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  query_date date default current_date,
  query_count int default 0,
  unique(user_id, query_date)
);
---
Row Level Security (RLS) Policies
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table builds enable row level security;
alter table build_items enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table ai_query_log enable row level security;
-- PROFILES: Anyone can read, only owner can write
create policy &quot;Public profiles are viewable by everyone&quot;
  on profiles for select using (true);
create policy &quot;Users can update their own profile&quot;
  on profiles for update using (auth.uid() = id);
create policy &quot;Users can insert their own profile&quot;
  on profiles for insert with check (auth.uid() = id);
-- VEHICLES: Owner only
create policy &quot;Users can manage their own vehicles&quot;
  on vehicles for all using (auth.uid() = user_id);
-- BUILDS: Public builds viewable by all, owner can manage
create policy &quot;Public builds are viewable&quot;
  on builds for select using (is_public = true or auth.uid() = user_id);
create policy &quot;Users can manage their own builds&quot;
  on builds for insert with check (auth.uid() = user_id);
create policy &quot;Users can update their own builds&quot;
  on builds for update using (auth.uid() = user_id);
create policy &quot;Users can delete their own builds&quot;
  on builds for delete using (auth.uid() = user_id);
-- POSTS: Public viewable, owner can insert/delete
create policy &quot;Posts are publicly viewable&quot;
  on posts for select using (true);
create policy &quot;Users can create posts&quot;
  on posts for insert with check (auth.uid() = user_id);
create policy &quot;Users can delete their own posts&quot;
  on posts for delete using (auth.uid() = user_id);
-- LIKES: Anyone can read, authenticated users can like
create policy &quot;Likes are publicly viewable&quot;
  on likes for select using (true);
create policy &quot;Authenticated users can like&quot;
  on likes for insert with check (auth.uid() = user_id);
create policy &quot;Users can unlike&quot;
  on likes for delete using (auth.uid() = user_id);
-- COMMENTS: Public read, authenticated write
create policy &quot;Comments are publicly viewable&quot;
  on comments for select using (true);
create policy &quot;Authenticated users can comment&quot;
  on comments for insert with check (auth.uid() = user_id);
create policy &quot;Users can delete their own comments&quot;
  on comments for delete using (auth.uid() = user_id);
---
Key TypeScript Types
// types/database.ts — generate these from Supabase CLI or write manually
export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};
export type Vehicle = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  is_primary: boolean;
};
export type Build = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  title: string;
  description: string | null;
  is_public: boolean;
  total_cost: number;
  build_items?: BuildItem[];
  created_at: string;
};
export type BuildItem = {
  id: string;
  build_id: string;
  category: string;
  part_name: string;
  brand: string | null;
  price: number | null;
  notes: string | null;
  position_x: number;
  position_y: number;
  status: &apos;planned&apos; | &apos;ordered&apos; | &apos;installed&apos;;
};
export type Post = {
  id: string;
  user_id: string;
  build_id: string | null;
  caption: string | null;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: Pick&lt;Profile, &apos;username&apos; | &apos;avatar_url&apos;&gt;; // joined
};
---
Tip: Auto-generate Types from Supabase
After schema is set up, generate TypeScript types automatically
npx supabase gen types typescript --project-id YOUR_PROJECT_ID &gt; types/supabase.ts
