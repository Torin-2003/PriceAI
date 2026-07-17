update canonical_products
set
  display_name = 'ChatGPT Plus 日抛 / 成品号',
  summary = 'ChatGPT Plus 日抛主要指短期体验或首登质保的成品号；这里归集短期成品号、网页号、已接码/未接码成品号，以及 Pix/iDEAL/UPI/欧洲渠道报价。购买前重点核对接码状态、可用端和售后限制。',
  aliases = array(
    select distinct alias
    from unnest(
      aliases || array[
        'plus 日抛',
        'plus 日抛号',
        'plus 网页号',
        'plus 已接码',
        'plus 未接码'
      ]::text[]
    ) as new_alias(alias)
    where alias is not null
      and alias <> ''
  ),
  updated_at = now()
where id = 'chatgpt-plus';

delete from public_api_snapshots
where kind = 'explorer'
  or (
    kind = 'product_offers'
    and cache_key like 'v5-plus-account-state-tags:%:chatgpt-plus:limit:30'
  );

insert into public_api_snapshots (
  kind,
  cache_key,
  schema_version,
  payload,
  generated_at,
  updated_at
)
values (
  'refresh_state',
  'public-prices',
  1,
  jsonb_build_object(
    'dirty', true,
    'dirtyAt', now(),
    'reason', 'migration rename ChatGPT Plus daily account product',
    'refreshIntervalSeconds', 60,
    'globalDirty', false,
    'fullRefreshRequired', false,
    'affectedProductIds', jsonb_build_array('chatgpt-plus'),
    'affectedOfferIds', jsonb_build_array(),
    'affectedSourceIds', jsonb_build_array()
  ),
  now(),
  now()
)
on conflict (kind, cache_key) do update set
  schema_version = excluded.schema_version,
  payload = public_api_snapshots.payload || excluded.payload,
  generated_at = excluded.generated_at,
  updated_at = excluded.updated_at;
