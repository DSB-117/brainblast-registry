-- HiveMind federation (brainblast v0.11.0) — /api/hive/experience.
--
-- One row per (space, author, event): the signed fix-event stream a space's
-- members converge on. `seq` is the pull cursor (strictly increasing,
-- assigned at insert). The unique key gives DB-level idempotency for pushes
-- (PostgREST ignore-duplicates upsert), so clients can re-push their whole
-- log safely. A space id (hs_…) is an unguessable capability — there is no
-- membership table by design; see the route header for the trust model.
create table if not exists hive_experience (
  seq         bigint generated always as identity primary key,
  space       text not null,
  author      text not null,               -- base58 ed25519 address (batch-verified)
  event_key   text not null,               -- ruleId::repoPath::file::export::fixedAt
  received_at timestamptz not null default now(),
  event       jsonb not null,
  unique (space, author, event_key)
);
create index if not exists hive_experience_space_seq_idx on hive_experience (space, seq);

-- Abuse log for the OPEN POST, keyed by a SALTED HASH of the submitter IP
-- (never the raw IP) — same pattern as fleet_ledger_audit / vti_ingest_audit.
-- Used only for the per-IP hourly cap; prune rows older than ~1 day on a cron.
create table if not exists hive_experience_audit (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists hive_experience_audit_ip_idx on hive_experience_audit (ip_hash, created_at desc);
