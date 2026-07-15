update canonical_products
set
  display_name = 'ChatGPT Plus 低价订阅 / 试用成品号',
  summary = 'ChatGPT Plus 低价订阅、试用成品号、短期号、荷兰 iDEAL、欧洲、印度 UPI 或巴西 Pix 渠道报价。',
  updated_at = now()
where id = 'chatgpt-plus';

update canonical_products
set
  display_name = 'ChatGPT Plus 正价代充',
  summary = 'ChatGPT Plus 正价代充、官方地区价、App Store 内购、菲区卡充、美区 iOS、直充、代充或续费渠道。',
  updated_at = now()
where id = 'chatgpt-plus-recharge';

do $migration$
declare
  current_definition text;
  next_definition text;
  old_delivery_account_block constant text := $old$if text_value !~ '(非成品|不是成品|非账号|不是账号|非账户|不是账户|不交付账号|不发账号|不提供账号|不含账号|无需账号|自备账号|自备号|自己账号|自己的账号|到自己账号|冲自己号|充值自己号|给自己号)'
    and title_text !~ '(自助充值|自助开通|自助领取|自助激活|自动充值|自动开通|自动激活|全自动激活|全自动开通|免费试用资格|试用资格|资格新号|仅支持新号|老号有试用|新号都可以|充值渠道非成品|非成品|自备账号|国内镜像站|国内镜像|网页镜像|镜像站|镜像|mirror|拼车|团购|拼团|车位|多人共享|多人共用|多人体验号)'
    and title_text ~ '(成品号|成品账号|成品帐号|成品会员账号|成品|账号购买|账号|帐号|账户|账密|独享号|独享账号|独享账户|库存号|会员号|普通号|普号|白号|网页号|半成品|首登|保首登|质保首登|直登|未接码|已接码|已接|未接|带2fa|带二验|可二验|已绑手机|未绑手机)'
  then
    output := array_append(output, 'delivery_account');
  end if;$old$;
  new_delivery_account_block constant text := $new$if text_value !~ '(非成品|不是成品|非账号|不是账号|非账户|不是账户|不交付账号|不发账号|不提供账号|不含账号|无需账号|自备账号|自备号|自己账号|自己的账号|到自己账号|冲自己号|充值自己号|给自己号)'
    and title_text !~ '(自助充值|自助开通|自助领取|自助激活|自动充值|自动开通|自动激活|全自动激活|全自动开通|免费试用资格|试用资格|资格新号|仅支持新号|老号有试用|新号都可以|充值渠道非成品|非成品|自备账号|国内镜像站|国内镜像|网页镜像|镜像站|镜像|mirror|拼车|团购|拼团|车位|多人共享|多人共用|多人体验号)'
    and title_text ~ '(成品号|成品账号|成品帐号|成品会员账号|成品|账号购买|账号|帐号|账户|账密|独享号|独享账号|独享账户|库存号|会员号|普通号|普号|白号|网页号|半成品|首登|保首登|质保首登|直登|未接码|已接码|已接|未接|带2fa|带二验|可二验|已绑手机|未绑手机)'
  then
    output := array_append(output, 'delivery_account');
  end if;

  if text_value ~ '(18个月|十八个月|1\.5年|一年半)'
    and text_value ~ '(提链|提取链接|提取优惠链接|优惠链接|活动链接|领取链接|兑换链接|激活链接|链接|jio|googleone)'
  then
    output := array_append(output, 'gemini_18_month_link');
  elsif text_value ~ '(12个月|十二个月|一年|1年|365天|三百六十五天|年卡|年度|全年)'
    and text_value !~ '(18个月|十八个月|1\.5年|一年半)'
    and text_value !~ '(不含绑卡|无绑卡|无需绑卡|免绑卡|不包绑卡|自行绑卡|自己绑卡)'
    and text_value ~ '(含绑卡|包绑卡|包含绑卡|带绑卡|代绑卡|绑卡完成|绑定卡|自动订阅|自动开通|包开通|代开通|全包)'
  then
    output := array_append(output, 'gemini_12_month_card_binding');
  elsif text_value ~ '(12个月|十二个月|一年|1年|365天|三百六十五天|年卡|年度|全年)'
    and text_value !~ '(18个月|十八个月|1\.5年|一年半)'
    and text_value ~ '(提链|提取链接|提取优惠链接|优惠链接|活动链接|领取链接|兑换链接|激活链接|链接|jio|googleone)'
    and (
      text_value !~ '(含绑卡|包绑卡|包含绑卡|带绑卡|代绑卡|绑卡完成|绑定卡|自动订阅|自动开通|包开通|代开通|全包)'
      or text_value ~ '(不含绑卡|无绑卡|无需绑卡|免绑卡|不包绑卡|自行绑卡|自己绑卡)'
    )
  then
    output := array_append(output, 'gemini_12_month_link');
  end if;

  if text_value ~ '(巴西|brazil|巴西区)'
    and text_value ~ '((^|[^a-z])pix([^a-z]|$)|pix渠道|pix充值|巴西pix)'
  then
    output := array_append(output, 'chatgpt_plus_brazil_pix');
  elsif text_value ~ '(荷兰|netherlands|holland|nl区|荷区)'
    and text_value ~ '(ideal|i-deal|i/deal)'
  then
    output := array_append(output, 'chatgpt_plus_netherlands_ideal');
  elsif text_value ~ '(印度|india|印度区)'
    and text_value ~ '((^|[^a-z])upi([^a-z]|$)|upi渠道|upi扫码|印度upi)'
  then
    output := array_append(output, 'chatgpt_plus_india_upi');
  elsif text_value ~ '(欧洲渠道|欧洲|欧区|欧盟|奥地利|austria|at未接码|at渠道|at号)' then
    output := array_append(output, 'chatgpt_plus_europe_channel');
  end if;

  if text_value ~ '(菲区|菲律宾|菲律宾区|philippines|ph区)'
    and text_value ~ '(卡充|卡冲|卡付|卡密|cdk|官方充值|充值|代充|直充)'
  then
    output := array_append(output, 'chatgpt_plus_recharge_ph_card');
  elsif text_value ~ '(美区|美国|美国区|us区|usa|u\.s\.)'
    and text_value ~ '(ios|appstore|app-store|内购|苹果内购)'
  then
    output := array_append(output, 'chatgpt_plus_recharge_us_ios');
  elsif text_value ~ '(官方直充|官方充值|官方代充|官方订阅|正价代充|正规充值|正规官方|官网直充|官网代充|人工直充|自动直充|带账单|质保订阅)' then
    output := array_append(output, 'chatgpt_plus_recharge_official_direct');
  end if;$new$;
begin
  select pg_get_functiondef('public.priceai_public_offer_filter_tags(text, text[])'::regprocedure)
  into current_definition;

  if position('gemini_12_month_link' in current_definition) > 0 then
    raise notice 'priceai_public_offer_filter_tags already emits AI subscription quick tags';
  else
    if position(old_delivery_account_block in current_definition) = 0 then
      raise exception 'Expected delivery-account filter tag block was not found';
    end if;

    next_definition := replace(current_definition, old_delivery_account_block, new_delivery_account_block);
    execute next_definition;
  end if;
end;
$migration$;

create or replace function list_public_product_offer_filter_facets(
  p_product_id text
)
returns table (
  tag_id text,
  offer_count bigint
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
  tag_rows as (
    select distinct
      priceai_public_offer_dedupe_key(
        raw_offers.canonical_product_id,
        raw_offers.url,
        raw_offers.source_title,
        raw_offers.price
      ) as offer_key,
      unnest(raw_offers.public_filter_tags) as tag_id
    from raw_offers
    join product on product.id = raw_offers.canonical_product_id
    where raw_offers.hidden = false
      and coalesce(array_length(raw_offers.public_filter_tags, 1), 0) > 0
  )
  select
    tag_rows.tag_id,
    count(*) as offer_count
  from tag_rows
  where tag_rows.tag_id is not null
    and tag_rows.tag_id <> ''
  group by tag_rows.tag_id
  order by array_position(
    array[
      'shared_access',
      'domestic_mirror_site',
      'delivery_recharge',
      'delivery_account',
      'gemini_12_month_link',
      'gemini_12_month_card_binding',
      'gemini_18_month_link',
      'chatgpt_plus_brazil_pix',
      'chatgpt_plus_netherlands_ideal',
      'chatgpt_plus_india_upi',
      'chatgpt_plus_europe_channel',
      'chatgpt_plus_recharge_ph_card',
      'chatgpt_plus_recharge_us_ios',
      'chatgpt_plus_recharge_official_direct',
      'team_k12',
      'team_bug',
      'team_official',
      'duration_trial',
      'duration_month',
      'duration_quarter',
      'duration_half_year',
      'duration_year',
      'verification_single',
      'verification_short',
      'verification_long',
      'verification_monthly',
      'telegram_region_us',
      'telegram_region_india',
      'telegram_premium_quarter',
      'telegram_premium_half_year',
      'telegram_premium_year',
      'telegram_stars',
      'proxy_supported',
      'gemini_antigravity_gcp',
      'gemini_phone_required',
      'gemini_appeal_required',
      'warranty_long'
    ]::text[],
    tag_rows.tag_id
  ),
  tag_rows.tag_id;
$$;

do $refresh_public_filter_tags$
declare
  refreshed_rows integer := 0;
begin
  loop
    with stale_offers as (
      select id
      from raw_offers
      where canonical_product_id in ('gemini-pro-recharge', 'chatgpt-plus', 'chatgpt-plus-recharge')
        and coalesce(public_filter_tags, '{}'::text[]) is distinct from priceai_public_offer_filter_tags(source_title, tags)
      order by id
      limit 500
      for update skip locked
    )
    update raw_offers
    set updated_at = now()
    from stale_offers
    where raw_offers.id = stale_offers.id;

    get diagnostics refreshed_rows = row_count;
    exit when refreshed_rows = 0;
  end loop;
end;
$refresh_public_filter_tags$;

delete from public_api_snapshots
where kind in ('explorer', 'offers', 'product_offers', 'merchants');

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
    'reason', 'migration add AI subscription quick filter tags',
    'refreshIntervalSeconds', 60,
    'globalDirty', false,
    'fullRefreshRequired', false,
    'affectedProductIds', jsonb_build_array('gemini-pro-recharge', 'chatgpt-plus', 'chatgpt-plus-recharge'),
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

revoke execute on function priceai_public_offer_filter_tags(text, text[]) from anon, public;
revoke execute on function list_public_product_offer_filter_facets(text) from anon, authenticated, public;
grant execute on function priceai_public_offer_filter_tags(text, text[]) to service_role;
grant execute on function list_public_product_offer_filter_facets(text) to service_role;
