create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  excerpt text,
  published boolean not null default false,
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_menu_items (
  id uuid primary key default gen_random_uuid(),
  area text not null check (area in ('header','footer')),
  label text not null,
  href text not null,
  enabled boolean not null default true,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);

alter table public.content_pages enable row level security;
alter table public.site_menu_items enable row level security;

create policy "public read published content pages" on public.content_pages for select to anon, authenticated using (published = true or coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false));
create policy "admin full access content pages" on public.content_pages for all to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false)) with check (coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false));
create policy "public read site menu" on public.site_menu_items for select to anon, authenticated using (enabled = true or coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false));
create policy "admin full access site menu" on public.site_menu_items for all to authenticated using (coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false)) with check (coalesce((auth.jwt()->'app_metadata'->>'role') = 'admin', false));

grant select on public.content_pages, public.site_menu_items to anon;
grant select, insert, update, delete on public.content_pages, public.site_menu_items to authenticated;

insert into public.content_pages (slug,title,body,published,seo_title,seo_description)
values
 ('about','About BridgeNews','BridgeNews brings together attributed headlines and short summaries from multiple publishers so readers can discover coverage and follow original sources.',true,'About BridgeNews','Learn about BridgeNews and how the news aggregation platform works.'),
 ('contact','Contact','For enquiries, corrections or source requests, please use the contact details provided by BridgeNews administrators.',true,'Contact BridgeNews','Contact BridgeNews for enquiries, corrections and source requests.'),
 ('privacy','Privacy Policy','BridgeNews aims to collect only the information needed to operate reader accounts, preferences, analytics and site security. This page can be updated by administrators as the service evolves.',true,'BridgeNews Privacy Policy','Read the BridgeNews privacy policy.'),
 ('terms','Terms of Use','BridgeNews provides links, attribution and short metadata-based descriptions to help readers discover news. Publisher content remains subject to the original publisher terms and copyright.',true,'BridgeNews Terms of Use','Read the BridgeNews terms of use.')
on conflict (slug) do nothing;

insert into public.site_menu_items (area,label,href,enabled,sort_order)
select * from (values
 ('header','Latest','/',true,10),('header','Top Stories','/top-stories',true,20),('header','Sources','/sources',true,30),('header','Topics','/topics',true,40),
 ('footer','About','/about',true,10),('footer','Contact','/contact',true,20),('footer','Privacy','/privacy',true,30),('footer','Terms','/terms',true,40)
) as v(area,label,href,enabled,sort_order)
where not exists (select 1 from public.site_menu_items);

insert into public.site_settings (key,group_name,label,description,value)
values
 ('seo_default_title','seo','Default SEO title','Default browser/search title for BridgeNews','"BridgeNews"'::jsonb),
 ('seo_default_description','seo','Default SEO description','Default search description for BridgeNews','"BridgeNews aggregates attributed headlines and links to original publishers."'::jsonb),
 ('seo_robots_index','seo','Allow search indexing','Controls whether public pages should be indexable','true'::jsonb),
 ('seo_social_image','seo','Default social image','Absolute image URL used for social sharing previews','""'::jsonb)
on conflict (key) do nothing;

insert into public.sources (name,slug,website_url,feed_url,source_type,logo_url,enabled,auto_publish,ai_summary_enabled,fetch_interval_minutes,default_language_code,consecutive_failures,max_items_per_fetch,ai_classification_enabled)
values ('BridgeNews Editorial','bridgenews-editorial','https://bridgenews.local',null,'manual',null,false,false,false,1440,'en',0,20,false)
on conflict (slug) do nothing;