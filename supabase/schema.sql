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
