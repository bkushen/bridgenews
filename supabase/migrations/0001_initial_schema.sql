-- Initial content model for Sri Lanka + Australia + International smart news discovery.
-- Apply through your normal Supabase migration workflow after reviewing against the target project.

create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.region_code as enum ('sri_lanka', 'australia', 'international');
create type public.article_status as enum ('discovered','processing','review_required','published','rejected','failed');
create type public.source_type as enum ('rss','api','manual');

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  code public.region_code not null unique,
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website_url text not null,
  feed_url text,
  source_type public.source_type not null default 'rss',
  logo_url text,
  enabled boolean not null default true,
  auto_publish boolean not null default false,
  ai_summary_enabled boolean not null default true,
  fetch_interval_minutes integer not null default 30 check (fetch_interval_minutes >= 10),
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_clusters (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  slug text not null unique,
  summary text,
  first_seen_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  article_count integer not null default 0,
  trending_score numeric(12,4) not null default 0,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  story_cluster_id uuid references public.story_clusters(id) on delete set null,
  title text not null,
  slug text not null unique,
  original_url text not null,
  canonical_url text not null,
  description text,
  ai_summary text,
  author text,
  image_url text,
  language_code text not null default 'en',
  status public.article_status not null default 'discovered',
  sentiment text check (sentiment in ('positive','neutral','negative') or sentiment is null),
  content_hash text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_canonical_url_unique unique (canonical_url)
);

create table public.article_regions (
  article_id uuid not null references public.articles(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete cascade,
  confidence numeric(5,4) check (confidence between 0 and 1),
  primary key (article_id, region_id)
);

create table public.article_categories (
  article_id uuid not null references public.articles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  confidence numeric(5,4) check (confidence between 0 and 1),
  primary key (article_id, category_id)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  trending_score numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.article_topics (
  article_id uuid not null references public.articles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  confidence numeric(5,4) check (confidence between 0 and 1),
  primary key (article_id, topic_id)
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text
);

create index articles_published_at_idx on public.articles (published_at desc);
create index articles_status_idx on public.articles (status);
create index articles_story_cluster_idx on public.articles (story_cluster_id);
create index story_clusters_trending_idx on public.story_clusters (trending_score desc);
create index topics_trending_idx on public.topics (trending_score desc);
create index story_clusters_embedding_idx on public.story_clusters using hnsw (embedding vector_cosine_ops);

insert into public.regions (code, name, slug) values
  ('sri_lanka', 'Sri Lanka', 'sri-lanka'),
  ('australia', 'Australia', 'australia'),
  ('international', 'International', 'international');

insert into public.categories (name, slug, sort_order) values
  ('News','news',10), ('Politics','politics',20), ('Business','business',30),
  ('Technology','technology',40), ('Education','education',50), ('Sport','sport',60),
  ('Entertainment','entertainment',70), ('Health','health',80), ('Science','science',90),
  ('Lifestyle','lifestyle',100), ('Jobs & Careers','jobs-careers',110), ('Migration','migration',120);

-- RLS: public readers only see published editorial data. Mutations remain server/admin-only.
alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.sources enable row level security;
alter table public.story_clusters enable row level security;
alter table public.articles enable row level security;
alter table public.article_regions enable row level security;
alter table public.article_categories enable row level security;
alter table public.topics enable row level security;
alter table public.article_topics enable row level security;
alter table public.ingestion_runs enable row level security;

revoke all on public.regions, public.categories, public.sources, public.story_clusters, public.articles, public.article_regions, public.article_categories, public.topics, public.article_topics, public.ingestion_runs from anon, authenticated;

grant select on public.regions, public.categories, public.story_clusters, public.topics to anon, authenticated;
grant select on public.articles, public.article_regions, public.article_categories, public.article_topics to anon, authenticated;

create policy "public regions readable" on public.regions for select to anon, authenticated using (is_active = true);
create policy "public categories readable" on public.categories for select to anon, authenticated using (true);
create policy "public clusters readable" on public.story_clusters for select to anon, authenticated using (true);
create policy "public topics readable" on public.topics for select to anon, authenticated using (true);
create policy "published articles readable" on public.articles for select to anon, authenticated using (status = 'published');
create policy "published article regions readable" on public.article_regions for select to anon, authenticated using (exists (select 1 from public.articles a where a.id = article_id and a.status = 'published'));
create policy "published article categories readable" on public.article_categories for select to anon, authenticated using (exists (select 1 from public.articles a where a.id = article_id and a.status = 'published'));
create policy "published article topics readable" on public.article_topics for select to anon, authenticated using (exists (select 1 from public.articles a where a.id = article_id and a.status = 'published'));
