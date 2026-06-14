# brainblast-registry

Backend service for the [brainblast](https://github.com/DSB-117/brainblast) rule-pack
incentive flywheel, deployed at `app.brainblast.tech`.

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

### Submission staking (memo + indexer v1)

A simple, non-custodial-program staking flow for pack/rule submissions:

1. **`POST /api/stakes`** — author registers a submission
   (`{ pack_id, rule_id, author_wallet, stake_usd }`) and gets back a unique
   `memo_code` plus the bounty pool wallet address
   (`5roYMY7P1rWbfkvqGVFRjV39vE6FD66bwNZA9oEhcu2i`).
2. The author transfers `stake_usd` worth of **$BRAIN** (10% discount),
   **SOL**, or **USDC** to that wallet with the `memo_code` attached.

   **Attaching a memo:** most wallet UIs (including Phantom's basic send
   flow) don't expose a memo field. Use the **`/stake/<memo_code>`** page on
   this site — it connects to Phantom (or any Wallet Standard wallet), builds
   a single transaction containing your transfer plus the required
   [SPL Memo](https://spl.solana.com/memo) instruction, and asks your wallet
   to sign it. Your private key never leaves the wallet extension. (If you'd
   rather use the CLI: `solana transfer ... --with-memo "<memo_code>"` or
   `spl-token transfer ... --with-memo "<memo_code>"`.)
3. **`POST /api/stakes/sync`** (the indexer, run on a schedule — e.g. Vercel
   Cron every few minutes) scans recent transactions to the bounty wallet,
   matches memos to `pending_payment` rows, and flips them to `staked`.
4. **`PATCH /api/stakes/:id`** (admin, `SYNC_TOKEN`) transitions a `staked`
   submission to `rejected` or `graduated`.
5. On rejection, the author calls **`POST /api/stakes/:id/reclaim`** to
   request a refund. **`GET /api/refunds`** (admin) lists the pending queue;
   **`PATCH /api/refunds`** marks one processed once the manual weekly
   (Friday) refund transfer is sent.

This is intentionally simple for v1 — a future iteration should move staking
to a trustless escrow program and automate refunds/payouts.

### Bounty pool wallet

`5roYMY7P1rWbfkvqGVFRjV39vE6FD66bwNZA9oEhcu2i` receives the 2% registry tax on
stakes, weekly $BRAIN buyback transfers, and the 50% author-split from
premium payments.

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

### 3. DNS — `app.brainblast.tech`

1. In the Vercel project, go to **Settings → Domains** and add
   `app.brainblast.tech`.
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
