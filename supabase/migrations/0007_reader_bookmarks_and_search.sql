create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.bookmarks enable row level security;
grant select, insert, delete on public.bookmarks to authenticated;

create policy "Users can read own bookmarks" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own bookmarks" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own bookmarks" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

create index if not exists bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);
create index if not exists articles_search_idx on public.articles using gin (
  to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ai_summary, ''))
);

create or replace function public.search_published_articles(search_term text, result_limit integer default 30)
returns table (
  id uuid, slug text, title text, description text, ai_summary text, image_url text,
  source_id uuid, published_at timestamptz, discovered_at timestamptz, rank real
)
language sql stable security invoker set search_path = public as $$
  select a.id, a.slug, a.title, a.description, a.ai_summary, a.image_url, a.source_id,
    a.published_at, a.discovered_at,
    ts_rank(
      to_tsvector('simple'::regconfig, coalesce(a.title, '') || ' ' || coalesce(a.description, '') || ' ' || coalesce(a.ai_summary, '')),
      websearch_to_tsquery('simple'::regconfig, trim(search_term))
    )::real as rank
  from public.articles a
  where a.status = 'published'
    and trim(coalesce(search_term, '')) <> ''
    and to_tsvector('simple'::regconfig, coalesce(a.title, '') || ' ' || coalesce(a.description, '') || ' ' || coalesce(a.ai_summary, ''))
      @@ websearch_to_tsquery('simple'::regconfig, trim(search_term))
  order by rank desc, a.published_at desc nulls last, a.discovered_at desc
  limit least(greatest(result_limit, 1), 100);
$$;

grant execute on function public.search_published_articles(text, integer) to anon, authenticated;
