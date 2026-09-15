-- BridgeNews production hardening: security, RLS performance, indexes and International coverage.

-- Public clients no longer call the SECURITY DEFINER view counter directly.
revoke all on function public.increment_article_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_article_view(uuid) to service_role;

-- Missing foreign-key indexes reported by the database advisor.
create index if not exists official_sources_region_id_idx on public.official_sources(region_id);
create index if not exists source_follows_source_id_idx on public.source_follows(source_id);
create index if not exists video_channels_region_id_idx on public.video_channels(region_id);

-- Helper expression repeated below intentionally uses SELECT so auth claims are evaluated once per statement.

-- Articles: combine public and admin SELECT paths to avoid overlapping permissive policies.
drop policy if exists "admin full access" on public.articles;
drop policy if exists "published articles readable" on public.articles;
create policy "articles readable" on public.articles for select to anon, authenticated
using (
  status = 'published'::public.article_status
  or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)
);
create policy "admin insert articles" on public.articles for insert to authenticated
with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update articles" on public.articles for update to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false))
with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete articles" on public.articles for delete to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

-- Article-category links.
drop policy if exists "admin full access" on public.article_categories;
drop policy if exists "published article categories readable" on public.article_categories;
create policy "article categories readable" on public.article_categories for select to anon, authenticated
using (
  exists (select 1 from public.articles a where a.id = article_categories.article_id and a.status = 'published'::public.article_status)
  or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)
);
create policy "admin insert article categories" on public.article_categories for insert to authenticated
with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update article categories" on public.article_categories for update to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false))
with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete article categories" on public.article_categories for delete to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

-- Article-topic links.
drop policy if exists "admin full access" on public.article_topics;
drop policy if exists "published article topics readable" on public.article_topics;
create policy "article topics readable" on public.article_topics for select to anon, authenticated
using (
  exists (select 1 from public.articles a where a.id = article_topics.article_id and a.status = 'published'::public.article_status)
  or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)
);
create policy "admin insert article topics" on public.article_topics for insert to authenticated
with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update article topics" on public.article_topics for update to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false))
with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete article topics" on public.article_topics for delete to authenticated
using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

-- Fully public lookup tables keep one SELECT policy, with separate admin write policies.
do $$
declare
  t text;
begin
  foreach t in array array['categories','homepage_sections','site_settings','topics'] loop
    execute format('drop policy if exists "admin full access" on public.%I', t);
  end loop;
end $$;

drop policy if exists "public categories readable" on public.categories;
create policy "categories readable" on public.categories for select to anon, authenticated using (true);
create policy "admin insert categories" on public.categories for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update categories" on public.categories for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete categories" on public.categories for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "public read homepage sections" on public.homepage_sections;
create policy "homepage sections readable" on public.homepage_sections for select to anon, authenticated using (true);
create policy "admin insert homepage sections" on public.homepage_sections for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update homepage sections" on public.homepage_sections for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete homepage sections" on public.homepage_sections for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "public read site settings" on public.site_settings;
create policy "site settings readable" on public.site_settings for select to anon, authenticated using (true);
create policy "admin insert site settings" on public.site_settings for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update site settings" on public.site_settings for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete site settings" on public.site_settings for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "public topics readable" on public.topics;
create policy "topics readable" on public.topics for select to anon, authenticated using (true);
create policy "admin insert topics" on public.topics for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update topics" on public.topics for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete topics" on public.topics for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

-- Enabled/active lookup tables: public sees active rows, admins can also read disabled rows.
drop policy if exists "admin full access" on public.official_sources;
drop policy if exists "public read enabled official sources" on public.official_sources;
create policy "official sources readable" on public.official_sources for select to anon, authenticated
using (enabled = true or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin insert official sources" on public.official_sources for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update official sources" on public.official_sources for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete official sources" on public.official_sources for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "admin full access" on public.regions;
drop policy if exists "public regions readable" on public.regions;
create policy "regions readable" on public.regions for select to anon, authenticated
using (is_active = true or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin insert regions" on public.regions for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update regions" on public.regions for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete regions" on public.regions for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "admin full access" on public.sources;
drop policy if exists "enabled source identity readable" on public.sources;
create policy "sources readable" on public.sources for select to anon, authenticated
using (enabled = true or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin insert sources" on public.sources for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update sources" on public.sources for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete sources" on public.sources for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "admin full access" on public.video_channels;
drop policy if exists "public read enabled video channels" on public.video_channels;
create policy "video channels readable" on public.video_channels for select to anon, authenticated
using (enabled = true or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin insert video channels" on public.video_channels for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update video channels" on public.video_channels for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete video channels" on public.video_channels for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

-- CMS tables with public visibility plus admin access.
drop policy if exists "admin full access content pages" on public.content_pages;
drop policy if exists "public read published content pages" on public.content_pages;
create policy "content pages readable" on public.content_pages for select to anon, authenticated
using (published = true or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin insert content pages" on public.content_pages for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update content pages" on public.content_pages for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete content pages" on public.content_pages for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

drop policy if exists "admin full access site menu" on public.site_menu_items;
drop policy if exists "public read site menu" on public.site_menu_items;
create policy "site menu readable" on public.site_menu_items for select to anon, authenticated
using (enabled = true or coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin insert site menu" on public.site_menu_items for insert to authenticated with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin update site menu" on public.site_menu_items for update to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false)) with check (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));
create policy "admin delete site menu" on public.site_menu_items for delete to authenticated using (coalesce((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin', false));

-- User-owned tables: avoid recalculating auth.uid() per row.
alter policy "Users manage own notification preferences" on public.notification_preferences
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users manage own source follows" on public.source_follows
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Users manage own topic follows" on public.topic_follows
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Expand International coverage using publisher-provided RSS feeds.
with international_region as (
  select id from public.regions where slug = 'international' limit 1
), source_rows(name,slug,website_url,feed_url) as (
  values
    ('ABC News - International','abc-news-international','https://abcnews.go.com/International','https://feeds.abcnews.com/abcnews/internationalheadlines'),
    ('The Guardian - World','guardian-world','https://www.theguardian.com/world','https://www.theguardian.com/world/rss')
), upserted as (
  insert into public.sources (
    name,slug,website_url,feed_url,source_type,enabled,auto_publish,
    ai_summary_enabled,ai_classification_enabled,default_language_code,
    fetch_interval_minutes,max_items_per_fetch
  )
  select name,slug,website_url,feed_url,'rss',true,true,false,false,'en',30,40
  from source_rows
  on conflict (slug) do update set
    name=excluded.name,
    website_url=excluded.website_url,
    feed_url=excluded.feed_url,
    source_type='rss',
    enabled=true,
    auto_publish=true,
    ai_summary_enabled=false,
    ai_classification_enabled=false,
    default_language_code='en',
    fetch_interval_minutes=30,
    max_items_per_fetch=40
  returning id
)
insert into public.source_regions(source_id,region_id)
select upserted.id, international_region.id
from upserted cross join international_region
on conflict do nothing;
