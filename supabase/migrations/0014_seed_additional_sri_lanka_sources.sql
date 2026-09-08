with sri_lanka as (
  select id from public.regions where slug = 'sri-lanka'
), new_sources(name, slug, website_url, feed_url, lang, interval_mins, max_items) as (
  values
    ('Daily FT - Top Story', 'daily-ft-top-story', 'https://www.ft.lk', 'https://www.ft.lk/rss/top-story/26', 'en', 30, 40),
    ('The Island', 'the-island', 'https://island.lk', 'https://island.lk/feed/', 'en', 30, 40),
    ('Lanka News Web', 'lanka-news-web', 'https://lankanewsweb.net', 'https://lankanewsweb.net/feed/', 'en', 30, 40),
    ('Onlanka', 'onlanka', 'https://www.onlanka.com', 'https://www.onlanka.com/feed', 'en', 30, 40)
), upserted as (
  insert into public.sources (
    name,
    slug,
    website_url,
    feed_url,
    source_type,
    enabled,
    auto_publish,
    ai_summary_enabled,
    ai_classification_enabled,
    fetch_interval_minutes,
    max_items_per_fetch,
    default_language_code
  )
  select
    name,
    slug,
    website_url,
    feed_url,
    'rss',
    true,
    true,
    false,
    false,
    interval_mins,
    max_items,
    lang
  from new_sources
  on conflict (slug) do update
  set feed_url = excluded.feed_url,
      website_url = excluded.website_url,
      enabled = true,
      auto_publish = true,
      ai_summary_enabled = false,
      ai_classification_enabled = false,
      fetch_interval_minutes = excluded.fetch_interval_minutes,
      max_items_per_fetch = excluded.max_items_per_fetch,
      default_language_code = excluded.default_language_code
  returning id
)
insert into public.source_regions (source_id, region_id)
select upserted.id, sri_lanka.id
from upserted
cross join sri_lanka
on conflict do nothing;
