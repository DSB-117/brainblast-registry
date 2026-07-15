-- Contributor rewards (BRAIN-UTILITY.md function #3) — reward VERIFIABLE WORK,
-- not capital. When a submitted VTI first proves RED→GREEN and survives reprove,
-- the contributor (if they attached a payout wallet) accrues $BRAIN from a FIXED,
-- CAPPED pool. Reward is a function of work delivered (novel proven pattern +
-- corroboration), never of token price or sales revenue — and the pool's funding
-- is deliberately separate from sales, so "rewards are for work, not a share of
-- profits" is factually true (kept clear of the securities line).
--
-- Payout itself is operator-run (a $BRAIN transfer from the reward treasury,
-- weekly batch like refunds); this schema tracks accrual → paid.

-- Single-row pool config + emission counter (the cap). Seed one row on deploy.
create table if not exists reward_pool (
  id int primary key default 1,
  total_budget_brain numeric not null default 0,   -- fixed budget (NOT sales-linked)
  emitted_brain      numeric not null default 0,   -- running total accrued (the cap tracker)
  per_pattern_brain  numeric not null default 0,   -- reward for establishing a NOVEL proven pattern
  per_corroboration_brain numeric not null default 0, -- reward for corroborating an existing pattern
  updated_at timestamptz not null default now(),
  constraint reward_pool_singleton check (id = 1)
);

create table if not exists contributor_rewards (
  id bigint generated always as identity primary key,
  trap_id text not null unique,                    -- one accrual per VTI (idempotent)
  pattern_key text not null,                        -- the distinct-lesson signature
  wallet text not null,                             -- payout address (Solana)
  amount_brain numeric not null,
  reason text not null check (reason in ('novel-pattern', 'corroboration')),
  status text not null default 'accrued'
    check (status in ('accrued', 'paid', 'void')),
  tx_signature text,                                -- set when the operator pays out
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists contributor_rewards_status_idx on contributor_rewards (status);
create index if not exists contributor_rewards_wallet_idx on contributor_rewards (wallet);
create index if not exists contributor_rewards_pattern_idx on contributor_rewards (pattern_key);

alter table contributor_rewards enable row level security;
alter table reward_pool enable row level security;
-- RLS on, no policies: anon denied; the server (service role) bypasses.

-- The contributor's optional payout wallet lives on the VTI's JSON `record`
-- (record.rewardWallet), set at ingest — no column change needed.
