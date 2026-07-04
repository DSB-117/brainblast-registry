-- Bond-on-VTI (R5 confidence bond). The staking rail now bonds $BRAIN behind a
-- specific Verified Trap Instance (its trap_id), not a pack/rule. trap_id is the
-- bond target; pack_id/rule_id are kept nullable for legacy rows only.
--
-- Lifecycle (status column): pending_payment → active (memo matched on-chain) →
-- slashed (its VTI stopped reproducing) | withdrawn. The legacy value 'staked'
-- is treated as 'active'.
alter table stake_submissions add column if not exists trap_id text;
alter table stake_submissions alter column pack_id drop not null;
alter table stake_submissions alter column rule_id drop not null;
create index if not exists stake_submissions_trap_idx on stake_submissions (trap_id);
