create or replace function priceai_channel_submission_key(p_url text)
returns text
language plpgsql
immutable
strict
as $$
declare
  v_url text := btrim(p_url);
  v_host text;
  v_path text;
  v_query text;
begin
  v_url := regexp_replace(v_url, '#.*$', '');
  v_host := lower((regexp_match(v_url, '^https?://(?:www\.)?([^/?#]+)', 'i'))[1]);
  if coalesce(v_host, '') = '' then
    return null;
  end if;

  v_path := coalesce((regexp_match(v_url, '^https?://[^/?#]+([^?#]*)', 'i'))[1], '');
  v_path := regexp_replace(v_path, '/+$', '');
  if v_path = '/' then
    v_path := '';
  end if;

  if v_host = any (array['catfk.com', 'pay.ldxp.cn', 'ldxp.cn', 'pay.qxvx.cn'])
    and v_path ~* '^/shop/' then
    v_path := lower(v_path);
  end if;

  v_query := coalesce((regexp_match(v_url, '\?([^#]*)$'))[1], '');
  return v_host || v_path || case when v_query <> '' then '?' || v_query else '' end;
end;
$$;

alter table channel_submissions
  add column if not exists normalized_url text,
  add column if not exists canonical_channel_key text,
  add column if not exists review_stage text not null default 'submitted',
  add column if not exists duplicate_of_submission_id text references channel_submissions(id) on delete set null,
  add column if not exists preclassification_kind text,
  add column if not exists preclassification jsonb not null default '{}'::jsonb,
  add column if not exists classification_version text,
  add column if not exists classified_at timestamptz;

update channel_submissions
set
  normalized_url = coalesce(nullif(parsed_meta->>'normalized_url', ''), url),
  canonical_channel_key = priceai_channel_submission_key(
    coalesce(nullif(parsed_meta->>'canonical_source_url', ''), nullif(parsed_meta->>'normalized_url', ''), url)
  ),
  review_stage = case
    when status = 'approved' then 'approved'
    when status = 'rejected' then 'rejected'
    else coalesce(nullif(parsed_meta->>'review_stage', ''), 'submitted')
  end,
  duplicate_of_submission_id = case
    when nullif(parsed_meta->>'duplicate_pending_submission_id', '') is distinct from id
      and exists (
        select 1
        from channel_submissions duplicate_target
        where duplicate_target.id = nullif(channel_submissions.parsed_meta->>'duplicate_pending_submission_id', '')
      )
    then nullif(parsed_meta->>'duplicate_pending_submission_id', '')
    else null
  end,
  parsed_meta = case
    when nullif(parsed_meta->>'duplicate_pending_submission_id', '') = id
    then parsed_meta
      - 'duplicate_pending_submission_id'
      - 'duplicate_pending_submission_name'
      - 'duplicate_pending_submission_url'
      - 'duplicate_pending_reason'
    else parsed_meta
  end
where
  normalized_url is null
  or canonical_channel_key is null
  or review_stage = 'submitted'
  or duplicate_of_submission_id is null
  or nullif(parsed_meta->>'duplicate_pending_submission_id', '') = id;

with ranked_pending as (
  select
    id,
    first_value(id) over (
      partition by canonical_channel_key
      order by
        (case when contact is not null then 1 else 0 end
          + case when notes is not null then 1 else 0 end
          + case when name is not null then 1 else 0 end
          + case when parsed_title is not null then 1 else 0 end) desc,
        created_at desc,
        id asc
    ) as preferred_id,
    count(*) over (partition by canonical_channel_key) as duplicate_count
  from channel_submissions
  where status = 'pending'
    and canonical_channel_key is not null
    and duplicate_of_submission_id is null
)
update channel_submissions submissions
set duplicate_of_submission_id = ranked_pending.preferred_id
from ranked_pending
where submissions.id = ranked_pending.id
  and ranked_pending.duplicate_count > 1
  and ranked_pending.id <> ranked_pending.preferred_id;

with classified as (
  select
    id,
    case
      when duplicate_of_submission_id is not null or coalesce(parsed_meta->>'existing_source_id', '') <> '' then 'duplicate'
      when parsed_meta->'probe_result'->>'status' in ('queued', 'running') then 'environment_issue'
      when parsed_meta->'probe_result'->>'status' = 'success'
        and coalesce((parsed_meta->'probe_result'->>'offerCount')::integer, 0) >= 8 then 'priority_approve'
      when parsed_meta->'probe_result'->>'status' = 'success' then 'valuable_lead'
      when parsed_meta->'probe_result'->>'status' = 'empty' then 'low_quality'
      when parsed_meta->'probe_result'->>'status' in ('failed', 'unsupported') then 'needs_review'
      when lower(coalesce(parsed_meta->>'suggested_collector_kind', '')) = 'shopapi' then 'environment_issue'
      else 'needs_review'
    end as kind
  from channel_submissions
  where status = 'pending'
)
update channel_submissions submissions
set
  preclassification_kind = classified.kind,
  preclassification = jsonb_build_object(
    'kind', classified.kind,
    'label', case classified.kind
      when 'duplicate' then '重复/已存在'
      when 'environment_issue' then case
        when submissions.parsed_meta->'probe_result'->>'status' = 'queued' then '已入队试采集'
        when submissions.parsed_meta->'probe_result'->>'status' = 'running' then '采集中'
        else '待低频试采集'
      end
      when 'priority_approve' then '优先通过'
      when 'valuable_lead' then '有价值线索'
      when 'low_quality' then '低质/无优势'
      else '观察/待复核'
    end,
    'tone', case classified.kind
      when 'priority_approve' then 'success'
      when 'valuable_lead' then 'info'
      when 'environment_issue' then 'info'
      when 'low_quality' then 'danger'
      when 'duplicate' then 'warn'
      else 'warn'
    end,
    'reasons', case classified.kind
      when 'duplicate' then jsonb_build_array('同渠道已有待审主记录', '请合并或忽略重复项')
      when 'environment_issue' then jsonb_build_array('等待低频采集节点提供运行证据', '等待期间不按低质处理')
      when 'priority_approve' then jsonb_build_array(
        '试采集样本相对充足',
        '迁移后再次试采会补充完整价格基准'
      )
      when 'valuable_lead' then jsonb_build_array('已获得有效试采集结果', '仍需人工确认价格与商品价值')
      when 'low_quality' then jsonb_build_array('试采集完成但没有可比价商品', '请确认空店、非目标商品或解析不足')
      else jsonb_build_array('已有基础解析，仍需人工复核')
    end,
    'version', '2026-07-18.migration-v1',
    'classifiedAt', now()
  ),
  classification_version = '2026-07-18.migration-v1',
  classified_at = now()
from classified
where submissions.id = classified.id;

create index if not exists channel_submissions_canonical_key_idx
  on channel_submissions(canonical_channel_key, status, created_at desc);

create index if not exists channel_submissions_review_stage_idx
  on channel_submissions(status, review_stage, created_at desc);

create index if not exists channel_submissions_duplicate_of_idx
  on channel_submissions(duplicate_of_submission_id);

create unique index if not exists channel_submissions_pending_root_key_uidx
  on channel_submissions(canonical_channel_key)
  where status = 'pending'
    and duplicate_of_submission_id is null
    and canonical_channel_key is not null;

create or replace function list_submission_price_benchmarks(p_product_ids text[])
returns table (
  product_id text,
  offer_count bigint,
  min_price numeric,
  top5_price numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with valid_offers as (
    select
      offers.canonical_product_id as product_id,
      offers.price,
      row_number() over (
        partition by offers.canonical_product_id
        order by offers.price asc, offers.verified_at desc nulls last, offers.id asc
      ) as price_rank
    from raw_offer_public_state offers
    where offers.canonical_product_id = any(coalesce(p_product_ids, '{}'::text[]))
      and offers.hidden = false
      and offers.status <> 'out_of_stock'
      and offers.price is not null
      and offers.price > 0
      and coalesce(offers.url, '') <> ''
      and coalesce(offers.effective_status, '') not in ('unavailable', 'stale', 'failed')
      and coalesce(offers.freshness_status, '') not in ('expired', 'failed')
      and (offers.expires_at is null or offers.expires_at > now())
  )
  select
    valid_offers.product_id,
    count(*) as offer_count,
    min(valid_offers.price) as min_price,
    max(valid_offers.price) filter (where valid_offers.price_rank <= 5) as top5_price
  from valid_offers
  group by valid_offers.product_id;
$$;

create or replace function finalize_channel_submission_approval(
  p_submission_id text,
  p_source_id text,
  p_parsed_meta jsonb,
  p_reviewed_at timestamptz,
  p_preclassification jsonb,
  p_classification_version text
)
returns setof channel_submissions
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from channel_submissions
    where id = p_submission_id and status = 'pending'
    for update
  ) then
    raise exception '提交记录不存在或已被处理。';
  end if;

  update sources
  set enabled = true, updated_at = p_reviewed_at
  where id = p_source_id;
  if not found then
    raise exception '待启用渠道不存在。';
  end if;

  return query
  update channel_submissions
  set
    status = 'approved',
    review_stage = 'approved',
    approved_source_id = p_source_id,
    parsed_meta = coalesce(p_parsed_meta, '{}'::jsonb),
    reviewed_at = p_reviewed_at,
    preclassification_kind = nullif(p_preclassification->>'kind', ''),
    preclassification = coalesce(p_preclassification, '{}'::jsonb),
    classification_version = p_classification_version,
    classified_at = p_reviewed_at
  where id = p_submission_id
    and status = 'pending'
  returning *;
end;
$$;

revoke execute on function priceai_channel_submission_key(text) from anon, authenticated, public;
revoke execute on function list_submission_price_benchmarks(text[]) from anon, authenticated, public;
revoke execute on function finalize_channel_submission_approval(text, text, jsonb, timestamptz, jsonb, text) from anon, authenticated, public;
grant execute on function priceai_channel_submission_key(text) to service_role;
grant execute on function list_submission_price_benchmarks(text[]) to service_role;
grant execute on function finalize_channel_submission_approval(text, text, jsonb, timestamptz, jsonb, text) to service_role;
