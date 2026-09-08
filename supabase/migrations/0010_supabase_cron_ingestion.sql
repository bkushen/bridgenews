create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create schema if not exists private;

create or replace function private.trigger_ingest_rss()
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
    url := 'https://majaoccykpdozuzehmpb.supabase.co/functions/v1/ingest-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.trigger_ingest_rss() from public, anon, authenticated;
grant execute on function private.trigger_ingest_rss() to postgres, service_role;

select cron.unschedule(jobid)
from cron.job
where jobname = 'bridgenews-rss-ingest';

select cron.schedule(
  'bridgenews-rss-ingest',
  '7,37 * * * *',
  $$select private.trigger_ingest_rss();$$
);
