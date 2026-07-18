create or replace function public.list_recent_api_transit_availability_samples(
  p_station_ids text[],
  p_limit_per_scope integer default 60,
  p_since timestamptz default now() - interval '8 days'
)
returns table (
  station_id text,
  scope text,
  standard_model text,
  group_name text,
  ok boolean,
  checked_at timestamptz,
  source_type text
)
language sql
stable
security definer
set search_path = public
as $$
  with deduped as (
    select distinct on (
      sample.station_id,
      sample.scope,
      coalesce(sample.standard_model, ''),
      coalesce(sample.group_name, ''),
      sample.source_type,
      sample.checked_at
    )
      sample.id,
      sample.station_id,
      sample.scope,
      sample.standard_model,
      sample.group_name,
      sample.ok,
      sample.checked_at,
      sample.source_type,
      sample.created_at
    from public.api_transit_availability_samples as sample
    where sample.station_id = any(p_station_ids)
      and sample.checked_at >= p_since
    order by
      sample.station_id,
      sample.scope,
      coalesce(sample.standard_model, ''),
      coalesce(sample.group_name, ''),
      sample.source_type,
      sample.checked_at,
      sample.created_at desc,
      sample.id desc
  ),
  ranked as (
    select
      deduped.*,
      row_number() over (
        partition by
          deduped.station_id,
          deduped.scope,
          coalesce(deduped.standard_model, ''),
          coalesce(deduped.group_name, ''),
          deduped.source_type
        order by deduped.checked_at desc, deduped.created_at desc, deduped.id desc
      ) as sample_rank
    from deduped
  )
  select
    ranked.station_id,
    ranked.scope,
    ranked.standard_model,
    ranked.group_name,
    ranked.ok,
    ranked.checked_at,
    ranked.source_type
  from ranked
  where ranked.sample_rank <= least(greatest(p_limit_per_scope, 1), 60)
  order by ranked.checked_at desc;
$$;

revoke all on function public.list_recent_api_transit_availability_samples(text[], integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.list_recent_api_transit_availability_samples(text[], integer, timestamptz)
  to service_role;

comment on function public.list_recent_api_transit_availability_samples(text[], integer, timestamptz) is
  'Returns the latest deduplicated API transit availability samples per station, scope, model, group, and source.';
