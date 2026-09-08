with region as (
  select id from public.regions where slug = 'sri-lanka' limit 1
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
  values
    ('Sri Lanka Mirror', 'sri-lanka-mirror', 'https://srilankamirror.com', 'https://srilankamirror.com/category/news/feed/', 'rss', true, true, false, false, 30, 30, 'en'),
    ('Lanka Business Online', 'lanka-business-online', 'https://www.lankabusinessonline.com', 'https://www.lankabusinessonline.com/feed', 'rss', true, true, false, false, 60, 30, 'en'),
    ('Vikalpa', 'vikalpa', 'https://vikalpa.org', 'https://vikalpa.org/feed', 'rss', true, true, false, false, 60, 30, 'si')
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
insert into public.source_regions (source_id, region_id)
select u.id, r.id
from upserted u
cross join region r
on conflict do nothing;
