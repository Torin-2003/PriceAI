alter table public.api_transit_offers
  add column if not exists availability_scope text,
  add column if not exists availability_match_level text,
  add column if not exists monitoring_scope_id text;

alter table public.api_transit_offers
  drop constraint if exists api_transit_offers_availability_scope_check,
  add constraint api_transit_offers_availability_scope_check
    check (availability_scope is null or availability_scope in ('station', 'group', 'model', 'offer')),
  drop constraint if exists api_transit_offers_availability_match_level_check,
  add constraint api_transit_offers_availability_match_level_check
    check (availability_match_level is null or availability_match_level in ('exact', 'group', 'model', 'family'));

update public.api_transit_offers
set
  availability_match_level = case
    when availability_note like '%同模型族参考%' then 'family'
    when availability_note like '%同模型监测%' or availability_note ilike '%performance summary%' or availability_note ilike '%uptime14d%' then 'model'
    when availability_note like '%同分组监测%' then 'group'
    when availability_source_type = 'public_model_catalog' then 'model'
    when availability_source_type = 'public_status' then 'group'
    else 'exact'
  end,
  availability_scope = case
    when availability_note like '%同分组监测%' then 'group'
    when availability_note like '%同模型监测%' or availability_note like '%同模型族参考%' then 'model'
    when availability_note ilike '%performance summary%' or availability_note ilike '%uptime14d%' then 'model'
    when availability_source_type = 'public_model_catalog' then 'model'
    when availability_source_type = 'priceai_probe' then 'offer'
    when availability_source_type = 'public_status' then 'group'
    else 'offer'
  end
where availability_scope is null or availability_match_level is null;

update public.api_transit_offers
set monitoring_scope_id = concat_ws(
  ':',
  'legacy',
  station_id,
  availability_source_type,
  availability_scope,
  case
    when availability_scope = 'station' then station_id
    when availability_scope = 'group' then group_name
    when availability_scope = 'model' and availability_match_level = 'family' then family
    when availability_scope = 'model' then standard_model
    else concat_ws('|', group_name, standard_model)
  end
)
where monitoring_scope_id is null;

create index if not exists api_transit_offers_monitoring_scope_idx
  on public.api_transit_offers(station_id, monitoring_scope_id)
  where status = 'active' and availability_seven_day_samples > 0;

comment on column public.api_transit_offers.availability_scope is
  'The real evidence scope: station, group, model, or exact offer.';
comment on column public.api_transit_offers.availability_match_level is
  'How the evidence matched this offer: exact, group, model, or family fallback.';
comment on column public.api_transit_offers.monitoring_scope_id is
  'Stable identity shared by offers that reference the same monitoring evidence; used for deduplicated rollups.';
