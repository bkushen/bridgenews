-- RSS ingestion hardening and source defaults.

alter table public.sources
  add column if not exists default_language_code text not null default 'en',
  add column if not exists last_success_at timestamptz,
  add column if not exists last_error_at timestamptz,
  add column if not exists last_error_message text,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists max_items_per_fetch integer not null default 50 check (max_items_per_fetch between 1 and 200);

create table if not exists public.source_regions (
  source_id uuid not null references public.sources(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (source_id, region_id)
);

alter table public.articles
  add column if not exists external_id text,
  add column if not exists raw_metadata jsonb not null default '{}'::jsonb,
  add column if not exists processing_error text,
  add column if not exists fetched_at timestamptz not null default now();

create unique index if not exists articles_source_external_id_unique
  on public.articles (source_id, external_id)
  where external_id is not null;

create index if not exists sources_enabled_fetch_idx
  on public.sources (enabled, last_fetched_at);

create index if not exists source_regions_region_idx
  on public.source_regions (region_id, source_id);

alter table public.source_regions enable row level security;
revoke all on public.source_regions from anon, authenticated;

-- Source management and ingestion details remain server/admin only.
-- Browser roles receive no grants or policies for source_regions or sources.
