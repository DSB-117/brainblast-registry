# brainblast-registry

Backend service for the [brainblast](https://github.com/DSB-117/brainblast) rule-pack
incentive flywheel, deployed at `registry.brainblast.tech`.

## What it does

- **`POST /api/telemetry`** — receives opt-in graduation events from
  `brainblast telemetry submit` (NDJSON events of the form
  `{ pack_id, rule_id, repo_hash, user_hash, timestamp }`). Applies a
  per-`(user_hash, rule_id)` rate limit of one accepted event per 30 days,
  then recomputes the distinct-`(repo_hash, user_hash)`-pairs count for each
  `(pack_id, rule_id)` over a trailing 90-day window. A rule **graduates**
  (becomes bounty-eligible) once that count reaches 5.
- **`GET /api/packs`** — serves a cached mirror of the GitHub-based pack
  registry index (`DSB-117/brainblast-pack-registry/packs.json`, Phase 7).
- **`POST /api/packs`** — refreshes the mirror from the GitHub index.
  Protected by `SYNC_TOKEN`.

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql)
   to create `telemetry_events`, `rule_graduations`, and `pack_registry`.
3. Under **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` secret key** → `SUPABASE_SERVICE_ROLE_KEY`

   The service role key bypasses RLS and is only ever used server-side
   (`lib/supabase.ts`) — never expose it to the client.

### 2. Vercel project

1. `vercel link` (or import this repo from the Vercel dashboard).
2. Add environment variables (Project Settings → Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SYNC_TOKEN` — any random string, used to authorize `POST /api/packs`
   - `PACK_REGISTRY_INDEX_URL` (optional, defaults to the
     `brainblast-pack-registry` repo once it exists — Phase 7)
3. Deploy: `vercel --prod` (or push to `main` if the GitHub integration is
   connected).

### 3. DNS — `registry.brainblast.tech`

1. In the Vercel project, go to **Settings → Domains** and add
   `registry.brainblast.tech`.
2. Vercel will show the required DNS record (typically a `CNAME` to
   `cname.vercel-dns.com`, or an `A` record if it's an apex domain).
3. Add that record at your DNS provider for `brainblast.tech`.
4. Wait for DNS propagation, then Vercel will issue the TLS cert
   automatically.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase + sync token values
npm run dev
```

## Status

This is part of the v0.5.0 flywheel buildout. See
[brainblast#30](https://github.com/DSB-117/brainblast/issues/30) for the
overall release tracking.
