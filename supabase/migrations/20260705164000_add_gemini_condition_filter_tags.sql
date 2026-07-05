do $migration$
declare
  current_definition text;
  next_definition text;
  old_proxy_block constant text := $old$if text_value !~ '(仅支持?网页|只能网页|仅网页|网页号|不支持codex|无法使用codex|不能使用codex|不能直接登录codex|无法直接登录codex|无法codex|codex不售后|不可反代|无法反代|不能反代|不支持反代)'
    and text_value ~ '(可反代|支持反代|反代\+?codex|可用codex|支持codex|直接登录codex|sub2|cpa|api格式|json格式|json文件|sub格式|cpa格式)'
  then
    output := array_append(output, 'proxy_supported');
  end if;$old$;
  new_proxy_block constant text := $new$if text_value !~ '(仅支持?网页|只能网页|仅网页|网页号|不支持codex|无法使用codex|不能使用codex|不能直接登录codex|无法直接登录codex|无法codex|codex不售后|不可反代|无法反代|不能反代|不支持反代)'
    and text_value ~ '(可反代|支持反代|反代\+?codex|可用codex|支持codex|直接登录codex|sub2|cpa|api格式|json格式|json文件|sub格式|cpa格式)'
  then
    output := array_append(output, 'proxy_supported');
  end if;

  if (
      (
        text_value ~ '(包gcp|支持gcp|gcp可用|gcp已开|gcp正常|googlecloud|谷歌云)'
        and text_value !~ '(不包gcp|无gcp|gcp已禁用|gcp禁用|不支持gcp|gcp不可用|不带gcp|不含gcp|不送gcp)'
      )
      or (
        text_value ~ '(包反重力|支持反重力|反重力直接用|反重力可用|可用反重力|antigravity)'
        and text_value !~ '(不包反重力|不支持反重力|反重力不可用|无法反重力|不能反重力|不等于反重力)'
      )
      or (
        text_value ~ '((gemini|googleai|googleaipro|gcp|反重力|antigravity).{0,16}cli|cli.{0,16}(gemini|googleai|googleaipro|gcp|反重力|antigravity)|codeassist)'
        and text_value !~ '(不支持cli|cli不可用|无法cli|不能cli)'
      )
    )
  then
    output := array_append(output, 'gemini_antigravity_gcp');
  end if;

  if text_value !~ '(无需绑定手机|无需绑手机|无须绑定手机|无须绑手机|免绑手机|不用绑手机|不需要绑定手机|不需要绑手机)'
    and text_value ~ '(需要绑定手机|需绑定手机|需要绑手机|需绑手机|绑定手机号|绑定手机|手机号接码|手机接码|长效接码|接码)'
  then
    output := array_append(output, 'gemini_phone_required');
  end if;

  if text_value !~ '(无需申诉|无须申诉|免申诉|不用申诉|不需要申诉|无需注册|无须注册|免注册|不用注册|不需要注册)'
    and text_value ~ '(首登需要申诉|需要申诉|需申诉|申诉|需注册|需要注册|没注册过谷歌|未注册过谷歌|没注册过google|未注册过google)'
  then
    output := array_append(output, 'gemini_appeal_required');
  end if;$new$;
begin
  select pg_get_functiondef('public.priceai_public_offer_filter_tags(text, text[])'::regprocedure)
  into current_definition;

  if position('gemini_antigravity_gcp' in current_definition) > 0 then
    raise notice 'priceai_public_offer_filter_tags already emits Gemini condition tags';
  else
    if position(old_proxy_block in current_definition) = 0 then
      raise exception 'Expected proxy filter tag block was not found';
    end if;

    next_definition := replace(current_definition, old_proxy_block, new_proxy_block);
    execute next_definition;
  end if;
end;
$migration$;

with gemini_condition_candidates as (
  select id
  from raw_offers
  where hidden = false
    and (
      canonical_product_id = 'gemini-pro-year'
      or source_title ~* '(gemini|google[[:space:]]*ai[[:space:]]*pro|pixel|反重力|gcp|google[[:space:]]*cloud|谷歌云)'
    )
    and (
      source_title ~* '(包[[:space:]]*gcp|支持[[:space:]]*gcp|gcp[[:space:]]*可用|gcp[[:space:]]*已开|gcp[[:space:]]*正常|google[[:space:]]*cloud|谷歌云|包反重力|支持反重力|反重力直接用|反重力可用|可用反重力|antigravity|cli|codeassist)'
      or source_title ~* '(需要绑定手机|需绑定手机|需要绑手机|需绑手机|绑定手机号|绑定手机|手机号接码|手机接码|长效接码|接码)'
      or source_title ~* '(首登需要申诉|需要申诉|需申诉|申诉|需注册|需要注册|没注册过谷歌|未注册过谷歌|没注册过google|未注册过google)'
    )
)
update raw_offers
set source_title = raw_offers.source_title
from gemini_condition_candidates
where raw_offers.id = gemini_condition_candidates.id
  and coalesce(raw_offers.public_filter_tags, '{}'::text[]) is distinct from priceai_public_offer_filter_tags(raw_offers.source_title, raw_offers.tags);

delete from public_api_snapshots
where kind in ('explorer', 'offers', 'product_offers');

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
    'reason', 'migration add Gemini condition filter tags',
    'refreshIntervalSeconds', 60,
    'globalDirty', true,
    'fullRefreshRequired', true,
    'affectedProductIds', jsonb_build_array('gemini-pro-year'),
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
grant execute on function priceai_public_offer_filter_tags(text, text[]) to service_role;
