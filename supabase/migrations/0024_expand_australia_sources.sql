with australia as (
  select id from public.regions where slug = 'australia'
), upserted as (
  insert into public.sources(
    name, slug, website_url, feed_url, source_type, enabled,
    auto_publish, ai_summary_enabled, ai_classification_enabled,
    default_language_code, fetch_interval_minutes, max_items_per_fetch
  ) values
    ('The Conversation Australia','the-conversation-au','https://theconversation.com/au','https://theconversation.com/au/articles.atom','rss',true,true,false,false,'en',30,20),
    ('The Canberra Times','canberra-times','https://www.canberratimes.com.au/','https://www.canberratimes.com.au/rss.xml','rss',true,true,false,false,'en',30,20),
    ('Sydney Morning Herald','smh-au','https://www.smh.com.au/','https://www.smh.com.au/rss/feed.xml','rss',true,true,false,false,'en',30,20),
    ('The Age','the-age-au','https://www.theage.com.au/','https://www.theage.com.au/rss/feed.xml','rss',true,true,false,false,'en',30,20),
    ('Brisbane Times','brisbane-times-au','https://www.brisbanetimes.com.au/','https://www.brisbanetimes.com.au/rss/feed.xml','rss',true,true,false,false,'en',30,20),
    ('WAtoday','watoday-au','https://www.watoday.com.au/','https://www.watoday.com.au/rss/feed.xml','rss',true,true,false,false,'en',30,20)
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
    max_items_per_fetch=20
  returning id
)
insert into public.source_regions(source_id, region_id)
select u.id, a.id from upserted u cross join australia a
on conflict do nothing;

update public.sources
set enabled=false
where slug in ('9news-au','indaily-au','michael-west-au');
