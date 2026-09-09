with r as (select id from public.regions where slug='sri-lanka' limit 1)
insert into public.video_channels(name,channel_id,channel_url,feed_url,language_code,region_id,enabled,sort_order) values
 ('Ada Derana',null,'https://www.youtube.com/@AdaDerana',null,'si',(select id from r),true,10),
 ('Ada Derana News Channel English',null,'https://www.youtube.com/@ADNCEnglish',null,'en',(select id from r),true,20),
 ('Newsfirst Sri Lanka',null,'https://www.youtube.com/@newsfirstsrilanka',null,'si',(select id from r),true,30)
on conflict do nothing;