with sri_lanka as (
  select id from public.regions where slug = 'sri-lanka'
), upserted as (
  insert into public.sources(
    name, slug, website_url, feed_url, source_type, enabled,
    auto_publish, ai_summary_enabled, ai_classification_enabled,
    default_language_code, fetch_interval_minutes, max_items_per_fetch
  )
  values
    ('Newsfirst English','newsfirst-english','https://www.newsfirst.lk','https://www.newsfirst.lk/latest','api',true,true,false,false,'en',30,15),
    ('Newsfirst Sinhala','newsfirst-sinhala','https://sinhala.newsfirst.lk','https://sinhala.newsfirst.lk/2026/','api',true,true,false,false,'si',30,15),
    ('Newsfirst Tamil','newsfirst-tamil','https://tamil.newsfirst.lk','https://tamil.newsfirst.lk/2026/','api',true,true,false,false,'ta',30,15),
    ('ITN News Sinhala','itn-news-sinhala','https://www.itnnews.lk','https://www.itnnews.lk/news/','api',true,true,false,false,'si',30,15),
    ('ITN News Tamil','itn-news-tamil','https://www.itnnews.lk/ta/','https://www.itnnews.lk/ta/','api',true,true,false,false,'ta',30,15)
  on conflict (slug) do update set
    name = excluded.name,
    website_url = excluded.website_url,
    feed_url = excluded.feed_url,
    source_type = excluded.source_type,
    enabled = excluded.enabled,
    auto_publish = excluded.auto_publish,
    ai_summary_enabled = excluded.ai_summary_enabled,
    ai_classification_enabled = excluded.ai_classification_enabled,
    default_language_code = excluded.default_language_code,
    fetch_interval_minutes = excluded.fetch_interval_minutes,
    max_items_per_fetch = excluded.max_items_per_fetch
  returning id
)
insert into public.source_regions(source_id, region_id)
select u.id, r.id
from upserted u
cross join sri_lanka r
on conflict do nothing;

update public.sources
set enabled = false
where slug in (
  'itn-news',
  'daily-news-lk', 'sunday-observer-lk', 'dinamina', 'virakesari',
  'lanka-puvath', 'lanka-truth', 'ceylon-today', 'newsin-asia',
  'colombo-gazette', 'deshaya', 'the-morning-lk', 'times-online-lk',
  'tamil-mirror', 'sri-lanka-guardian', 'uthayan', 'lanka-c-news'
);

create or replace function private.trigger_ingest_web()
returns bigint
language plpgsql
security definer
set search_path = private, public
as $$
declare
  token text;
  request_id bigint;
begin
  select decrypted_secret into token
  from vault.decrypted_secrets
  where name = 'bridgenews_ingest_anon_jwt'
  limit 1;

  if token is null then
    raise exception 'BridgeNews ingestion credential is missing from Vault';
  end if;

  select net.http_post(
    url := 'https://majaoccykpdozuzehmpb.supabase.co/functions/v1/ingest-web',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.trigger_ingest_web() from public, anon, authenticated;
grant execute on function private.trigger_ingest_web() to postgres, service_role;

select cron.unschedule(jobid)
from cron.job
where jobname = 'bridgenews-web-ingest';

select cron.schedule(
  'bridgenews-web-ingest',
  '12,42 * * * *',
  $$select private.trigger_ingest_web();$$
);
