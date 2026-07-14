alter table raw_offers add column if not exists min_order_quantity integer;
alter table raw_offers add column if not exists bulk_pricing_tiers jsonb not null default '[]'::jsonb;

comment on column raw_offers.min_order_quantity is 'Minimum order quantity required by the source storefront when greater than one.';
comment on column raw_offers.bulk_pricing_tiers is 'Structured quantity pricing tiers from the source storefront, normalized as a JSON array.';

create or replace view raw_offer_public_state as
with merged as (
  select
    raw_offers.*,
    raw_offer_confirmations.source_status as confirmation_source_status,
    raw_offer_confirmations.effective_status as confirmation_effective_status,
    raw_offer_confirmations.freshness_status as confirmation_freshness_status,
    raw_offer_confirmations.captured_at as confirmation_captured_at,
    raw_offer_confirmations.last_seen_at as confirmation_last_seen_at,
    raw_offer_confirmations.verified_at as confirmation_verified_at,
    raw_offer_confirmations.expires_at as confirmation_expires_at,
    raw_offer_confirmations.source_priority as confirmation_source_priority,
    raw_offer_confirmations.confidence as confirmation_confidence,
    (
      raw_offers.effective_status = 'unavailable'
      and raw_offers.status <> 'out_of_stock'
      and raw_offers.last_failed_at is null
      and coalesce(raw_offers.failure_reason, '') not like '连续采集失败%'
      and raw_offer_confirmations.effective_status is not null
      and raw_offer_confirmations.effective_status <> raw_offers.effective_status
    ) as prefer_base_unavailable
  from raw_offers
  left join raw_offer_confirmations
    on raw_offer_confirmations.raw_offer_id = raw_offers.id
)
select
  merged.id,
  merged.source_id,
  merged.source_name,
  merged.source_store_name,
  merged.source_title,
  merged.price,
  merged.listed_price,
  merged.fee_amount,
  merged.price_basis,
  merged.currency,
  merged.status,
  case
    when merged.prefer_base_unavailable then merged.source_status
    else coalesce(merged.confirmation_source_status, merged.source_status)
  end as source_status,
  case
    when merged.prefer_base_unavailable then merged.effective_status
    else coalesce(merged.confirmation_effective_status, merged.effective_status)
  end as effective_status,
  case
    when merged.prefer_base_unavailable then merged.freshness_status
    else coalesce(merged.confirmation_freshness_status, merged.freshness_status)
  end as freshness_status,
  merged.url,
  merged.tags,
  merged.public_filter_tags,
  merged.stock_count,
  merged.hidden,
  merged.canonical_product_id,
  merged.category_slug,
  coalesce(merged.confirmation_captured_at, merged.captured_at) as captured_at,
  merged.source_updated_at,
  coalesce(merged.confirmation_last_seen_at, merged.last_seen_at) as last_seen_at,
  coalesce(merged.confirmation_verified_at, merged.verified_at) as verified_at,
  case
    when merged.prefer_base_unavailable then merged.expires_at
    else coalesce(merged.confirmation_expires_at, merged.expires_at)
  end as expires_at,
  case
    when merged.prefer_base_unavailable then merged.source_priority
    else coalesce(merged.confirmation_source_priority, merged.source_priority)
  end as source_priority,
  case
    when merged.prefer_base_unavailable then merged.confidence
    else coalesce(merged.confirmation_confidence, merged.confidence)
  end as confidence,
  merged.last_failed_at,
  merged.failure_reason,
  merged.created_at,
  merged.updated_at,
  merged.min_order_quantity,
  coalesce(merged.bulk_pricing_tiers, '[]'::jsonb) as bulk_pricing_tiers
from merged;

revoke all on table raw_offer_public_state from anon, authenticated, public;
grant select on table raw_offer_public_state to service_role;

drop function if exists list_public_product_offers_page(text, integer, integer);
drop function if exists list_public_product_offers_page_v2(text, text[], text, text, text, numeric, numeric, integer, integer);
drop function if exists list_public_offers_page(text, text, text, text, text, numeric, numeric, integer, integer);

create function list_public_product_offers_page(
  p_product_id text,
  p_limit integer default 80,
  p_offset integer default 0
)
returns table (
  id text,
  source_id text,
  source_name text,
  source_store_name text,
  source_title text,
  price numeric,
  currency text,
  status text,
  url text,
  tags text[],
  stock_count integer,
  min_order_quantity integer,
  bulk_pricing_tiers jsonb,
  hidden boolean,
  canonical_product_id text,
  category_slug text,
  captured_at timestamptz,
  source_updated_at timestamptz,
  last_seen_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  source_priority integer,
  confidence numeric,
  effective_status text,
  freshness_status text,
  last_failed_at timestamptz,
  failure_reason text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      raw_offers.*,
      count(*) over() as total_count,
      case
        when raw_offers.status <> 'out_of_stock'
          and raw_offers.price is not null
          and raw_offers.url <> ''
          and coalesce(raw_offers.effective_status, '') not in ('unavailable', 'stale', 'failed')
          and coalesce(raw_offers.freshness_status, '') not in ('expired', 'failed')
          and (raw_offers.expires_at is null or raw_offers.expires_at > now())
        then 0
        else 1
      end as availability_rank,
      case
        when coalesce(raw_offers.public_filter_tags, priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags)) && array['shared_access', 'domestic_mirror_site']::text[]
        then 1
        else 0
      end as special_delivery_rank,
      coalesce(raw_offers.verified_at, raw_offers.last_seen_at, raw_offers.captured_at, raw_offers.source_updated_at) as public_updated_at,
      coalesce(raw_offers.source_store_name, raw_offers.source_name, '') as public_source_label
    from raw_offer_public_state raw_offers
    where raw_offers.hidden = false
      and raw_offers.canonical_product_id = p_product_id
  )
  select
    ranked.id,
    ranked.source_id,
    ranked.source_name,
    ranked.source_store_name,
    ranked.source_title,
    ranked.price,
    ranked.currency,
    ranked.status,
    ranked.url,
    ranked.tags,
    ranked.stock_count,
    ranked.min_order_quantity,
    ranked.bulk_pricing_tiers,
    ranked.hidden,
    ranked.canonical_product_id,
    ranked.category_slug,
    ranked.captured_at,
    ranked.source_updated_at,
    ranked.last_seen_at,
    ranked.verified_at,
    ranked.expires_at,
    ranked.source_priority,
    ranked.confidence,
    ranked.effective_status,
    ranked.freshness_status,
    ranked.last_failed_at,
    ranked.failure_reason,
    ranked.total_count
  from ranked
  order by
    ranked.availability_rank asc,
    ranked.special_delivery_rank asc,
    ranked.price asc nulls last,
    ranked.public_updated_at desc nulls last,
    ranked.public_source_label asc,
    ranked.source_title asc,
    ranked.url asc,
    ranked.id asc
  limit greatest(least(coalesce(p_limit, 80), 1200), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create function list_public_product_offers_page_v2(
  p_product_id text,
  p_filter_tags text[] default '{}',
  p_query text default null,
  p_exclude_query text default null,
  p_collector text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_limit integer default 80,
  p_offset integer default 0
)
returns table (
  id text,
  source_id text,
  source_name text,
  source_store_name text,
  source_title text,
  price numeric,
  currency text,
  status text,
  url text,
  tags text[],
  stock_count integer,
  min_order_quantity integer,
  bulk_pricing_tiers jsonb,
  hidden boolean,
  canonical_product_id text,
  category_slug text,
  captured_at timestamptz,
  source_updated_at timestamptz,
  last_seen_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  source_priority integer,
  confidence numeric,
  effective_status text,
  freshness_status text,
  last_failed_at timestamptz,
  failure_reason text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with product as (
    select id
    from canonical_products
    where is_active = true
      and (canonical_products.id = p_product_id or canonical_products.slug = p_product_id)
    limit 1
  ),
  filtered as (
    select
      raw_offers.*,
      sources.collector_kind,
      concat_ws(
        ' ',
        raw_offers.source_title,
        raw_offers.source_name,
        raw_offers.source_store_name,
        raw_offers.url,
        array_to_string(raw_offers.tags, ' ')
      ) as public_haystack,
      case
        when sources.collector_kind = 'shopApi' then 'shopApi'
        when sources.collector_kind = 'dujiao' then 'dujiao'
        when sources.collector_kind = 'kami' then 'kami'
        else 'other'
      end as collector_group
    from raw_offer_public_state raw_offers
    join product on product.id = raw_offers.canonical_product_id
    left join sources on sources.id = raw_offers.source_id
    where raw_offers.hidden = false
  ),
  ranked as (
    select
      filtered.*,
      count(*) over() as total_count,
      case
        when filtered.status <> 'out_of_stock'
          and filtered.price is not null
          and filtered.url <> ''
          and coalesce(filtered.effective_status, '') not in ('unavailable', 'stale', 'failed')
          and coalesce(filtered.freshness_status, '') not in ('expired', 'failed')
          and (filtered.expires_at is null or filtered.expires_at > now())
        then 0
        else 1
      end as availability_rank,
      case
        when filtered.public_filter_tags && array['shared_access', 'domestic_mirror_site']::text[]
        then 1
        else 0
      end as special_delivery_rank,
      coalesce(filtered.verified_at, filtered.last_seen_at, filtered.captured_at, filtered.source_updated_at) as public_updated_at,
      coalesce(filtered.source_store_name, filtered.source_name, '') as public_source_label
    from filtered
    where (coalesce(array_length(p_filter_tags, 1), 0) = 0 or filtered.public_filter_tags @> p_filter_tags)
      and (p_query is null or trim(p_query) = '' or filtered.public_haystack ilike ('%' || trim(p_query) || '%'))
      and (
        p_exclude_query is null
        or trim(p_exclude_query) = ''
        or not exists (
          select 1
          from regexp_split_to_table(trim(p_exclude_query), '[,，[:space:]]+') as excluded_term(term)
          where excluded_term.term <> ''
            and filtered.public_haystack ilike ('%' || excluded_term.term || '%')
        )
      )
      and (p_collector is null or trim(p_collector) = '' or p_collector = 'all' or filtered.collector_group = p_collector)
      and (p_min_price is null or filtered.price >= p_min_price)
      and (p_max_price is null or filtered.price <= p_max_price)
  )
  select
    ranked.id,
    ranked.source_id,
    ranked.source_name,
    ranked.source_store_name,
    ranked.source_title,
    ranked.price,
    ranked.currency,
    ranked.status,
    ranked.url,
    ranked.tags,
    ranked.stock_count,
    ranked.min_order_quantity,
    ranked.bulk_pricing_tiers,
    ranked.hidden,
    ranked.canonical_product_id,
    ranked.category_slug,
    ranked.captured_at,
    ranked.source_updated_at,
    ranked.last_seen_at,
    ranked.verified_at,
    ranked.expires_at,
    ranked.source_priority,
    ranked.confidence,
    ranked.effective_status,
    ranked.freshness_status,
    ranked.last_failed_at,
    ranked.failure_reason,
    ranked.total_count
  from ranked
  order by
    ranked.availability_rank asc,
    ranked.special_delivery_rank asc,
    ranked.price asc nulls last,
    ranked.public_updated_at desc nulls last,
    ranked.public_source_label asc,
    ranked.source_title asc,
    ranked.url asc,
    ranked.id asc
  limit greatest(least(coalesce(p_limit, 80), 1200), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create function list_public_offers_page(
  p_query text default null,
  p_platform text default null,
  p_product_type text default null,
  p_stock text default null,
  p_sort text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_limit integer default 80,
  p_offset integer default 0
)
returns table (
  id text,
  source_id text,
  source_name text,
  source_store_name text,
  source_title text,
  price numeric,
  currency text,
  status text,
  url text,
  tags text[],
  stock_count integer,
  min_order_quantity integer,
  bulk_pricing_tiers jsonb,
  hidden boolean,
  canonical_product_id text,
  category_slug text,
  captured_at timestamptz,
  source_updated_at timestamptz,
  last_seen_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  source_priority integer,
  confidence numeric,
  effective_status text,
  freshness_status text,
  last_failed_at timestamptz,
  failure_reason text,
  product_id text,
  product_slug text,
  product_display_name text,
  product_platform text,
  product_type text,
  product_spec text,
  product_summary text,
  product_updated_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select
      raw_offers.*,
      canonical_products.id as product_id,
      canonical_products.slug as product_slug,
      canonical_products.display_name as product_display_name,
      canonical_products.platform as product_platform,
      canonical_products.product_type,
      canonical_products.spec as product_spec,
      canonical_products.summary as product_summary,
      canonical_products.updated_at as product_updated_at,
      case
        when raw_offers.status <> 'out_of_stock'
          and raw_offers.price is not null
          and raw_offers.url <> ''
          and coalesce(raw_offers.effective_status, '') not in ('unavailable', 'stale', 'failed')
          and coalesce(raw_offers.freshness_status, '') not in ('expired', 'failed')
          and (raw_offers.expires_at is null or raw_offers.expires_at > now())
        then true
        else false
      end as is_public_available,
      case
        when coalesce(raw_offers.public_filter_tags, priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags)) @> array['shared_access']::text[]
        then 1
        else 0
      end as shared_access_rank,
      coalesce(raw_offers.verified_at, raw_offers.last_seen_at, raw_offers.captured_at, raw_offers.source_updated_at) as public_updated_at,
      coalesce(raw_offers.source_store_name, raw_offers.source_name, '') as public_source_label,
      priceai_public_offer_dedupe_key(
        raw_offers.canonical_product_id,
        raw_offers.url,
        raw_offers.source_title,
        raw_offers.price
      ) as public_dedupe_key,
      concat_ws(
        ' ',
        raw_offers.source_title,
        raw_offers.source_name,
        raw_offers.source_store_name,
        raw_offers.url,
        substring(raw_offers.url from '/item/([^/?#]+)'),
        substring(raw_offers.url from '[?&]commodity=([^&#]+)'),
        substring(raw_offers.url from '[?&]id=([^&#]+)'),
        canonical_products.display_name,
        canonical_products.platform,
        canonical_products.product_type,
        canonical_products.spec
      ) as public_haystack
    from raw_offers
    join canonical_products on canonical_products.id = raw_offers.canonical_product_id
    where raw_offers.hidden = false
      and canonical_products.is_active = true
      and (p_platform is null or p_platform = '' or p_platform = '全部' or canonical_products.platform = p_platform)
      and (p_product_type is null or p_product_type = '' or p_product_type = '全部' or canonical_products.product_type = p_product_type)
      and (p_min_price is null or raw_offers.price >= p_min_price)
      and (p_max_price is null or raw_offers.price <= p_max_price)
  ),
  matched_filter as (
    select *
    from filtered
    where (p_query is null or trim(p_query) = '' or filtered.public_haystack ilike ('%' || trim(p_query) || '%'))
      and (p_stock is null or p_stock = '' or p_stock = 'all'
        or (p_stock = 'available' and filtered.is_public_available = true)
        or (p_stock = 'out_of_stock' and filtered.is_public_available = false))
  ),
  deduped as (
    select *
    from (
      select
        matched_filter.*,
        row_number() over (
          partition by matched_filter.public_dedupe_key
          order by
            case when matched_filter.is_public_available then 0 else 1 end asc,
            matched_filter.shared_access_rank asc,
            matched_filter.source_priority desc nulls last,
            matched_filter.confidence desc nulls last,
            matched_filter.public_updated_at desc nulls last,
            matched_filter.public_source_label asc,
            matched_filter.source_title asc,
            matched_filter.url asc,
            matched_filter.id asc
        ) as dedupe_rank
      from matched_filter
    ) ranked_dedupe
    where ranked_dedupe.dedupe_rank = 1
  ),
  matched as (
    select
      deduped.*,
      count(*) over() as total_count
    from deduped
  )
  select
    matched.id,
    matched.source_id,
    matched.source_name,
    matched.source_store_name,
    matched.source_title,
    matched.price,
    matched.currency,
    matched.status,
    matched.url,
    matched.tags,
    matched.stock_count,
    matched.min_order_quantity,
    matched.bulk_pricing_tiers,
    matched.hidden,
    matched.canonical_product_id,
    matched.category_slug,
    matched.captured_at,
    matched.source_updated_at,
    matched.last_seen_at,
    matched.verified_at,
    matched.expires_at,
    matched.source_priority,
    matched.confidence,
    matched.effective_status,
    matched.freshness_status,
    matched.last_failed_at,
    matched.failure_reason,
    matched.product_id,
    matched.product_slug,
    matched.product_display_name,
    matched.product_platform,
    matched.product_type,
    matched.product_spec,
    matched.product_summary,
    matched.product_updated_at,
    matched.total_count
  from matched
  order by
    case matched.product_platform
      when 'ChatGPT' then 1
      when 'Claude' then 2
      when 'Gemini' then 3
      when 'Grok' then 4
      when 'Google' then 5
      when 'API/CDK' then 6
      when '邮箱' then 7
      when '接码' then 8
      when '其他' then 99
      else 50
    end asc,
    case when p_sort = 'updated' then null else case when matched.is_public_available then 0 else 1 end end asc nulls last,
    case when p_sort = 'updated' then matched.public_updated_at end desc nulls last,
    case when p_sort = 'channels' then matched.public_source_label end asc nulls last,
    case when p_sort = 'updated' or p_sort = 'channels' then null else case when matched.is_public_available then matched.shared_access_rank else 0 end end asc nulls last,
    case when p_sort = 'price' or p_sort is null or p_sort = '' or p_sort = 'available_price' then matched.price end asc nulls last,
    matched.public_updated_at desc nulls last,
    matched.public_source_label asc,
    matched.source_title asc,
    matched.url asc,
    matched.id asc
  limit greatest(least(coalesce(p_limit, 80), 1200), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function list_public_product_offers_page(text, integer, integer) from anon, authenticated, public;
revoke execute on function list_public_product_offers_page_v2(text, text[], text, text, text, numeric, numeric, integer, integer) from anon, authenticated, public;
revoke execute on function list_public_offers_page(text, text, text, text, text, numeric, numeric, integer, integer) from anon, authenticated, public;

grant execute on function list_public_product_offers_page(text, integer, integer) to service_role;
grant execute on function list_public_product_offers_page_v2(text, text[], text, text, text, numeric, numeric, integer, integer) to service_role;
grant execute on function list_public_offers_page(text, text, text, text, text, numeric, numeric, integer, integer) to service_role;
