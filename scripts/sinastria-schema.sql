-- Execute no SQL Editor do Supabase antes de publicar /sinastria.
-- A transação inteira é reversível em caso de erro. Não altera compras existentes.
begin;

create table if not exists public.relationship_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 150),
  birth_date date not null check (birth_date >= date '1900-01-01'),
  created_at timestamptz not null default now(),
  unique (user_id, name, birth_date)
);
create table if not exists public.synastry_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  map_id uuid not null references public.numerology_maps(id) on delete cascade,
  person_id uuid not null references public.relationship_people(id),
  payment_id uuid not null unique references public.payments(id),
  report jsonb not null check (jsonb_typeof(report) = 'object'),
  created_at timestamptz not null default now(),
  unique (map_id, person_id)
);
create index if not exists synastry_reports_user_idx on public.synastry_reports(user_id);
create index if not exists synastry_reports_person_idx on public.synastry_reports(person_id);
create index if not exists payments_synastry_source_idx on public.payments(user_id, (metadata->>'sourceMapId')) where status = 'PAID';
create index if not exists payments_synastry_map_idx on public.payments(user_id, map_id) where status = 'PAID';
alter table public.relationship_people enable row level security;
alter table public.synastry_reports enable row level security;
revoke all on public.relationship_people, public.synastry_reports from public, anon, authenticated;
grant select on public.relationship_people, public.synastry_reports to authenticated;
grant all on public.relationship_people, public.synastry_reports to service_role;
drop policy if exists relationship_people_owner_read on public.relationship_people;
create policy relationship_people_owner_read on public.relationship_people for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists synastry_reports_owner_read on public.synastry_reports;
create policy synastry_reports_owner_read on public.synastry_reports for select to authenticated using ((select auth.uid()) = user_id);

-- Server only: invoker, not definer. Ownership checked again inside the transaction.
-- Locking the source map serializes all comparisons for it. The payment unique
-- constraint is the final safeguard against double spending across requests.
create or replace function public.create_synastry(p_user uuid, p_map uuid, p_person uuid, p_report jsonb)
returns public.synastry_reports
language plpgsql security invoker set search_path = '' as $$
declare
  result public.synastry_reports;
  credit uuid;
begin
  perform id from public.numerology_maps
    where id = p_map and user_id = p_user and status = 'completed'
      and coalesce(full_interpretation->'purchase'->>'product', 'map') = 'map'
    for update;
  if not found then raise exception 'MAP_NOT_FOUND'; end if;
  perform id from public.relationship_people where id = p_person and user_id = p_user;
  if not found then raise exception 'PERSON_NOT_FOUND'; end if;
  select * into result from public.synastry_reports where map_id = p_map and person_id = p_person and user_id = p_user;
  if found then return result; end if;
  select p.id into credit from public.payments p
    where p.user_id = p_user and p.status = 'PAID'
      and (
        (p.map_id = p_map and p.metadata->>'product' = 'map' and p.metadata->'bumps' @> '["synastry"]'::jsonb)
        or (p.metadata->>'product' = 'synastry_credit' and p.metadata->>'sourceMapId' = p_map::text)
      )
      and not exists (select 1 from public.synastry_reports r where r.payment_id = p.id)
    order by p.created_at, p.id limit 1 for update of p;
  if credit is null then raise exception 'NO_CREDIT'; end if;
  insert into public.synastry_reports(user_id, map_id, person_id, payment_id, report)
    values (p_user, p_map, p_person, credit, p_report) returning * into result;
  return result;
end;
$$;
revoke all on function public.create_synastry(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_synastry(uuid, uuid, uuid, jsonb) to service_role;
commit;
