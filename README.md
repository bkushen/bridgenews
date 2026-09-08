# BridgeNews starter

A smart news/content discovery platform focused on Sri Lanka, Australia and International coverage.

## Included now

- Next.js 16 App Router starter
- Region navigation and multi-region mock stories
- Home, Latest, Trending, Topics, Story and Admin pages
- Admin source management with preview fallback and live server-side CRUD when Supabase is configured
- Supabase Auth admin login/guard using `app_metadata.role = "admin"`
- Supabase browser/server client helpers
- PostgreSQL schema for regions, categories, sources, articles, story clusters, topics and ingestion runs
- Per-source region defaults
- RSS ingestion Edge Function supporting RSS and Atom
- Canonical URL + source external-ID duplicate prevention
- Feed health/error tracking
- Review-first vs automatic publishing mode
- pgvector-ready story cluster embeddings
- RLS + explicit grants for public read-only editorial data

## Local start

```bash
cp .env.example .env.local
npm install
npm run dev
```

The UI runs with mock data even before Supabase is connected.

## Database

Review and apply migrations in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_ingestion_pipeline.sql`
3. `supabase/migrations/0003_ai_pipeline.sql`

The schema intentionally keeps source-management and ingestion-log tables inaccessible to browser roles. Server-side ingestion must use a server-only Supabase secret/service-role key.

## RSS ingestion

Function: `supabase/functions/ingest-rss`

It loads enabled RSS sources, fetches RSS/Atom XML, normalizes canonical URLs, inserts unseen articles only, assigns regions, and records ingestion health.

## AI enrichment and story clustering

The `process-articles` Edge Function enriches newly ingested feed items using server-side OpenAI API calls. It generates a concise neutral summary, detects Sri Lanka/Australia/International relevance, assigns a category and topics, creates a 1536-dimensional embedding, and groups semantically similar reporting into one `story_cluster`.

Required Edge Function secrets:

```bash
OPENAI_API_KEY=...
OPENAI_CLASSIFICATION_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
PROCESS_CRON_SECRET=...
STORY_CLUSTER_THRESHOLD=0.86
```

Pipeline:

```text
RSS ingestion -> processing -> AI summary/classification -> embedding -> cluster match/create -> published or review_required
```
