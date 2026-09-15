-- Pause sources that have repeatedly failed instead of hammering broken/rate-limited endpoints.
update public.sources
set enabled = false
where enabled = true
  and consecutive_failures >= 12;

-- Enforce the same guard for every ingestion adapter, not just RSS.
create or replace function public.enforce_source_failure_pause()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.consecutive_failures >= 12 and coalesce(old.consecutive_failures, 0) < 12 then
    new.enabled := false;
  end if;
  return new;
end;
$$;

drop trigger if exists sources_auto_pause_failures on public.sources;
create trigger sources_auto_pause_failures
before update of consecutive_failures on public.sources
for each row execute function public.enforce_source_failure_pause();

revoke all on function public.enforce_source_failure_pause() from public, anon, authenticated;

-- Add a dedicated Tamil News21 source from its official current RSS endpoint.
with upserted as (
  insert into public.sources (
    name, slug, website_url, feed_url, source_type, enabled, auto_publish,
    ai_summary_enabled, ai_classification_enabled, default_language_code,
    fetch_interval_minutes, max_items_per_fetch
  )
  values (
    'News21 Tamil', 'news21-tamil', 'https://www.news21.lk/',
    'https://www.news21.lk/rss/latest-posts', 'rss', true, true,
    false, false, 'ta', 30, 30
  )
  on conflict (slug) do update set
    name = excluded.name,
    website_url = excluded.website_url,
    feed_url = excluded.feed_url,
    source_type = excluded.source_type,
    enabled = true,
    auto_publish = true,
    ai_summary_enabled = false,
    ai_classification_enabled = false,
    default_language_code = 'ta',
    fetch_interval_minutes = 30,
    max_items_per_fetch = 30
  returning id
), region as (
  select id from public.regions where slug = 'sri-lanka' limit 1
)
insert into public.source_regions (source_id, region_id)
select upserted.id, region.id
from upserted cross join region
on conflict do nothing;
