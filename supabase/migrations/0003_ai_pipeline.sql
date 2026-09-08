-- AI enrichment + semantic clustering.
-- Keeps article enrichment server-only and allows one story cluster to combine many source articles.

alter table public.sources
  add column if not exists ai_classification_enabled boolean not null default true;

alter table public.articles
  add column if not exists auto_publish_requested boolean not null default false,
  add column if not exists ai_processed_at timestamptz,
  add column if not exists ai_model text,
  add column if not exists ai_classification jsonb not null default '{}'::jsonb,
  add column if not exists embedding vector(1536);

create index if not exists articles_ai_queue_idx
  on public.articles (status, ai_processed_at, discovered_at)
  where ai_processed_at is null;

create index if not exists articles_embedding_idx
  on public.articles using hnsw (embedding vector_cosine_ops);

-- Internal-only semantic lookup used by the server-side processor.
create or replace function public.match_story_clusters(
  query_embedding vector(1536),
  match_threshold double precision default 0.86,
  max_age_hours integer default 120,
  match_count integer default 5
)
returns table (
  id uuid,
  headline text,
  similarity double precision,
  last_updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    sc.id,
    sc.headline,
    1 - (sc.embedding <=> query_embedding) as similarity,
    sc.last_updated_at
  from public.story_clusters sc
  where sc.embedding is not null
    and sc.last_updated_at >= now() - make_interval(hours => greatest(max_age_hours, 1))
    and 1 - (sc.embedding <=> query_embedding) >= match_threshold
  order by sc.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

revoke all on function public.match_story_clusters(vector, double precision, integer, integer) from public, anon, authenticated;
grant execute on function public.match_story_clusters(vector, double precision, integer, integer) to service_role;

-- Topic names are AI-created, but browser users still only receive SELECT access through existing RLS.
-- No INSERT/UPDATE grants are added for anon/authenticated roles.
