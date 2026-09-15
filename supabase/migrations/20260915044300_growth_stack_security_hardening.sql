revoke execute on function public.queue_bridge_news_social_posts() from public, anon, authenticated;
grant execute on function public.queue_bridge_news_social_posts() to service_role;

drop policy if exists traffic_events_admin_select on public.traffic_events;
create policy traffic_events_admin_select on public.traffic_events
for select to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists newsletter_subscribers_admin_select on public.newsletter_subscribers;
create policy newsletter_subscribers_admin_select on public.newsletter_subscribers
for select to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists newsletter_subscribers_admin_update on public.newsletter_subscribers;
create policy newsletter_subscribers_admin_update on public.newsletter_subscribers
for update to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists social_post_queue_admin_select on public.social_post_queue;
create policy social_post_queue_admin_select on public.social_post_queue
for select to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists social_post_queue_admin_update on public.social_post_queue;
create policy social_post_queue_admin_update on public.social_post_queue
for update to authenticated
using ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin')
with check ((select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin');
