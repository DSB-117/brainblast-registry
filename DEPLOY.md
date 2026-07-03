# Deploying the Brainblast registry

The registry is a Next.js 14 app deployed on Vercel. It serves two things from
one codebase:

1. **The public dashboard** (`/`, `/browse`, `/coverage`, `/proof`, `/sla`,
   `/pricing`, `/access`, `/docs`) — reads the live VTI corpus from GitHub raw.
2. **The distribution API** (`/api/catalog`, `/api/feed`, `/api/healthz`,
   `/api/fleet-ledger`, …) — the marketplace endpoint, backed by Supabase.

The dashboard needs **no secrets** to render (it fetches the public corpus).
Secrets are only for the API surface.

---

## Private preview gate (optional — go live but keep it private)

To deploy the site but keep the human-facing pages behind a password (soft
launch / private preview), set **`SITE_GATE_PASSWORD`** in Vercel env. Every
page then prompts for HTTP Basic Auth; the `/api/*` routes stay open so the
public catalog, the free sample feed, and CLI testing keep working.

| Var | |
|---|---|
| `SITE_GATE_PASSWORD` | Set it → the site is gated. **Delete it → the site is fully public.** |
| `SITE_GATE_USER` | Optional username (default `preview`). |

Share the `user:password` with whoever should get in. At launch, remove
`SITE_GATE_PASSWORD` and redeploy → the storefront is public.

> Note: Vercel env-var changes take effect on the **next deployment**, not
> instantly. So to flip the gate on or off, change the var and hit **Redeploy**
> (Deployments → ⋯ → Redeploy — one click, ~1 min). Implemented in
> `middleware.ts`.

---

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

### Required for the marketplace API

| Var | What it is |
|---|---|
| `SUPABASE_URL` | Supabase project URL (usage ledger + fleet ledger). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **server-only**, never exposed to the client. |
| `BRAINBLAST_MARKET_PUBKEY` | The distributor's ed25519 **public** address. `/api/feed` verifies grants against this. Generate the identity offline with `brainblast grant keygen`; publish only the address. |

### Recommended

| Var | What it is |
|---|---|
| `FLEET_IP_SALT` | Random secret. Salts the per-IP hash in the fleet-ledger abuse log (raw IPs are never stored). Set any long random string. |
| `NEXT_PUBLIC_ACCESS_EMAIL` | The address the "Request access" CTA emails. Defaults to `access@brainblast.tech` — **confirm this alias exists and forwards to you**, or override it. |
| `GITHUB_TOKEN` | A read-only PAT. Lifts GitHub API rate limits for pack-registry / corpus reads. |

### Optional (have sensible defaults)

| Var | Default | Purpose |
|---|---|---|
| `VTI_SOURCE_URL` | GitHub raw `datasets/seed/seed-vti.jsonl` | Corpus source the dashboard + API read. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | publicnode mirror | Browser RPC for wallet reads. |
| `SOLANA_RPC_URL` | publicnode mirror | Server RPC. |
| `CRON_SECRET` / `SYNC_TOKEN` | — | Auth for the `/api/*/sync` cron routes (only if you run those crons). |
| `PACK_REGISTRY_INDEX_URL` | — | The older pack-registry index (separate business; not needed for the VTI marketplace). |

> `BRAINBLAST_MARKET_SECRET` is **only** needed if you issue grants *from the
> server*. At launch, grants are issued offline (`brainblast grant issue
> --tier <tier>`) in response to a request-access email, so the registry does
> **not** need the secret. Keep it off the server until self-serve issuance ships.

---

## 2. Apply the Supabase migration

The full schema lives in [`supabase/schema.sql`](supabase/schema.sql). Most of
it is already applied on the live project. The one **missing** table (its
`/api/fleet-ledger` route currently 500s in prod) is `fleet_ledger`. Run this in
the Supabase SQL editor:

```sql
create table if not exists fleet_ledger (
  repo text primary key,
  sdk text,
  traps jsonb not null default '[]'::jsonb,
  investigated_at timestamptz not null default now()
);
create index if not exists fleet_ledger_sdk_idx on fleet_ledger (sdk);

create table if not exists fleet_ledger_audit (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  repo text not null,
  recorded_at timestamptz not null default now()
);
create index if not exists fleet_ledger_audit_ip_time_idx
  on fleet_ledger_audit (ip_hash, recorded_at desc);
```

Safe to re-run — every statement is `if not exists`. If you'd rather apply the
whole file, running `supabase/schema.sql` in full is idempotent for the same
reason.

---

## 3. Deploy

The `redesign/dashboard-shell` branch carries the new dashboard. Merge it to the
branch Vercel builds (usually `main`), then Vercel auto-deploys on push. Or:

```bash
vercel --prod
```

Build is verified locally: `npm run build` → all 8 dashboard pages + the API
routes generate clean.

---

## 4. Smoke-test after deploy

```bash
curl -s https://registry.brainblast.tech/api/healthz          # {"status":"ok", ...}
curl -s https://registry.brainblast.tech/api/catalog | head   # public catalog JSON
curl -s "https://registry.brainblast.tech/api/feed" | head    # anonymous sample tier
curl -s https://registry.brainblast.tech/api/fleet-ledger     # should NOT 500 after the migration
```

Then open the site and click every sidebar link — all eight pages should render
the live corpus (15 VTIs, 100% reproduction).
