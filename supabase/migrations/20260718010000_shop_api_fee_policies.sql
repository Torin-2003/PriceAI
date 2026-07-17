create table if not exists shop_api_fee_policies (
  source_id text not null references sources(id) on delete cascade,
  shop_token text not null,
  source_name text,
  shop_url text,
  strategy text not null check (strategy in ('no_fee', 'fixed_3pct', 'observed_rate')),
  rate numeric not null check (rate >= 0 and rate <= 0.2),
  sample_size integer not null default 0 check (sample_size >= 0),
  resolved_sample_size integer not null default 0 check (resolved_sample_size >= 0),
  sample_selection text,
  probes jsonb not null default '[]'::jsonb check (jsonb_typeof(probes) = 'array'),
  observed_at timestamptz not null,
  expires_at timestamptz not null,
  collector_node_id text,
  last_seen_run_id text references crawl_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_id, shop_token)
);

create index if not exists shop_api_fee_policies_source_expires_idx
  on shop_api_fee_policies(source_id, expires_at desc);

create index if not exists shop_api_fee_policies_expires_idx
  on shop_api_fee_policies(expires_at);

create index if not exists shop_api_fee_policies_strategy_idx
  on shop_api_fee_policies(strategy);

drop trigger if exists shop_api_fee_policies_set_updated_at on shop_api_fee_policies;
create trigger shop_api_fee_policies_set_updated_at
before update on shop_api_fee_policies
for each row execute function set_updated_at();

alter table shop_api_fee_policies enable row level security;

comment on table shop_api_fee_policies is
  'Persisted shopApi buyer fee policy by source and shop token, reused by collectors to avoid repeated settlement probes.';

with pricing_runs as (
  select
    crawl_runs.id as run_id,
    crawl_runs.source_id,
    crawl_runs.source_name,
    crawl_runs.finished_at,
    crawl_runs.started_at,
    sources.entry_url,
    sources.base_url,
    pricing.value as pricing
  from crawl_runs
  join sources on sources.id = crawl_runs.source_id
  cross join lateral jsonb_array_elements(coalesce(crawl_runs.details->'shopApiPricing', '[]'::jsonb)) as pricing(value)
  where crawl_runs.source_id is not null
    and crawl_runs.status in ('success', 'partial')
),
normalized_pricing as (
  select
    source_id,
    coalesce(
      nullif(pricing->>'shopToken', ''),
      nullif(substring(coalesce(entry_url, base_url, '') from '/shop/([^/?#]+)'), ''),
      'source'
    ) as shop_token,
    source_name,
    coalesce(nullif(pricing->>'shopUrl', ''), entry_url, base_url) as shop_url,
    pricing->>'strategy' as strategy,
    case
      when pricing->>'rate' ~ '^[0-9]+(\.[0-9]+)?$' then (pricing->>'rate')::numeric
      when pricing->>'strategy' = 'no_fee' then 0::numeric
      when pricing->>'strategy' = 'fixed_3pct' then 0.03::numeric
      else null
    end as rate,
    case when pricing->>'sampleSize' ~ '^[0-9]+$' then (pricing->>'sampleSize')::integer else 0 end as sample_size,
    case when pricing->>'resolvedSampleSize' ~ '^[0-9]+$' then (pricing->>'resolvedSampleSize')::integer else 0 end as resolved_sample_size,
    pricing->>'sampleSelection' as sample_selection,
    case when jsonb_typeof(pricing->'probes') = 'array' then pricing->'probes' else '[]'::jsonb end as probes,
    coalesce(finished_at, started_at, now()) as observed_at,
    run_id
  from pricing_runs
  where pricing->>'strategy' in ('no_fee', 'fixed_3pct', 'observed_rate')
    and coalesce(pricing->>'sampleSelection', '') <> 'cached_policy'
    and coalesce(pricing->>'policySource', '') <> 'persisted'
),
latest_pricing as (
  select distinct on (source_id, shop_token)
    source_id,
    shop_token,
    source_name,
    shop_url,
    strategy,
    rate,
    sample_size,
    resolved_sample_size,
    sample_selection,
    probes,
    observed_at,
    observed_at + interval '7 days' as expires_at,
    run_id
  from normalized_pricing
  where resolved_sample_size > 0
    and rate is not null
    and rate >= 0
    and rate <= 0.2
  order by source_id, shop_token, observed_at desc
)
insert into shop_api_fee_policies (
  source_id,
  shop_token,
  source_name,
  shop_url,
  strategy,
  rate,
  sample_size,
  resolved_sample_size,
  sample_selection,
  probes,
  observed_at,
  expires_at,
  last_seen_run_id
)
select
  source_id,
  shop_token,
  source_name,
  shop_url,
  strategy,
  rate,
  sample_size,
  resolved_sample_size,
  sample_selection,
  probes,
  observed_at,
  expires_at,
  run_id
from latest_pricing
on conflict (source_id, shop_token) do update set
  source_name = excluded.source_name,
  shop_url = excluded.shop_url,
  strategy = excluded.strategy,
  rate = excluded.rate,
  sample_size = excluded.sample_size,
  resolved_sample_size = excluded.resolved_sample_size,
  sample_selection = excluded.sample_selection,
  probes = excluded.probes,
  observed_at = excluded.observed_at,
  expires_at = excluded.expires_at,
  last_seen_run_id = excluded.last_seen_run_id,
  updated_at = now();
