// Self-serve settlement (R4): quote → on-chain payment → signed grant.
//
// The quote is authoritative and server-computed: the client sends only a lot
// selection, a billing period, and a token; the price comes from the live
// corpus via computePricing/priceSelection, the USD→token conversion from
// GeckoTerminal, and the $BRAIN discount is applied here — never trusted from
// the browser. Verification fetches the payment transaction BY SIGNATURE and
// checks recipient, mint, amount, and memo before minting the grant with the
// same issueGrant the feed already enforces.
//
// Two credentials, deliberately distinct:
//   memo_code    — goes on-chain, PUBLIC (anyone can read it on Solscan).
//   claim_secret — returned once at quote time, stored only as a sha256 hash.
//                  Required to collect/re-download the grant, so a bystander
//                  who saw the memo on-chain can't claim the license.

import { createHash, randomBytes, createPublicKey, verify as cryptoVerify } from "node:crypto";
import { supabaseAdmin } from "./supabase";
import { issueGrant, base58Decode, base58Encode, type Grant, type FeedTier } from "./brainblast";
import { loadLots } from "./vti";
import { computePricing, priceSelection, monthlyOf, LOTS, type LotName } from "./lots";
import { TOKENS, BRAIN_DISCOUNT, type TokenSymbol } from "./tokens";
import { fetchUsdPrices } from "./price";
import { fetchTransferBySignature, fetchIncomingTransfers } from "./solana";

// Where sales settle. Distinct from BOUNTY_POOL_WALLET (stake bonds) — sales
// revenue has its own treasury.
export const SALES_TREASURY = process.env.SALES_TREASURY ?? "Cyk9uU3q8YkV8LPY3qaUiN749qpEvzoTR5iZWqZNcT8S";

const QUOTE_TTL_MS = 45 * 60_000; // a quote locks the token amount for 45 min
const QUOTE_ABANDON_MS = 24 * 3_600_000; // unpaid quotes expire after a day
const AMOUNT_TOLERANCE = 0.99; // accept ≥99% of the quoted amount (dust/rounding)
const GRANT_TTL_DAYS: Record<"mo" | "yr", number> = { mo: 31, yr: 366 };

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface PurchaseRow {
  id: number;
  memo_code: string;
  claim_hash: string;
  buyer_wallet: string;
  lots: LotName[];
  tier: "standard" | "firehose";
  period: "mo" | "yr";
  usd_total: number;
  token_symbol: TokenSymbol;
  token_mint: string | null;
  token_amount_due: number;
  token_usd_price: number;
  pay_to: string;
  status: "pending_payment" | "paid" | "granted" | "expired" | "underpaid";
  quote_expires_at: string;
  tx_signature: string | null;
  token_amount_received: number | null;
  grant_json: Grant | null; // "grant" is reserved SQL — the API still exposes it as `grant`
  grant_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function hashClaim(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function claimMatches(row: Pick<PurchaseRow, "claim_hash">, claimSecret: string): boolean {
  return typeof claimSecret === "string" && claimSecret.length > 0 && hashClaim(claimSecret) === row.claim_hash;
}

// The public shape of a purchase — everything the buyer needs, none of the
// internals (claim hash). The grant is included only once granted.
export function publicPurchase(row: PurchaseRow) {
  return {
    memo_code: row.memo_code,
    buyer_wallet: row.buyer_wallet,
    lots: row.lots,
    tier: row.tier,
    period: row.period,
    usd_total: row.usd_total,
    token: row.token_symbol,
    token_mint: row.token_mint,
    token_amount_due: row.token_amount_due,
    token_usd_price: row.token_usd_price,
    pay_to: row.pay_to,
    status: row.status,
    quote_expires_at: row.quote_expires_at,
    tx_signature: row.tx_signature,
    grant: row.grant_json,
    grant_expires_at: row.grant_expires_at,
    created_at: row.created_at,
  };
}

// ── Quote ────────────────────────────────────────────────────────────────────

export interface CreatePurchaseArgs {
  lots: string[];
  period: "mo" | "yr";
  token: TokenSymbol;
  buyerWallet: string;
}

export type CreatePurchaseResult =
  | { ok: true; purchase: ReturnType<typeof publicPurchase>; claim_secret: string }
  | { ok: false; status: number; error: string };

// Round the owed token amount UP at 6 decimals so "pay exactly the suggested
// amount" always clears the ≥99% check regardless of float representation.
function ceil6(n: number): number {
  return Math.ceil(n * 1e6) / 1e6;
}

export async function createPurchase(args: CreatePurchaseArgs): Promise<CreatePurchaseResult> {
  const { period, token, buyerWallet } = args;
  if (period !== "mo" && period !== "yr") return { ok: false, status: 400, error: "period must be 'mo' or 'yr'" };
  if (!TOKENS[token]) return { ok: false, status: 400, error: "token must be SOL, USDC, or BRAIN" };
  if (typeof buyerWallet !== "string" || !SOLANA_ADDRESS_RE.test(buyerWallet)) {
    return { ok: false, status: 400, error: "buyer_wallet must be a valid Solana address" };
  }
  if (!Array.isArray(args.lots) || args.lots.length === 0) {
    return { ok: false, status: 400, error: "lots must be a non-empty array of lot names" };
  }
  const lots = [...new Set(args.lots)] as LotName[];
  for (const l of lots) {
    if (!LOTS[l] || !LOTS[l].sellable) return { ok: false, status: 400, error: `unknown or unsellable lot: ${l}` };
  }

  // Authoritative price, from the live corpus — the same computation /access
  // displays, recomputed here so a tampered client can't name its own price.
  const serverLots = await loadLots();
  const pricing = computePricing(serverLots.flatMap((l) => l.vtis) as unknown as Array<Record<string, unknown>>);
  const quote = priceSelection(pricing, lots);
  if (quote.total <= 0) return { ok: false, status: 400, error: "selection prices to zero — no sellable lots in it" };
  const usdTotal = period === "mo" ? monthlyOf(quote.total) : quote.total;

  // USD → token at the live price; $BRAIN pays 10% less USD-equivalent.
  let tokenUsdPrice: number;
  try {
    const prices = await fetchUsdPrices([TOKENS[token].priceMint]);
    tokenUsdPrice = prices[TOKENS[token].priceMint] ?? 0;
  } catch {
    tokenUsdPrice = 0;
  }
  if (!tokenUsdPrice || tokenUsdPrice <= 0) {
    return { ok: false, status: 502, error: `live ${token} price unavailable — try again shortly` };
  }
  const usdOwed = token === "BRAIN" ? usdTotal * (1 - BRAIN_DISCOUNT) : usdTotal;
  const tokenAmountDue = ceil6(usdOwed / tokenUsdPrice);

  const memoCode = `BBP-${randomBytes(4).toString("hex")}`;
  const claimSecret = base58Encode(randomBytes(24)); // ~192 bits, unguessable
  const now = Date.now();

  const row = {
    memo_code: memoCode,
    claim_hash: hashClaim(claimSecret),
    buyer_wallet: buyerWallet,
    lots,
    tier: quote.isScale ? "firehose" : "standard",
    period,
    usd_total: usdTotal,
    token_symbol: token,
    token_mint: TOKENS[token].mint,
    token_amount_due: tokenAmountDue,
    token_usd_price: tokenUsdPrice,
    pay_to: SALES_TREASURY,
    status: "pending_payment",
    quote_expires_at: new Date(now + QUOTE_TTL_MS).toISOString(),
  };

  const db = supabaseAdmin();
  const { data, error } = await db.from("purchases").insert(row).select().single();
  if (error) return { ok: false, status: 500, error: error.message };

  return { ok: true, purchase: publicPurchase(data as PurchaseRow), claim_secret: claimSecret };
}

// ── Settlement ───────────────────────────────────────────────────────────────

function grantForPurchase(row: Pick<PurchaseRow, "tier" | "lots" | "period" | "buyer_wallet">): Grant {
  const secretKey = process.env.BRAINBLAST_MARKET_KEY;
  if (!secretKey) throw new Error("BRAINBLAST_MARKET_KEY is not set — cannot issue grants");
  return issueGrant({
    buyer: row.buyer_wallet,
    tier: row.tier as FeedTier,
    // firehose (Scale) grants carry no lot scope — the server serves ALL lots,
    // including "other" and every lot added later. standard grants are scoped.
    lots: row.tier === "firehose" ? [] : row.lots,
    signer: { alg: "ed25519", secretKey },
    ttlDays: GRANT_TTL_DAYS[row.period],
  });
}

export type SettleResult =
  | { settled: true; purchase: ReturnType<typeof publicPurchase> }
  | { settled: false; status: number; error: string; shortfall?: number };

// Marks the purchase paid + granted given a verified on-chain transfer. The
// tx_signature unique constraint makes one transaction settle at most one
// purchase, and the .eq("status", ...) guard makes concurrent verifies safe.
async function settle(
  row: PurchaseRow,
  transfer: { signature: string; mint: string | null; amount: number },
): Promise<SettleResult> {
  const thisTx = transfer.mint ? transfer.amount : transfer.amount / 1e9; // lamports → SOL
  if (transfer.mint !== row.token_mint) {
    return {
      settled: false,
      status: 402,
      error: `paid with the wrong token — quote is for ${row.token_symbol}; re-quote in the token you want to pay with`,
    };
  }
  // Top-ups accumulate: an underpaid purchase keeps its received total, and a
  // NEW transaction (different signature) adds to it. The same signature never
  // counts twice.
  const prior = row.status === "underpaid" && row.tx_signature !== transfer.signature ? (row.token_amount_received ?? 0) : 0;
  const received = prior + thisTx;
  if (received < row.token_amount_due * AMOUNT_TOLERANCE) {
    const shortfall = ceil6(row.token_amount_due - received);
    const db = supabaseAdmin();
    await db
      .from("purchases")
      .update({ status: "underpaid", token_amount_received: received, tx_signature: transfer.signature, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .in("status", ["pending_payment", "underpaid"]);
    return {
      settled: false,
      status: 402,
      error: `payment received but ${shortfall} ${row.token_symbol} short — send the difference with the same memo and verify again`,
      shortfall,
    };
  }

  const grant = grantForPurchase(row);
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("purchases")
    .update({
      status: "granted",
      token_amount_received: received,
      tx_signature: transfer.signature,
      grant_json: grant,
      grant_expires_at: grant.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .in("status", ["pending_payment", "underpaid"])
    .eq("id", row.id)
    .select()
    .single();
  if (error || !data) {
    // Unique-violation on tx_signature ⇒ this tx already settled another row.
    return { settled: false, status: 409, error: error?.message ?? "purchase already settled" };
  }
  return { settled: true, purchase: publicPurchase(data as PurchaseRow) };
}

export type VerifyResult = SettleResult;

// The checkout path: the buyer's wallet returned `signature`; fetch that exact
// tx and settle against it. Idempotent — a granted purchase returns its grant.
export async function verifyPurchase(memoCode: string, claimSecret: string, signature: string): Promise<VerifyResult> {
  const db = supabaseAdmin();
  const { data: row, error } = await db.from("purchases").select().eq("memo_code", memoCode).single();
  if (error || !row) return { settled: false, status: 404, error: "unknown memo code" };
  const purchase = row as PurchaseRow;

  if (!claimMatches(purchase, claimSecret)) {
    return { settled: false, status: 403, error: "claim secret does not match this purchase" };
  }
  if (purchase.status === "granted") {
    return { settled: true, purchase: publicPurchase(purchase) }; // idempotent re-collect
  }
  if (purchase.status === "expired") {
    return { settled: false, status: 410, error: "quote expired unpaid — create a new one" };
  }
  if (typeof signature !== "string" || signature.length < 32) {
    return { settled: false, status: 400, error: "tx_signature required" };
  }

  let transfer;
  try {
    transfer = await fetchTransferBySignature(signature, purchase.pay_to);
  } catch (e: any) {
    return { settled: false, status: 502, error: `RPC error: ${e?.message ?? String(e)}` };
  }
  if (!transfer) {
    return { settled: false, status: 402, error: "transaction not found or not yet confirmed — wait a moment and retry" };
  }
  if (transfer.memo !== purchase.memo_code) {
    return { settled: false, status: 402, error: "transaction memo does not match this purchase" };
  }
  return settle(purchase, transfer);
}

// Cron backstop: settle pending purchases whose buyer paid but never called
// verify (closed the tab), and expire quotes abandoned past the window. Scans
// the sales treasury the same way the stake indexer scans the bounty pool.
export async function syncPurchases(): Promise<
  { granted: number; expired: number; checked: number } | { error: string }
> {
  const db = supabaseAdmin();
  const { data: pending, error } = await db
    .from("purchases")
    .select()
    .in("status", ["pending_payment", "underpaid"]);
  if (error) return { error: error.message };

  let granted = 0;
  let checked = 0;
  if (pending && pending.length > 0) {
    let transfers;
    try {
      transfers = await fetchIncomingTransfers(SALES_TREASURY);
    } catch (e: any) {
      return { error: e?.message ?? String(e) };
    }
    checked = transfers.length;
    const byMemo = new Map(pending.map((p) => [p.memo_code, p as PurchaseRow]));
    for (const t of transfers) {
      const row = t.memo ? byMemo.get(t.memo) : undefined;
      if (!row) continue;
      const result = await settle(row, t);
      if (result.settled) granted++;
    }
  }

  // Expire unpaid quotes older than the abandon window (never rows with a
  // recorded payment attempt — underpaid buyers can still top up).
  const cutoff = new Date(Date.now() - QUOTE_ABANDON_MS).toISOString();
  const { data: expiredRows } = await db
    .from("purchases")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .select("id");

  return { granted, expired: expiredRows?.length ?? 0, checked };
}

// ── "Your licenses" — wallet-signature listing ───────────────────────────────
// The buyer proves control of the wallet by signing a short, timestamped
// message with their wallet's ed25519 key (Phantom signMessage). No account,
// no session — the signature IS the login. ±10 min window against replay.

const LIST_MESSAGE_WINDOW_MS = 10 * 60_000;
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function licensesMessage(wallet: string, ts: number): string {
  return `brainblast:licenses:${wallet}:${ts}`;
}

export function verifyWalletSignature(wallet: string, ts: number, sigB58: string): boolean {
  if (!SOLANA_ADDRESS_RE.test(wallet)) return false;
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > LIST_MESSAGE_WINDOW_MS) return false;
  try {
    const pub = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, base58Decode(wallet)]),
      format: "der",
      type: "spki",
    });
    return cryptoVerify(null, Buffer.from(licensesMessage(wallet, ts), "utf8"), pub, base58Decode(sigB58));
  } catch {
    return false;
  }
}

export async function listPurchases(wallet: string): Promise<ReturnType<typeof publicPurchase>[] | { error: string }> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("purchases")
    .select()
    .eq("buyer_wallet", wallet)
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return (data as PurchaseRow[]).map(publicPurchase);
}
