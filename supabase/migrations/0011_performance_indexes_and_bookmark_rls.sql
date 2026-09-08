create index if not exists article_categories_category_id_idx on public.article_categories(category_id);
create index if not exists article_regions_region_id_idx on public.article_regions(region_id);
create index if not exists article_topics_topic_id_idx on public.article_topics(topic_id);
create index if not exists bookmarks_article_id_idx on public.bookmarks(article_id);
create index if not exists ingestion_runs_source_id_idx on public.ingestion_runs(source_id);

drop policy if exists "Users can read own bookmarks" on public.bookmarks;
create policy "Users can read own bookmarks"
on public.bookmarks for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
create policy "Users can insert own bookmarks"
on public.bookmarks for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
on public.bookmarks for delete to authenticated
using ((select auth.uid()) = user_id);
