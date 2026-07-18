-- AutoLink Social Feed: posts, likes, comments, follows, counters, and image storage.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text check (caption is null or char_length(caption) <= 2200),
  image_urls text[] not null default '{}'
    check (cardinality(image_urls) between 0 and 5),
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_user_created_idx on public.posts(user_id, created_at desc);
create index if not exists likes_user_created_idx on public.likes(user_id, created_at desc);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at asc);
create index if not exists comments_parent_idx on public.comments(parent_id);
create index if not exists follows_following_idx on public.follows(following_id);

create or replace function public.protect_post_counters()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.likes_count is distinct from old.likes_count
    or new.comments_count is distinct from old.comments_count
  ) and current_user not in ('postgres', 'service_role', 'supabase_admin')
  then
    raise exception 'Post counters are server-managed';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_protect_counters on public.posts;
create trigger posts_protect_counters
before update on public.posts
for each row
execute function public.protect_post_counters();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
before update on public.comments
for each row
execute function public.set_updated_at();

create or replace function public.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id;
    return new;
  end if;

  update public.posts
  set likes_count = greatest(0, likes_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists likes_update_post_count on public.likes;
create trigger likes_update_post_count
after insert or delete on public.likes
for each row
execute function public.update_post_like_count();

create or replace function public.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id;
    return new;
  end if;

  update public.posts
  set comments_count = greatest(0, comments_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists comments_update_post_count on public.comments;
create trigger comments_update_post_count
after insert or delete on public.comments
for each row
execute function public.update_post_comment_count();

create or replace function public.validate_comment_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and not exists (
    select 1
    from public.comments parent_comment
    where parent_comment.id = new.parent_id
      and parent_comment.post_id = new.post_id
  ) then
    raise exception 'Comment parent must belong to the same post';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_validate_parent on public.comments;
create trigger comments_validate_parent
before insert or update on public.comments
for each row
execute function public.validate_comment_parent();

create or replace function public.protect_comment_relations()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.post_id is distinct from old.post_id
    or new.user_id is distinct from old.user_id
  then
    raise exception 'Comment post and author cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_protect_relations on public.comments;
create trigger comments_protect_relations
before update on public.comments
for each row
execute function public.protect_comment_relations();

alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
  on public.posts for select
  using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
  on public.posts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own
  on public.posts for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists likes_select_public on public.likes;
create policy likes_select_public
  on public.likes for select
  using (true);

drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own
  on public.likes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own
  on public.likes for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists comments_select_public on public.comments;
create policy comments_select_public
  on public.comments for select
  using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
  on public.comments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own
  on public.comments for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own
  on public.comments for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists follows_select_public on public.follows;
create policy follows_select_public
  on public.follows for select
  using (true);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own
  on public.follows for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own
  on public.follows for delete to authenticated
  using (auth.uid() = follower_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_images_select_public on storage.objects;
create policy post_images_select_public
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists post_images_insert_own on storage.objects;
create policy post_images_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists post_images_update_own on storage.objects;
create policy post_images_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists post_images_delete_own on storage.objects;
create policy post_images_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
