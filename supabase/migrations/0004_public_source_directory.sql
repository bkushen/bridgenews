-- Expose only safe publisher identity fields needed by public story cards.
-- Administrative source settings such as feed_url, fetch interval and auto-publish remain unreadable.

revoke all on public.sources from anon, authenticated;

grant select (id, name, slug, website_url, logo_url) on public.sources to anon, authenticated;

create policy "enabled source identity readable"
on public.sources
for select
to anon, authenticated
using (enabled = true);
