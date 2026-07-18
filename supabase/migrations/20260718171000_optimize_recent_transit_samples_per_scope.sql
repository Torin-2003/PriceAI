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
  with base_scopes as (
    select distinct
      offer.station_id,
      requested_scope.scope,
      offer.standard_model,
      offer.group_name
    from public.api_transit_offers as offer
    cross join (values ('station'::text), ('offer'::text)) as requested_scope(scope)
    where offer.station_id = any(p_station_ids)
      and offer.status = 'active'
      and offer.availability_seven_day_samples > 0

    union

    select
      station.id,
      'station'::text,
      null::text,
      null::text
    from public.api_transit_stations as station
    where station.id = any(p_station_ids)
      and station.published = true
      and station.availability_seven_day_samples > 0
  ),
  requested_scopes as (
    select
      base_scope.station_id,
      base_scope.scope,
      base_scope.standard_model,
      base_scope.group_name,
      source.source_type
    from base_scopes as base_scope
    cross join (
      values
        ('public_status'::text),
        ('priceai_probe'::text),
        ('partner_api'::text),
        ('public_model_catalog'::text),
        ('unknown'::text)
    ) as source(source_type)
  )
  select
    requested_scope.station_id,
    requested_scope.scope,
    requested_scope.standard_model,
    requested_scope.group_name,
    recent.ok,
    recent.checked_at,
    requested_scope.source_type
  from requested_scopes as requested_scope
  cross join lateral (
    select deduped.ok, deduped.checked_at
    from (
      select distinct on (candidate.checked_at)
        candidate.ok,
        candidate.checked_at,
        candidate.created_at,
        candidate.id
      from (
        select
          sample.ok,
          sample.checked_at,
          sample.created_at,
          sample.id
        from public.api_transit_availability_samples as sample
        where sample.station_id = requested_scope.station_id
          and sample.scope = requested_scope.scope
          and sample.standard_model is not distinct from requested_scope.standard_model
          and sample.group_name is not distinct from requested_scope.group_name
          and coalesce(sample.source_type, 'unknown') = requested_scope.source_type
          and sample.checked_at >= p_since
        order by sample.checked_at desc, sample.created_at desc, sample.id desc
        limit least(greatest(p_limit_per_scope, 1), 60) * 4
      ) as candidate
      order by candidate.checked_at desc, candidate.created_at desc, candidate.id desc
    ) as deduped
    order by deduped.checked_at desc
    limit least(greatest(p_limit_per_scope, 1), 60)
  ) as recent
  order by recent.checked_at desc;
$$;

revoke all on function public.list_recent_api_transit_availability_samples(text[], integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.list_recent_api_transit_availability_samples(text[], integer, timestamptz)
  to service_role;

comment on function public.list_recent_api_transit_availability_samples(text[], integer, timestamptz) is
  'Returns indexed top-N API transit samples for current monitored scopes without scanning the full lookback window.';
