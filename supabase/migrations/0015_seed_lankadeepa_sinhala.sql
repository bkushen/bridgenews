with region as (
  select id from public.regions where slug = 'sri-lanka' limit 1
), source_row as (
  insert into public.sources (
    name, slug, website_url, feed_url, source_type, enabled, auto_publish,
    ai_summary_enabled, ai_classification_enabled, fetch_interval_minutes,
    max_items_per_fetch, default_language_code
  ) values (
    'Lankadeepa - Latest News',
    'lankadeepa-latest',
    'https://www.lankadeepa.lk/',
    'https://www.lankadeepa.lk/rss/latest_news/1',
    'rss', true, true, false, false, 30, 30, 'si'
  )
  on conflict (slug) do update set
    website_url = excluded.website_url,
    feed_url = excluded.feed_url,
    enabled = true,
    auto_publish = true,
    ai_summary_enabled = false,
    ai_classification_enabled = false,
    fetch_interval_minutes = excluded.fetch_interval_minutes,
    max_items_per_fetch = excluded.max_items_per_fetch,
    default_language_code = excluded.default_language_code,
    updated_at = now()
  returning id
)
insert into public.source_regions(source_id, region_id)
select source_row.id, region.id
from source_row, region
on conflict do nothing;
