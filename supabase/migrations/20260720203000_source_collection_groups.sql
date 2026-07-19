alter table public.sources
  add column if not exists collection_group text not null default 'automatic';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sources_collection_group_check'
  ) then
    alter table public.sources
      add constraint sources_collection_group_check
      check (collection_group in ('automatic', 'vip_15m'));
  end if;
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sources_vip_collection_contract_check'
  ) then
    alter table public.sources
      add constraint sources_vip_collection_contract_check
      check (
        collection_group <> 'vip_15m'
        or (collector_kind = 'shopApi' and collection_method = 'http')
      );
  end if;
end
$$;

create index if not exists sources_collection_group_enabled_idx
  on public.sources (collection_group, id)
  where enabled = true;

comment on column public.sources.collection_group is
  'Operator-controlled collection group. automatic uses dynamic scheduling; vip_15m targets a healthy 15-minute cadence.';

update public.sources
set collection_group = 'vip_15m',
    updated_at = now()
where id = 'ldxp-youzhi';

create or replace function public.refresh_source_quality_price_benchmarks_if_stale(
  p_max_age_minutes integer default 15
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  latest_computed_at timestamptz;
  max_age interval := make_interval(mins => greatest(5, least(coalesce(p_max_age_minutes, 15), 180)));
begin
  select max(computed_at)
  into latest_computed_at
  from public.source_quality_price_benchmarks;

  if latest_computed_at is not null and latest_computed_at >= now() - max_age then
    return false;
  end if;

  if not pg_try_advisory_xact_lock(19370015) then
    return false;
  end if;

  select max(computed_at)
  into latest_computed_at
  from public.source_quality_price_benchmarks;

  if latest_computed_at is not null and latest_computed_at >= now() - max_age then
    return false;
  end if;

  refresh materialized view public.source_quality_price_benchmarks;
  return true;
end;
$$;

revoke execute on function public.refresh_source_quality_price_benchmarks_if_stale(integer) from anon, authenticated, public;
grant execute on function public.refresh_source_quality_price_benchmarks_if_stale(integer) to service_role;

select public.refresh_source_quality_price_benchmarks();
