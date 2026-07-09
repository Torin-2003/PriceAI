do $migration$
declare
  current_definition text;
  next_definition text;
  old_team_block constant text := $old$if text_value ~ 'k12' then
    output := array_append(output, 'team_k12');
  end if;

  if text_value ~ '(bugteam|teambug|bug号|bug號|漏洞)' then
    output := array_append(output, 'team_bug');
  end if;

  if text_value ~ '(正价|正规官方|官方.{0,12}(team|business|团队|席位)|business\(team\)|gptbusiness|48个月|48月|四十八个月|4年|四年|全程质保订阅|无限续费|可无限续费|可用pro模型额度比plus高|首次激活码|续费码)' then
    output := array_append(output, 'team_official');
  end if;$old$;
  new_team_block constant text := $new$if title_text ~ '(正价|正规官方|官方.{0,12}(team|business|团队|席位)|business\(team\)|gptbusiness|48个月|48月|四十八个月|4年|四年|全程质保订阅|无限续费|可无限续费|可用pro模型额度比plus高|首次激活码|续费码)' then
    output := array_append(output, 'team_official');
  elsif title_text ~ 'k12' then
    output := array_append(output, 'team_k12');
  elsif title_text ~ '(bugteam|teambug|bug号|bug號|漏洞)' then
    output := array_append(output, 'team_bug');
  elsif tags_text ~ '(正价|正规官方|官方.{0,12}(team|business|团队|席位)|business\(team\)|gptbusiness|48个月|48月|四十八个月|4年|四年|全程质保订阅|无限续费|可无限续费|可用pro模型额度比plus高|首次激活码|续费码)' then
    output := array_append(output, 'team_official');
  elsif tags_text ~ 'k12' then
    output := array_append(output, 'team_k12');
  elsif tags_text ~ '(bugteam|teambug|bug号|bug號|漏洞)' then
    output := array_append(output, 'team_bug');
  end if;$new$;
begin
  select pg_get_functiondef('public.priceai_public_offer_filter_tags(text, text[])'::regprocedure)
  into current_definition;

  if position('elsif title_text ~ ''k12'' then' in current_definition) > 0 then
    raise notice 'priceai_public_offer_filter_tags already uses title-first ChatGPT Team subtype tags';
  else
    if position(old_team_block in current_definition) = 0 then
      raise exception 'Expected ChatGPT Team subtype filter tag block was not found';
    end if;

    next_definition := replace(current_definition, old_team_block, new_team_block);
    execute next_definition;
  end if;
end;
$migration$;

do $refresh_public_filter_tags$
declare
  refreshed_rows integer := 0;
begin
  loop
    with stale_offers as (
      select id
      from raw_offers
      where canonical_product_id = 'chatgpt-team-business'
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
    'reason', 'migration refine ChatGPT Team subtype filter tags',
    'refreshIntervalSeconds', 60,
    'globalDirty', false,
    'fullRefreshRequired', false,
    'affectedProductIds', jsonb_build_array('chatgpt-team-business'),
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
