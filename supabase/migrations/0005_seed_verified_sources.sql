-- Initial verified source catalogue for BridgeNews.
-- These feeds were checked against the publishers' current RSS directories in September 2026.
-- Keep auto_publish false until ingestion quality has been reviewed in production.

insert into public.sources (
  name, slug, website_url, feed_url, source_type, enabled,
  auto_publish, ai_summary_enabled, ai_classification_enabled,
  default_language_code, fetch_interval_minutes, max_items_per_fetch
)
values
  ('SBS News - Top Stories','sbs-news-top','https://www.sbs.com.au/news','https://www.sbs.com.au/news/feed','rss',true,false,false,false,'en',30,40),
  ('SBS News - Latest','sbs-news-latest','https://www.sbs.com.au/news','https://www.sbs.com.au/news/topic/latest/feed','rss',true,false,false,false,'en',30,40),
  ('SBS News - Australia','sbs-news-australia','https://www.sbs.com.au/news','https://www.sbs.com.au/news/topic/australia/feed','rss',true,false,false,false,'en',30,40),
  ('SBS News - World','sbs-news-world','https://www.sbs.com.au/news','https://www.sbs.com.au/news/topic/world/feed','rss',true,false,false,false,'en',30,40),
  ('Daily Mirror - Breaking News','daily-mirror-breaking','https://www.dailymirror.lk','https://www.dailymirror.lk/rss/breaking_news/108','rss',true,false,false,false,'en',30,40),
  ('Daily Mirror - Business 24/7','daily-mirror-business','https://www.dailymirror.lk','https://www.dailymirror.lk/rss/business_24_7/395','rss',true,false,false,false,'en',60,30)
on conflict (slug) do update set
  website_url = excluded.website_url,
  feed_url = excluded.feed_url,
  enabled = excluded.enabled,
  fetch_interval_minutes = excluded.fetch_interval_minutes,
  max_items_per_fetch = excluded.max_items_per_fetch;

insert into public.source_regions (source_id, region_id, is_primary)
select s.id, r.id, true
from public.sources s
join public.regions r on (
  (s.slug in ('sbs-news-top','sbs-news-latest','sbs-news-australia') and r.code = 'australia') or
  (s.slug = 'sbs-news-world' and r.code = 'international') or
  (s.slug like 'daily-mirror-%' and r.code = 'sri_lanka')
)
where s.slug in (
  'sbs-news-top','sbs-news-latest','sbs-news-australia','sbs-news-world',
  'daily-mirror-breaking','daily-mirror-business'
)
on conflict (source_id, region_id) do update set is_primary = excluded.is_primary;
