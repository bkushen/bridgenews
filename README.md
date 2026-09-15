# BridgeNews

BridgeNews is a multi-region news discovery portal focused on Sri Lanka, Australia and international coverage. It aggregates publisher metadata and snippets, links readers back to original publishers, and includes a full administration workspace for content, sources, homepage controls, ingestion, audience growth and system health.

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
- Story pages with publisher attribution, related coverage, SEO/social metadata, NewsArticle schema and original-source links
- Strict verified publisher-image requirement with recovery queue; public articles never use placeholders
- Reader bookmarks/follows and article view metrics
- Standard sitemap, Google News sitemap, robots and SEO settings
- Search Console/Bing verification hooks and optional GA4
- First-party privacy-conscious traffic analytics without IP storage
- Daily Brief landing page and newsletter signup capture
- Social publishing queue for highlighted/breaking stories
- Supabase Auth admin guard using `app_metadata.role = "admin"`
- RLS and explicit privileged write boundaries

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

Optional audience/search variables:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...
NEXT_PUBLIC_BING_SITE_VERIFICATION=...
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

Apply the committed `supabase/migrations` files in order. The current schema includes editorial placement, non-AI clustering, strict publisher-image enforcement, source health controls, first-party traffic events, newsletter subscribers and the social publishing queue.

Privileged writes remain behind server/admin access. Public analytics and newsletter requests go through validated Next.js server routes; the database tables themselves are not opened for anonymous direct writes.

## Ingestion

Functions include:

- `ingest-rss` — RSS/Atom ingestion, duplicate prevention, health tracking and auto-pause
- `ingest-web` / `ingest-generic-web` — configured permitted public-web sources
- `backfill-images` — verifies and recovers real publisher news images from Open Graph, Twitter, JSON-LD, lazy-image and srcset metadata
- `backfill-source-logos` — source identity/logo maintenance

The admin live ingestion screen refreshes automatically and shows recently imported stories, source, region, status, times, image, original URL and processing errors. `/admin/images` manages the strict image-recovery queue.

## Growth system

Public growth surfaces:

- `/brief` — continuously updated Daily Brief across Sri Lanka, Australia and International coverage
- `/news-sitemap.xml` — Google News sitemap containing recent public stories
- `/sitemap.xml` — public routes, stories, sources, categories and topics
- newsletter signup in the footer and Daily Brief
- first-party page-view, referrer, UTM and outbound-publisher-click measurement
- optional GA4 instrumentation when a measurement ID is configured

Admin growth surfaces:

- `/admin/traffic` — 24h/7d/30d traffic, top pages, referrers, campaigns and subscriber growth
- `/admin/newsletter` — captured Daily Brief subscribers
- `/admin/social` — automatically queued breaking/featured/main-headline stories for social review

Actual newsletter delivery and automatic posting to third-party social platforms require authenticated external providers. BridgeNews deliberately records queue/approval state without claiming delivery or publication until those providers are connected.

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
SUPABASE_SERVICE_ROLE_KEY
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Supabase Edge Function secrets remain configured in Supabase, not as public Vercel variables.

After deployment verify:

1. `/` loads real published data.
2. `/admin` requires an admin account.
3. `/admin/ingestion`, `/admin/images` and `/admin/traffic` load real operational data.
4. `/search` filters across region/language/source/category/topic/date.
5. `/sitemap.xml`, `/news-sitemap.xml` and `/robots.txt` resolve.
6. `/brief` loads current regional coverage and newsletter signup works.
7. A story page has title/description/Open Graph/NewsArticle metadata and working original publisher links.
8. Source health contains no enabled source above the failure threshold.
