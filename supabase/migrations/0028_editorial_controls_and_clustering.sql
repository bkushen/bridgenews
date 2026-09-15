alter table public.articles
  add column if not exists editorial_priority integer not null default 0,
  add column if not exists is_breaking boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_main_headline boolean not null default false,
  add column if not exists pinned_until timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'articles_editorial_priority_range'
  ) then
    alter table public.articles
      add constraint articles_editorial_priority_range
      check (editorial_priority between 0 and 100);
  end if;
end $$;

create index if not exists articles_editorial_home_idx
  on public.articles (
    is_main_headline desc,
    is_breaking desc,
    is_featured desc,
    editorial_priority desc,
    published_at desc
  )
  where status = 'published';

create index if not exists articles_pinned_until_idx
  on public.articles (pinned_until desc)
  where pinned_until is not null and status = 'published';

create or replace function public.cluster_article_by_headline(target_article_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
declare
  article_row public.articles%rowtype;
  matched_cluster uuid;
  new_cluster_id uuid;
  normalized_slug text;
  normalized_title text;
  article_time timestamptz;
begin
  select * into article_row from public.articles where id = target_article_id;
  if not found then return null; end if;
  if article_row.story_cluster_id is not null then return article_row.story_cluster_id; end if;

  article_time := coalesce(article_row.published_at, article_row.discovered_at, now());
  normalized_title := regexp_replace(lower(article_row.title), '[^[:alnum:] ]+', ' ', 'g');
  normalized_title := regexp_replace(normalized_title, '\s+', ' ', 'g');

  if article_row.content_hash is not null then
    select a.story_cluster_id into matched_cluster
    from public.articles a
    where a.id <> article_row.id
      and a.story_cluster_id is not null
      and a.content_hash = article_row.content_hash
      and coalesce(a.published_at, a.discovered_at, a.created_at) >= article_time - interval '14 days'
    order by coalesce(a.published_at, a.discovered_at, a.created_at) desc
    limit 1;
  end if;

  if matched_cluster is null then
    select sc.id into matched_cluster
    from public.story_clusters sc
    where sc.last_updated_at >= article_time - interval '7 days'
      and extensions.similarity(
        regexp_replace(regexp_replace(lower(sc.headline), '[^[:alnum:] ]+', ' ', 'g'), '\s+', ' ', 'g'),
        normalized_title
      ) >= case when length(normalized_title) < 45 then 0.76 else 0.64 end
    order by extensions.similarity(
      regexp_replace(regexp_replace(lower(sc.headline), '[^[:alnum:] ]+', ' ', 'g'), '\s+', ' ', 'g'),
      normalized_title
    ) desc, sc.last_updated_at desc
    limit 1;
  end if;

  if matched_cluster is null then
    new_cluster_id := gen_random_uuid();
    normalized_slug := trim(both '-' from regexp_replace(lower(article_row.title), '[^a-z0-9]+', '-', 'g'));
    normalized_slug := left(coalesce(nullif(normalized_slug, ''), 'story'), 80) || '-' || left(new_cluster_id::text, 8);
    insert into public.story_clusters(
      id, headline, slug, summary, first_seen_at, last_updated_at, article_count, trending_score
    ) values (
      new_cluster_id,
      article_row.title,
      normalized_slug,
      article_row.description,
      article_time,
      article_time,
      1,
      1
    );
    matched_cluster := new_cluster_id;
  else
    update public.story_clusters sc
    set last_updated_at = greatest(sc.last_updated_at, article_time),
        article_count = (
          select count(*) + 1
          from public.articles a
          where a.story_cluster_id = sc.id and a.id <> article_row.id
        ),
        trending_score = greatest(
          sc.trending_score,
          (
            select count(*) + 1
            from public.articles a
            where a.story_cluster_id = sc.id and a.id <> article_row.id
          )
        )
    where sc.id = matched_cluster;
  end if;

  update public.articles
  set story_cluster_id = matched_cluster
  where id = target_article_id;

  return matched_cluster;
end;
$$;

revoke all on function public.cluster_article_by_headline(uuid) from public, anon, authenticated;
grant execute on function public.cluster_article_by_headline(uuid) to service_role;

comment on column public.articles.editorial_priority is 'Manual homepage/editorial priority from 0 to 100.';
comment on column public.articles.is_breaking is 'Marks a story as breaking news.';
comment on column public.articles.is_featured is 'Marks a story for featured placement.';
comment on column public.articles.is_main_headline is 'Marks a story as the primary headline; UI resolves most recent/highest priority if more than one.';
