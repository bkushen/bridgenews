create table if not exists public.social_publish_config (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default true,
  platforms text[] not null default array['facebook','instagram','x','threads','linkedin']::text[],
  attach_article_image boolean not null default true,
  timezone text not null default 'Australia/Melbourne',
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  updated_at timestamptz not null default now()
);

insert into public.social_publish_config (id)
values (1)
on conflict (id) do nothing;

alter table public.social_publish_config enable row level security;

grant select, update on public.social_publish_config to authenticated;
grant all on public.social_publish_config to service_role;

drop policy if exists social_publish_config_admin_select on public.social_publish_config;
create policy social_publish_config_admin_select on public.social_publish_config
for select to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists social_publish_config_admin_update on public.social_publish_config;
create policy social_publish_config_admin_update on public.social_publish_config
for update to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

alter table public.social_post_queue
  add column if not exists provider_post_id text,
  add column if not exists provider_response jsonb not null default '{}'::jsonb,
  add column if not exists last_attempt_at timestamptz;

alter table public.social_post_queue drop constraint if exists social_post_queue_platform_check;
alter table public.social_post_queue add constraint social_post_queue_platform_check
check (platform in ('facebook','instagram','x','threads','linkedin','telegram','whatsapp'));

alter table public.social_post_queue drop constraint if exists social_post_queue_status_check;
alter table public.social_post_queue add constraint social_post_queue_status_check
check (status in ('queued','approved','scheduled','published','skipped','failed'));

create index if not exists social_post_queue_worker_idx
on public.social_post_queue (status, scheduled_for, attempts, created_at)
where status in ('queued','failed');

create schema if not exists private;

drop trigger if exists queue_bridge_news_social_posts_trigger on public.articles;
drop function if exists public.queue_bridge_news_social_posts();

create or replace function private.queue_bridge_news_social_posts()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  cfg public.social_publish_config%rowtype;
  p text;
begin
  select * into cfg from public.social_publish_config where id = 1;
  if coalesce(cfg.enabled, false) = false then
    return new;
  end if;

  if new.status = 'published' and new.image_url is not null then
    foreach p in array cfg.platforms loop
      insert into public.social_post_queue(article_id, platform, post_text, status)
      values (new.id, p, new.title, 'queued')
      on conflict (article_id, platform) do nothing;
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function private.queue_bridge_news_social_posts() from public, anon, authenticated;
grant execute on function private.queue_bridge_news_social_posts() to postgres, service_role;

create trigger queue_bridge_news_social_posts_trigger
after insert or update of status,image_url,title on public.articles
for each row execute function private.queue_bridge_news_social_posts();

create or replace function private.trigger_social_publish()
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
    raise exception 'BridgeNews Edge Function credential is missing from Vault';
  end if;

  select net.http_post(
    url := 'https://majaoccykpdozuzehmpb.supabase.co/functions/v1/social-publish',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || token
    ),
    body := '{"limit":20}'::jsonb,
    timeout_milliseconds := 60000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.trigger_social_publish() from public, anon, authenticated;
grant execute on function private.trigger_social_publish() to postgres, service_role;

select cron.unschedule(jobid)
from cron.job
where jobname = 'bridgenews-social-publish';

select cron.schedule(
  'bridgenews-social-publish',
  '* * * * *',
  $$select private.trigger_social_publish();$$
);
