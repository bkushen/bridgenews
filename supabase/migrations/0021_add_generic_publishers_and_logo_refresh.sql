with sri_lanka as (
  select id from public.regions where slug = 'sri-lanka'
), upserted as (
  insert into public.sources(
    name, slug, website_url, feed_url, source_type, enabled,
    auto_publish, ai_summary_enabled, ai_classification_enabled,
    default_language_code, fetch_interval_minutes, max_items_per_fetch
  ) values
    ('The Morning','the-morning','https://www.themorning.lk/','https://www.themorning.lk/','api',true,true,false,false,'en',30,15),
    ('Asian Mirror','asian-mirror','https://asianmirror.lk/','https://asianmirror.lk/','api',true,true,false,false,'en',30,15),
    ('Mawrata News','mawrata-news','https://mawratanews.lk/','https://mawratanews.lk/','api',true,true,false,false,'en',30,15),
    ('Colombo Gazette','colombo-gazette','https://colombogazette.com/','https://colombogazette.com/','api',true,true,false,false,'en',30,15)
  on conflict (slug) do update set
    name=excluded.name,
    website_url=excluded.website_url,
    feed_url=excluded.feed_url,
    source_type=excluded.source_type,
    enabled=excluded.enabled,
    auto_publish=excluded.auto_publish,
    ai_summary_enabled=false,
    ai_classification_enabled=false,
    default_language_code=excluded.default_language_code,
    fetch_interval_minutes=excluded.fetch_interval_minutes,
    max_items_per_fetch=excluded.max_items_per_fetch
  returning id
)
insert into public.source_regions(source_id, region_id)
select u.id, r.id from upserted u cross join sri_lanka r
on conflict do nothing;

create or replace function private.trigger_ingest_generic_web()
returns bigint
language plpgsql
security definer
set search_path=private, public
as $$
declare token text; request_id bigint;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name='bridgenews_ingest_anon_jwt' limit 1;
  if token is null then raise exception 'BridgeNews ingestion credential is missing from Vault'; end if;
  select net.http_post(
    url := 'https://majaoccykpdozuzehmpb.supabase.co/functions/v1/ingest-generic-web',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into request_id;
  return request_id;
end; $$;
revoke all on function private.trigger_ingest_generic_web() from public, anon, authenticated;
grant execute on function private.trigger_ingest_generic_web() to postgres, service_role;

create or replace function private.trigger_source_logo_refresh()
returns bigint
language plpgsql
security definer
set search_path=private, public
as $$
declare token text; request_id bigint;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name='bridgenews_ingest_anon_jwt' limit 1;
  if token is null then raise exception 'BridgeNews ingestion credential is missing from Vault'; end if;
  select net.http_post(
    url := 'https://majaoccykpdozuzehmpb.supabase.co/functions/v1/backfill-source-logos',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into request_id;
  return request_id;
end; $$;
revoke all on function private.trigger_source_logo_refresh() from public, anon, authenticated;
grant execute on function private.trigger_source_logo_refresh() to postgres, service_role;

select cron.unschedule(jobid) from cron.job where jobname='bridgenews-generic-web-ingest';
select cron.schedule('bridgenews-generic-web-ingest','17,47 * * * *',$$select private.trigger_ingest_generic_web();$$);
select cron.unschedule(jobid) from cron.job where jobname='bridgenews-source-logo-refresh';
select cron.schedule('bridgenews-source-logo-refresh','23 3 * * *',$$select private.trigger_source_logo_refresh();$$);
