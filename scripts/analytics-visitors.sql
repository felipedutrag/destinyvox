-- Run AFTER analytics-schema.sql. Safe to repeat; historical sessions stay anonymous.
begin;
alter table public.analytics_events add column if not exists visitor_id uuid;
create index if not exists analytics_events_visitor on public.analytics_events(visitor_id, occurred_at) where visitor_id is not null;
create table if not exists public.analytics_visitors (
  id uuid primary key,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null
);
alter table public.analytics_visitors enable row level security;
revoke all on public.analytics_visitors from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_visitors to service_role;
create or replace function public.analytics_register_visitor()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.visitor_id is not null then
    insert into public.analytics_visitors as v (id, first_seen_at, last_seen_at)
    values (new.visitor_id, new.occurred_at, new.occurred_at)
    on conflict (id) do update set
      first_seen_at = least(v.first_seen_at, excluded.first_seen_at),
      last_seen_at = greatest(v.last_seen_at, excluded.last_seen_at);
  end if;
  return new;
end;
$$;
revoke all on function public.analytics_register_visitor() from public, anon, authenticated;
grant execute on function public.analytics_register_visitor() to service_role;
create or replace trigger analytics_register_visitor
after insert on public.analytics_events
for each row execute function public.analytics_register_visitor();
commit;
-- Optional: schedule alongside existing retention jobs.
-- delete from public.analytics_visitors where last_seen_at < now() - interval '400 days';
