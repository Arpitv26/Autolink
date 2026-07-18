-- AutoLink AI: per-user daily query log for Edge Function rate limiting.

create table if not exists public.ai_query_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query_date date not null default (timezone('utc', now()))::date,
  query_count integer not null default 0 check (query_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, query_date)
);

create index if not exists ai_query_log_user_date_idx
  on public.ai_query_log(user_id, query_date desc);

alter table public.ai_query_log enable row level security;

drop policy if exists "Users can read own ai query log" on public.ai_query_log;
create policy "Users can read own ai query log"
  on public.ai_query_log
  for select
  using (auth.uid() = user_id);

-- Inserts/updates are performed by the Edge Function with the service role
-- (bypasses RLS). No client write policies on purpose.

drop trigger if exists ai_query_log_set_updated_at on public.ai_query_log;
create trigger ai_query_log_set_updated_at
before update on public.ai_query_log
for each row
execute function public.set_updated_at();
