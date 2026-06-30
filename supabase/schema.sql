-- brainblast-registry schema
-- Run via Supabase SQL editor or `supabase db push`.

-- Raw graduation events submitted via `brainblast telemetry submit`.
-- One row per (pack_id, rule_id, repo_hash, user_hash, timestamp) the CLI
-- recorded locally in .agent-research/telemetry.ndjson.
create table if not exists telemetry_events (
  id bigint generated always as identity primary key,
  pack_id text not null,
  rule_id text not null,
  repo_hash text not null,
  user_hash text not null,
  event_timestamp timestamptz not null,
  received_at timestamptz not null default now()
);

-- Rate limit: at most one event per (user_hash, rule_id) every 30 days.
-- Enforced at the application layer (see app/api/telemetry/route.ts) since
-- Postgres doesn't support "latest row in window" uniqueness constraints
-- directly; indexed for the lookup query.
create index if not exists telemetry_events_user_rule_idx
  on telemetry_events (user_hash, rule_id, received_at desc);

create index if not exists telemetry_events_pack_rule_idx
  on telemetry_events (pack_id, rule_id);

-- Graduation status per (pack_id, rule_id). A rule graduates once it has
-- >= 5 distinct (repo_hash, user_hash) pairs within a trailing 90-day
-- window. Recomputed on each ingest; see app/api/telemetry/route.ts.
create table if not exists rule_graduations (
  pack_id text not null,
  rule_id text not null,
  distinct_pairs int not null default 0,
  graduated boolean not null default false,
  graduated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (pack_id, rule_id)
);

-- Mirror of the GitHub-based pack registry index (packs.json in
-- DSB-117/brainblast-pack-registry), refreshed periodically so
-- registry.brainblast.tech can serve/display it without hitting GitHub
-- on every request.
create table if not exists pack_registry (
  pack_id text primary key,
  name text not null,
  repo_url text not null,
  author text,
  description text,
  latest_version text,
  synced_at timestamptz not null default now()
);

-- Submission staking (Phase 6, memo+indexer v1 — see README "Staking").
-- An author calls POST /api/stakes to register a pack submission and gets
-- back a one-time `memo_code`. They then transfer the stake (in $BRAIN, SOL,
-- or USDC) to the bounty pool wallet
-- (5roYMY7P1rWbfkvqGVFRjV39vE6FD66bwNZA9oEhcu2i) with that memo code attached
-- to the transaction. POST /api/stakes/sync (the indexer, run on a schedule)
-- scans recent transactions to that wallet, matches memos to pending rows,
-- and flips them to 'staked'.
create table if not exists stake_submissions (
  id bigint generated always as identity primary key,
  memo_code text not null unique,
  pack_id text not null,
  rule_id text not null,
  author_wallet text not null,
  stake_usd numeric not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'staked', 'rejected', 'graduated', 'refund_requested', 'refunded')),
  tx_signature text,
  token_mint text,
  token_amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stake_submissions_status_idx
  on stake_submissions (status);

-- Rejected stakes the author has asked to reclaim. Processed manually in a
-- weekly batch (Fridays) per the v0.5.0 launch decision; automate later.
create table if not exists refund_requests (
  id bigint generated always as identity primary key,
  stake_id bigint not null references stake_submissions (id),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  refund_tx_signature text
);

-- Authoritative metering for the distribution endpoint (R3). Append-only,
-- hash-chained: each row's `hash` covers the prior row's `hash` (prev_hash), so
-- any edit/removal of history breaks the chain. `seq` is the primary key, so a
-- concurrent race produces a duplicate-key error (the request 500s and the
-- client retries) rather than a forked chain. Written only by GET /api/feed for
-- grant-backed pulls.
create table if not exists usage_ledger (
  seq bigint primary key,
  prev_hash text not null,
  hash text not null,
  ts timestamptz not null,
  buyer text not null,
  tier text not null,
  lots jsonb not null default '[]'::jsonb,
  records_served integer not null,
  cursor text,
  query jsonb,
  received_at timestamptz not null default now()
);
create index if not exists usage_ledger_buyer_idx on usage_ledger (buyer);

-- Fleet ledger (R7 autonomy). The shared "already-investigated" record so sibling
-- scout fleets don't re-scout the same repositories. One row per repo; `traps` is
-- the list of trap ids the fleet promoted from that repo (empty = scouted clean).
-- Written by `npm run fleet:ledger`; read by `npm run fleet:discover` to skip.
create table if not exists fleet_ledger (
  repo text primary key,
  sdk text,
  traps jsonb not null default '[]'::jsonb,
  investigated_at timestamptz not null default now(),
  investigated_by text  -- the fleet-token label that recorded it (audit trail)
);
create index if not exists fleet_ledger_sdk_idx on fleet_ledger (sdk);

-- Per-operator fleet tokens. Outside fleet operators authenticate to
-- /api/fleet-ledger with one of these (Bearer) instead of ever holding the
-- Supabase service-role key. Only the SHA-256 hash is stored, so a DB leak does
-- not reveal usable tokens. Issued + revoked via /api/fleet-tokens (admin).
create table if not exists fleet_tokens (
  id bigint generated always as identity primary key,
  label text not null,            -- human name for the operator/fleet
  token_hash text not null unique, -- sha256(token), hex
  created_at timestamptz not null default now(),
  revoked_at timestamptz           -- non-null => disabled
);
create index if not exists fleet_tokens_hash_idx on fleet_tokens (token_hash);
