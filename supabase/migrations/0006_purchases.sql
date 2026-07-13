-- Self-serve sales (R4 settlement). One row per checkout: the server-computed
-- quote, the on-chain payment that settled it, and the signed grant it minted.
--
-- Flow: POST /api/purchases computes the price from the live corpus, fixes a
-- token amount, and returns a memo_code (goes on-chain, public) plus a
-- claim_secret (returned ONCE, stored only as a sha256 hash — the private
-- credential that lets the payer collect the grant; the memo alone can't,
-- because anyone can read it on Solscan). POST /api/purchases/verify checks
-- the tx by signature against the sales treasury and, on success, issues the
-- ed25519 grant inline and stores it here for re-download.
create table if not exists purchases (
  id bigint generated always as identity primary key,
  memo_code text not null unique,
  claim_hash text not null,            -- sha256(claim_secret), never the secret
  buyer_wallet text not null,          -- payer pubkey (from the connected wallet)
  lots jsonb not null,                 -- LotName[] the license covers
  tier text not null check (tier in ('standard', 'firehose')),
  period text not null check (period in ('mo', 'yr')),
  usd_total numeric not null,          -- server-computed, after bundle discounts
  token_symbol text not null check (token_symbol in ('SOL', 'USDC', 'BRAIN')),
  token_mint text,                     -- null => native SOL
  token_amount_due numeric not null,   -- human units, BRAIN discount applied
  token_usd_price numeric not null,    -- price used for the conversion (audit)
  pay_to text not null,                -- sales treasury the quote points at
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'granted', 'expired', 'underpaid')),
  quote_expires_at timestamptz not null,
  tx_signature text unique,            -- unique: one tx settles at most one purchase
  token_amount_received numeric,
  grant jsonb,                         -- the issued grant (bearer credential)
  grant_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_status_idx on purchases (status);
create index if not exists purchases_buyer_idx on purchases (buyer_wallet);

alter table purchases enable row level security;
-- RLS on with no policies: anon key denied; the server (service role) bypasses.
