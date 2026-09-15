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
- Automatic social publishing queue for every public article
- Direct publishing to Facebook, Instagram, Threads, X and LinkedIn official APIs
- Bulk social scheduling for existing public articles
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

Direct social credentials belong in Supabase Edge Function secrets, never browser environment variables:

```bash
BRIDGENEWS_SITE_URL=https://YOUR_PUBLIC_DOMAIN
META_GRAPH_VERSION=v24.0
FACEBOOK_PAGE_ID=...
FACEBOOK_PAGE_ACCESS_TOKEN=...
INSTAGRAM_ACCOUNT_ID=...
META_PAGE_ACCESS_TOKEN=...
THREADS_USER_ID=...
THREADS_ACCESS_TOKEN=...
THREADS_API_BASE=https://graph.threads.net/v1.0
X_USER_ACCESS_TOKEN=...
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_ORGANIZATION_ID=...
LINKEDIN_VERSION=202609
```

## Verification

Before merging or deploying:

```bash
npm run typecheck
npm run build
```

GitHub Actions runs both checks for pull requests to `main`.

## Database

Apply the committed `supabase/migrations` files in order. The current schema includes editorial placement, non-AI clustering, strict publisher-image enforcement, source health controls, first-party traffic events, newsletter subscribers and the automatic social publishing queue.

Privileged writes remain behind server/admin access. Public analytics and newsletter requests go through validated Next.js server routes; the database tables themselves are not opened for anonymous direct writes.

## Ingestion

Functions include:

- `ingest-rss` — RSS/Atom ingestion, duplicate prevention, health tracking and auto-pause
- `ingest-web` / `ingest-generic-web` — configured permitted public-web sources
- `backfill-images` — verifies and recovers real publisher news images from Open Graph, Twitter, JSON-LD, lazy-image and srcset metadata
- `backfill-source-logos` — source identity/logo maintenance
- `social-publish` — publishes queued public stories directly to official social APIs with retry/backoff

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
- `/admin/social` — auto-post configuration, direct API status, bulk scheduling, retries and failures

### Automatic social publishing

When an article reaches `published` status and has its verified real image, a database trigger creates one social job per enabled platform. A Supabase cron job invokes `social-publish` every minute. The worker posts directly to Facebook Pages, Instagram Business/Creator publishing, Threads, X API v2 and LinkedIn Posts API. Provider IDs/responses are stored in the queue and temporary failures retry with exponential backoff.

Each social link contains UTM parameters so `/admin/traffic` can attribute visits back to the network. `/admin/social` also includes a bulk scheduler for older public articles, allowing a count, lookback window, start delay, spacing interval and selected networks.

The publishing credentials are intentionally server-only. Configure them as Supabase Edge Function secrets before enabling production auto-posting. A platform with missing credentials is skipped by the worker without consuming retry attempts, so its jobs remain queued until that account is connected. X requires a user-context access token that can create Posts. LinkedIn organization publishing requires the correct organization permission for the authenticated member/app.

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
3. `/admin/ingestion`, `/admin/images`, `/admin/traffic` and `/admin/social` load real operational data.
4. `/search` filters across region/language/source/category/topic/date.
5. `/sitemap.xml`, `/news-sitemap.xml` and `/robots.txt` resolve.
6. `/brief` loads current regional coverage and newsletter signup works.
7. A story page has title/description/Open Graph/NewsArticle metadata and working original publisher links.
8. Publish a test article and confirm the selected `/admin/social` jobs move from `queued` to `published` after the next successful direct-API cron run.
9. Source health contains no enabled source above the failure threshold.
