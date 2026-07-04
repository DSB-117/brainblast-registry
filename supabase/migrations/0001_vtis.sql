-- R11 — the git-less VTI ingest endpoint (POST /api/vti).
--
-- One row per Verified Trap Instance submitted directly (no PR). `record` is the
-- minted, contributor-licensed VTI (jsonb). The PK on trap_id gives DB-level
-- idempotency: a retried submission upserts with ignoreDuplicates → no-op.
--
-- provenance_verified is stamped true at ingest (the server fetched the cited
-- commit and confirmed the vulnerable line). proof_verified is flipped by a
-- brainblast-side RED→GREEN re-proof (where ts-morph runs) BEFORE a record is
-- exposed in any paid tier — the open sample tier can read provenance-verified
-- rows, the paid tiers gate on proof_verified.
create table if not exists vtis (
  trap_id            text primary key,
  record             jsonb not null,
  provenance_verified boolean not null default true,
  proof_verified     boolean not null default false,
  created_at         timestamptz not null default now()
);
create index if not exists vtis_proof_verified_idx on vtis (proof_verified);
create index if not exists vtis_created_idx on vtis (created_at desc);

-- Abuse log for the OPEN POST /api/vti, keyed by a SALTED HASH of the submitter
-- IP (never the raw IP). Used only to rate-limit per IP (HOURLY_SUBMIT_CAP).
-- Prune rows older than ~1 day on a cron.
create table if not exists vti_ingest_audit (
  id          bigint generated always as identity primary key,
  ip_hash     text not null,
  trap_id     text,
  recorded_at timestamptz not null default now()
);
create index if not exists vti_ingest_audit_ip_time_idx
  on vti_ingest_audit (ip_hash, recorded_at desc);
