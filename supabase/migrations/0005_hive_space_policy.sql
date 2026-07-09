-- HiveMind per-space ACL (brainblast v0.13.0) — /api/hive/policy.
--
-- One current policy per space: an ed25519-SIGNED document governing who may
-- contribute (writeMode) and who may read (readMode). The signature is the
-- authority — no accounts. verifyPolicy (in the vendored handler) enforces
-- TOFU-then-admin-signed-monotonic updates before a row is written here, so
-- this table only ever holds a policy that passed verification. Replaced in
-- place on a valid update (merge-duplicates upsert on `space`); `version` is
-- the monotonic guard the handler checks.
create table if not exists hive_space_policy (
  space      text primary key,
  policy     jsonb not null,               -- the full signed SpacePolicy
  version    int not null,                 -- monotonic; handler rejects a non-increasing update
  updated_at timestamptz not null default now()
);
