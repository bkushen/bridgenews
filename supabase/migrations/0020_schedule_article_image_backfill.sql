create or replace function private.trigger_backfill_images()
returns bigint
language plpgsql
security definer
set search_path to 'private','public'
as $function$
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
    url := 'https://majaoccykpdozuzehmpb.supabase.co/functions/v1/backfill-images',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token
    ),
    body := '{"limit":40}'::jsonb,
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$function$;

revoke all on function private.trigger_backfill_images() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'bridgenews-image-backfill') then
    perform cron.unschedule('bridgenews-image-backfill');
  end if;
end $$;

select cron.schedule(
  'bridgenews-image-backfill',
  '17,47 * * * *',
  'select private.trigger_backfill_images();'
);
