-- Fleet ledger (R7) — the shared "already-scouted" set for the autonomous fleet.
--
-- POST /api/fleet-ledger records which repos a fleet investigated and what traps
-- it found there, so sibling fleets skip them. OPEN endpoint (no token): the gate
-- is server-side validation + a per-IP hourly cap. Missing this table is why
-- /api/fleet-ledger 500s in prod.
--
-- One row per repo. `traps` is the union of trap-ids found there (never erased —
-- the route merges non-destructively). Upsert on `repo` (idempotent).
create table if not exists fleet_ledger (
  repo            text primary key,          -- owner/repo
  sdk             text,                       -- the SDK the scout targeted (nullable)
  traps           text[] not null default '{}',
  investigated_at timestamptz not null default now()
);
create index if not exists fleet_ledger_investigated_idx on fleet_ledger (investigated_at desc);

-- Abuse log for the OPEN POST /api/fleet-ledger, keyed by a SALTED HASH of the
-- submitter IP (never the raw IP). Used only for the per-IP hourly cap
-- (fleetGuard). Prune rows older than ~1 day on a cron.
create table if not exists fleet_ledger_audit (
  id          bigint generated always as identity primary key,
  ip_hash     text not null,
  repo        text,
  recorded_at timestamptz not null default now()
);
create index if not exists fleet_ledger_audit_ip_time_idx
  on fleet_ledger_audit (ip_hash, recorded_at desc);
