# BridgeNews

BridgeNews is a multi-region news discovery portal focused on Sri Lanka, Australia and international coverage. It aggregates publisher metadata and snippets, links readers back to original publishers, and includes a full administration workspace for content, sources, homepage controls, ingestion and system health.

## Current production features

- Next.js 16 App Router / React 19
- Sri Lanka, Australia and International region browsing
- English, Sinhala and Tamil source coverage
- Automated RSS and permitted public-web ingestion
- Live ingestion monitor with imported article details
- Source health/error tracking and automatic pause after repeated failures
- Canonical URL and external-ID duplicate prevention
- Non-AI rule/category processing and headline story clustering
- Manual Main Headline, Breaking, Featured, priority and timed pin controls
- Homepage section ordering/visibility controls
- Article, source, category, topic, region, official-source, video, user and settings administration
- Public search with region, language, publisher, category, topic and date filters
- Story pages with publisher attribution, related coverage, SEO/social metadata and original-source links
- Article image extraction/backfill with branded fallbacks
- Reader bookmarks/follows and article view metrics
- Sitemap, robots and SEO settings
- Supabase Auth admin guard using `app_metadata.role = "admin"`
- RLS and explicit public read/admin write policies

**AI enrichment is intentionally disabled for the current BridgeNews release.** Ingestion and publishing work without an AI provider.

## Local start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Required browser/server variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Server/Edge-only values must never use a `NEXT_PUBLIC_` prefix:

```bash
SUPABASE_SERVICE_ROLE_KEY=...
INGEST_CRON_SECRET=...
```

## Verification

Before merging or deploying:

```bash
npm run typecheck
npm run build
```

GitHub Actions runs both checks for pull requests to `main`.

## Database

Apply the committed `supabase/migrations` files in order. The latest migrations add editorial placement, stronger non-AI clustering, source auto-pause protection and expanded Tamil source coverage.

The production schema keeps privileged writes behind authenticated admin policies. Edge ingestion uses the Supabase service-role key only in the server-side function environment.

## Ingestion

Functions include:

- `ingest-rss` — RSS/Atom ingestion, duplicate prevention, health tracking and auto-pause
- `ingest-web` / `ingest-generic-web` — configured permitted public-web sources
- `backfill-images` — recovers missing publisher thumbnails using Open Graph, Twitter, JSON-LD, lazy-image and srcset metadata
- `backfill-source-logos` — source identity/logo maintenance

The admin live ingestion screen refreshes automatically and shows recently imported stories, source, region, status, times, image, original URL and processing errors.

## Editorial workflow

Admin → Articles supports:

- publish/review/reject state
- headline and description edits
- category/topic assignment
- **Main Headline**
- **Breaking**
- **Featured**
- priority from 0–100
- optional pin expiry

Public homepage ranking respects editorial placement first, then freshness/trending signals.

## Production deployment

For Vercel (or another Next.js host), configure at minimum:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_PUBLIC_DOMAIN
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Supabase Edge Function secrets remain configured in Supabase, not as public Vercel variables.

After deployment verify:

1. `/` loads real published data.
2. `/admin` requires an admin account.
3. `/admin/ingestion` shows live imports.
4. `/search` filters across region/language/source/category/topic/date.
5. `/sitemap.xml` and `/robots.txt` resolve.
6. A story page has title/description/Open Graph metadata and working original publisher links.
7. Source health contains no enabled source above the failure threshold.
