import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { BOUNTY_POOL_WALLET } from "../../../lib/solana";
import { loadBondableVtis } from "../../../lib/corpusIndex";

function generateMemoCode(): string {
  return `BB-${randomBytes(4).toString("hex")}`;
}

// Base58, 32-44 chars covers all valid Solana pubkey encodings.
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// POST /api/stakes — register a confidence bond behind a VTI and get a memo code.
// body: { trap_id, bonder_wallet, amount_usd }
//
// The bonder then transfers `amount_usd` worth of $BRAIN, SOL, or USDC to
// BOUNTY_POOL_WALLET with the returned memo_code attached. POST /api/stakes/sync
// (the indexer) matches the memo and flips the bond to 'staked' (active). A bond
// is optional and never required to contribute — it signals confidence and
// amplifies the contributor's dividend share, and is slashed if the VTI stops
// reproducing.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  // Accept the new bond fields; fall back to the legacy names so an older client
  // still resolves (author_wallet → bonder_wallet, stake_usd → amount_usd).
  const trap_id = body?.trap_id;
  const bonder_wallet = body?.bonder_wallet ?? body?.author_wallet;
  const amount_usd = body?.amount_usd ?? body?.stake_usd;

  if (typeof trap_id !== "string" || !trap_id.trim()) {
    return NextResponse.json({ error: "trap_id (the VTI to bond behind) is required" }, { status: 400 });
  }
  if (typeof bonder_wallet !== "string" || !SOLANA_ADDRESS_RE.test(bonder_wallet)) {
    return NextResponse.json({ error: "bonder_wallet must be a valid Solana address" }, { status: 400 });
  }
  if (typeof amount_usd !== "number" || amount_usd <= 0) {
    return NextResponse.json({ error: "amount_usd must be a positive number" }, { status: 400 });
  }

  // The bond must target a real, PROVEN VTI in the live corpus — you can't bond
  // behind a trap that doesn't exist or doesn't reproduce.
  let vti;
  try {
    const bondable = await loadBondableVtis();
    vti = bondable.find((v) => v.trapId === trap_id);
  } catch {
    return NextResponse.json({ error: "corpus temporarily unavailable — try again" }, { status: 503 });
  }
  if (!vti) {
    return NextResponse.json({ error: `no proven VTI with trap_id "${trap_id}" in the corpus` }, { status: 404 });
  }

  const db = supabaseAdmin();
  const memo_code = generateMemoCode();

  const { data, error } = await db
    .from("stake_submissions")
    .insert({ memo_code, trap_id, author_wallet: bonder_wallet, stake_usd: amount_usd, status: "pending_payment" })
    .select("id, memo_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    memo_code: data.memo_code,
    trap_id,
    dividendWeight: vti.score,
    pay_to: BOUNTY_POOL_WALLET,
    amount_usd,
    instructions: `Transfer ${amount_usd} USD worth of $BRAIN, SOL, or USDC to ${BOUNTY_POOL_WALLET} with memo "${data.memo_code}" to bond behind ${trap_id}. $BRAIN pays 10% less. The bond is slashed if this VTI ever stops reproducing.`,
  });
}

// GET /api/stakes?status=&memo_code=&bonder_wallet= — list bonds, optionally
// filtered. Accepts the legacy `author_wallet` param name too.
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const memoCode = req.nextUrl.searchParams.get("memo_code");
  const bonderWallet =
    req.nextUrl.searchParams.get("bonder_wallet") ?? req.nextUrl.searchParams.get("author_wallet");
  const db = supabaseAdmin();

  let query = db
    .from("stake_submissions")
    .select("id, memo_code, trap_id, pack_id, rule_id, author_wallet, stake_usd, status, tx_signature, token_mint, token_amount, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (memoCode) query = query.eq("memo_code", memoCode);
  if (bonderWallet) query = query.eq("author_wallet", bonderWallet);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ stakes: data ?? [] });
}
