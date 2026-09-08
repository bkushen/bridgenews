with sri_lanka as (
  select id as region_id from public.regions where slug = 'sri-lanka' limit 1
), seeded as (
  insert into public.sources (
    name, slug, website_url, feed_url, source_type, enabled, auto_publish,
    ai_summary_enabled, ai_classification_enabled, fetch_interval_minutes,
    max_items_per_fetch, default_language_code
  ) values
    ('Ada Derana', 'ada-derana', 'https://www.adaderana.lk/', 'https://www.adaderana.lk/rss.php', 'rss', true, true, false, false, 20, 30, 'en'),
    ('Ada Online - Sinhala', 'ada-online-sinhala', 'https://www.ada.lk/', 'https://www.ada.lk/rss/latest_news/1', 'rss', true, true, false, false, 30, 30, 'si'),
    ('EconomyNext', 'economynext', 'https://economynext.com/', 'https://economynext.com/feed/', 'rss', true, true, false, false, 30, 30, 'en'),
    ('Newswire Sri Lanka', 'newswire-lk', 'https://www.newswire.lk/', 'https://www.newswire.lk/feed/', 'rss', true, true, false, false, 20, 30, 'en'),
    ('News21 English', 'news21-english', 'https://www.news21.lk/english/', 'https://www.news21.lk/english/rss/latest-posts', 'rss', true, true, false, false, 30, 30, 'en'),
    ('Groundviews', 'groundviews', 'https://groundviews.org/', 'https://feeds.feedburner.com/groundviews', 'rss', true, true, false, false, 60, 20, 'en'),
    ('ReadMe Sri Lanka', 'readme-lk', 'https://readme.lk/', 'https://readme.lk/feed/', 'rss', true, true, false, false, 60, 20, 'en'),
    ('LMD', 'lmd-lk', 'https://lmd.lk/', 'https://lmd.lk/feed/', 'rss', true, true, false, false, 60, 20, 'en')
  on conflict (slug) do update set
    name = excluded.name,
    website_url = excluded.website_url,
    feed_url = excluded.feed_url,
    enabled = excluded.enabled,
    auto_publish = excluded.auto_publish,
    ai_summary_enabled = false,
    ai_classification_enabled = false,
    fetch_interval_minutes = excluded.fetch_interval_minutes,
    max_items_per_fetch = excluded.max_items_per_fetch,
    default_language_code = excluded.default_language_code,
    updated_at = now()
  returning id
)
insert into public.source_regions(source_id, region_id)
select seeded.id, sri_lanka.region_id
from seeded cross join sri_lanka
on conflict do nothing;

update public.sources
set enabled = false, updated_at = now()
where slug in (
  'daily-news-lk','sunday-observer-lk','dinamina','virakesari','itn-news',
  'ceylon-today','colombo-gazette','deshaya','tamil-mirror','the-morning-lk','times-online-lk',
  'newsin-asia','sri-lanka-guardian','lanka-puvath','uthayan','lanka-truth','lanka-c-news'
);
