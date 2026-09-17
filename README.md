# FoundingVFX

A ScenePack discovery, request and download platform for editors. Built with Next.js 16 (App Router), React 19 and TypeScript.

> **Status:** Foundation release (Phases 1–4 of the roadmap). The site runs on clearly labeled **demo data** until the PostgreSQL repository is connected in Phase 5.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — everything has safe defaults
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve build |
| `npm run check` | Lint, typecheck, unit tests and Prisma schema validation |
| `npm test` | Vitest unit tests (search, repository, storage, download flow, SigV4 signing) |

## Docker

```bash
docker compose up --build          # http://localhost:3000
docker compose --profile db up     # also starts PostgreSQL (for Phase 5)
```

Or without Compose:

```bash
docker build -t foundingvfx \
  --build-arg NEXT_PUBLIC_SITE_URL=https://foundingvfx.example \
  --build-arg NEXT_PUBLIC_TIKTOK_URL=https://www.tiktok.com/@foundingvfx8 .
docker run -p 3000:3000 --env-file .env foundingvfx
```

- Multi-stage build on `node:24-alpine` using Next.js `output: "standalone"`; runs as a non-root user.
- **`NEXT_PUBLIC_*` values are baked in at build time** (pass them as build args, or put them in `.env` for Compose). Change them → rebuild.
- Server settings and secrets (`DATA_SOURCE`, `FEATURE_*`, storage keys, `RATE_LIMIT_SALT`, `DATABASE_URL`) are read at runtime from the environment and never copied into the image — `.env` is excluded by `.dockerignore`.
- Health check: `GET /api/health`.

## What's built

**Public site** — homepage (cinematic hero, featured, recently added, popular shows, channels, genres, playlists, collections, most-wanted and latest requests, what's new) · ScenePack library with combinable filters, sorting, pagination and quick view · ScenePack detail pages (metadata, editing facts, previews, similar packs, favorite/share/copy/report) · show, character, channel, genre, playlist and collection pages · global search with autocomplete and a `/` or `⌘K` command palette · request board with tabs and filters, request detail pages, search-first "request a ScenePack" flow · device-local favorites · Surprise Me · changelog · legal page scaffolds · contact · 404/error/loading/empty states · dark/light theme (persisted, follows OS until chosen) · full mobile layouts.

**Infrastructure** — repository abstraction · provider-independent storage layer (Google Drive, MEGA, TeraBox, any HTTPS URL, Cloudflare R2 and Backblaze B2 with presigned URLs) · download gateway with monetization hook (off) · public read API · rate limiting · security headers · SEO metadata, sitemap, robots, Open Graph image, PWA manifest · full PostgreSQL schema.

## Architecture

```
app/
  (site)/            Public pages (shared chrome: announcements, navbar, footer)
  api/               Public JSON API — the future mobile app / Discord bot surface
components/          UI, grouped by domain (scenepack, cards, requests, filters, layout, ui)
config/              Non-secret configuration: site + social links, feature flags, monetization
lib/
  data/repository.ts The ContentRepository contract every page depends on
  data/sample/       Demo implementation (in-memory)
  data/storage.ts    Server-only storage records — kept apart from content data
  search/            Text scoring + structured query parsing ("1080p henry 60fps")
services/
  storage/           StorageProvider interface + providers + SigV4 presigner
  download/          Pack → storage → monetization → redirect
  monetization/      Adapter hook, disabled by default
  analytics/         Single call site for aggregate events (no-op until Phase 10)
prisma/schema.prisma PostgreSQL schema for Phase 5
tests/unit/          Vitest suites
```

### Key rules the code enforces

- **No hard-coded content.** Channels, shows, genres and characters are records. The only content in source is the demo dataset in `lib/data/sample/`, which nothing else imports directly.
- **Downloads are provider-independent.** A ScenePack's file lives in a `StorageObject`. Switching Google Drive → R2 changes the record, not the code. Storage fields never reach the browser; downloads go through `/download/[slug]`, which resolves the destination server-side.
- **No fake numbers.** Popularity sorts and Trending stay hidden until `FEATURE_ANALYTICS=true`. "Popular Shows" is ranked by library size, and says so. Demo data is labeled site-wide.
- **Unbuilt features say so.** Voting and request submissions are visible but clearly marked as upcoming (`FEATURE_REQUEST_SUBMISSIONS`).

### Connecting the database (Phase 5)

1. Set `DATABASE_URL`, run `npx prisma migrate dev`.
2. Implement `ContentRepository` with Prisma (`lib/data/prisma/repository.ts`) and a Prisma-backed `StorageRepository`.
3. Return it from `getRepository()` when `DATA_SOURCE=database`.

No page or component changes are required.

## Configuration

All settings live in `.env.example`. Social links render as "coming soon" until a URL is set — nothing is invented. Secrets (storage keys, database URL) are read only in server modules guarded by `server-only`.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1–4 | Design system, browsing, entity pages, search/filter/sort | ✅ Done |
| 5 | PostgreSQL repository | Schema ready |
| 6 | Admin dashboard (CRUD, scheduling, audit log) | — |
| 7 | Request submissions, voting, duplicate detection & merge | Search-first flow ready |
| 8 | Accounts, synced favorites, notifications | — |
| 9 | Storage health checks | Providers ready |
| 10 | Analytics, trending, popular searches | Event hook ready |
| 11 | Discord webhooks | — |
| 12 | Monetization (ads, Linkvertise) | Hook ready, off |
| 13–14 | Recommendations/AI, PWA, mobile API | Query parser, API and manifest ready |

## Before launch

- Replace legal page placeholders after legal review (`app/(site)/legal/[page]/page.tsx`).
- Set `RATE_LIMIT_SALT`, `NEXT_PUBLIC_SITE_URL` and the social URLs.
- Rate limiting is in-memory per instance — back it with Redis before running multiple instances.
