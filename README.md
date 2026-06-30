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

### Distribution endpoint — the verified-trap marketplace (R3)

The hosted half of the training-data market. The server holds the full VTI
corpus; a client with a signed grant receives only what its tier entitles. The
request logic is the **vendored brainblast distribution surface** (`lib/brainblast/`,
synced from the `brainblast/distribution` subpath — the same `handleRequest` the
`brainblast serve` CLI runs), so this app never pulls brainblast's native deps.

- **`GET /api/catalog`** — the storefront. **Public + anonymous**: coverage,
  freshness, the tier/price ladder, receipt-only teasers.
- **`GET /api/feed`** — **anonymous → the open sample tier** (receipt-only); with
  an `x-brainblast-grant: <base64 grant JSON>` header → the **entitled tier**,
  verified against `BRAINBLAST_MARKET_PUBKEY` (ed25519, **no shared secret**).
  Filter with `?sdk=&class=&severity=&min_corroboration=&since=&limit=`. A grant's
  lot-scope is enforced server-side. Gated pulls are metered to the hash-chained
  `usage_ledger` table (rejected pulls are never metered; a broken ledger
  fail-closes).
- **`GET /api/healthz`** — liveness + corpus size.

The VTI corpus is fetched from the brainblast repo's published lot
(`VTI_SOURCE_URL`, default the `v0.1.0` full lot on `main`) and cached per warm
instance. Issue grants offline with `brainblast grant keygen` / `grant issue`;
publish only the `.address` here (`BRAINBLAST_MARKET_PUBKEY`).

### Fleet ledger — the shared "already-investigated" record (R7)

`fleet_ledger` lets independent scout fleets avoid re-scouting the same repos.
It's **open and server-validated** — any fleet pushes to it with **no token and no
key**. The Supabase service-role key never leaves this server; the server
validates every submission before it lands.

- **`GET /api/fleet-ledger`** — the investigated-repo set (so a fleet's discovery
  skips what's done).
- **`POST /api/fleet-ledger`** — record scouted repos. Body `{ rows: [{ repo,
  sdk?, traps? }] }`. No auth — **griefing is handled by the server**, not by
  gating honest fleets:
  1. **Rate limit** — per-IP cap (`HOURLY_REPO_CAP`) on repos recorded per hour
     (IP is salted-hashed, never stored raw; `fleet_ledger_audit`).
  2. **Repo verification** — a *new* repo must exist on GitHub and clear
     `MIN_STARS` (set `GITHUB_TOKEN` to enable; without it this check is skipped).
     You can't suppress fabricated or obscure repos.
  3. **Non-destructive merge** — re-recording a known repo **unions** its traps;
     a submission can never erase what another fleet found.
  4. **Freshness TTL** (consumer-side) — `fleet:discover` only skips a repo
     investigated within `--max-age-days` (default 30), so a false row suppresses
     a repo for at most the TTL, and stale repos get re-scouted.

Operators just run the fleet — by default it talks to `registry.brainblast.tech`;
override with `FLEET_REGISTRY_URL`. Nothing to issue, nothing to hold.

Optional server env: `GITHUB_TOKEN` (enables repo verification), `FLEET_IP_SALT`
(salts the IP hashes). Prune `fleet_ledger_audit` rows older than a day on a cron.

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
