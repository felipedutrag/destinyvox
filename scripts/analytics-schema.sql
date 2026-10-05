-- Execute in the Supabase SQL Editor. Safe to run again. No existing commerce data is changed.
-- Then execute analytics-visitors.sql to enable the current visitor-aware collector.
begin;
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  session_id uuid not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  name text not null check (length(name) between 1 and 60),
  path text not null check (length(path) <= 100),
  section text not null default '' check (length(section) <= 100),
  target text not null default '' check (length(target) <= 100),
  value integer not null default 0 check (value between 0 and 86400000),
  context jsonb not null default '{}'::jsonb check (octet_length(context::text) <= 2000)
);
create index if not exists analytics_events_time on public.analytics_events (occurred_at, id);
create index if not exists analytics_events_session on public.analytics_events (session_id, occurred_at);
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from public, anon, authenticated;
grant select, insert, delete on public.analytics_events to service_role;
grant usage, select on sequence public.analytics_events_id_seq to service_role;

-- Shared across server instances; raw IP addresses are never stored.
create table if not exists public.analytics_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);
alter table public.analytics_limits enable row level security;
revoke all on public.analytics_limits from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_limits to service_role;
create or replace function public.analytics_allow(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  if p_limit < 1 or p_seconds < 1 or length(p_key) > 150 then return false; end if;
  insert into public.analytics_limits as bucket (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when bucket.window_start < now() - make_interval(secs => p_seconds) then 1 else bucket.hits + 1 end,
    window_start = case when bucket.window_start < now() - make_interval(secs => p_seconds) then now() else bucket.window_start end
  returning hits into n;
  return n <= p_limit;
end;
$$;
revoke all on function public.analytics_allow(text, integer, integer) from public, anon, authenticated;
grant execute on function public.analytics_allow(text, integer, integer) to service_role;
commit;

-- Optional retention job (schedule daily with your existing scheduler):
-- delete from public.analytics_events where occurred_at < now() - interval '90 days';
-- delete from public.analytics_limits where window_start < now() - interval '2 days';
