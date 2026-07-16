-- Per-IP rate-limit audit for open, self-service bond creation (POST /api/stakes).
-- Mirrors vti_ingest_audit: raw IPs are never stored, only a salted hash.
create table if not exists stake_ingest_audit (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  memo_code text,
  recorded_at timestamptz not null default now()
);
create index if not exists stake_ingest_audit_ip_time_idx
  on stake_ingest_audit (ip_hash, recorded_at desc);
alter table stake_ingest_audit enable row level security;
-- RLS on, no policies: anon denied; the server (service role) bypasses.
