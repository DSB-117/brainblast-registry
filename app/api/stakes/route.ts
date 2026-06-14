import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { BOUNTY_POOL_WALLET } from "../../../lib/solana";

function generateMemoCode(): string {
  return `BB-${randomBytes(4).toString("hex")}`;
}

// Base58, 32-44 chars covers all valid Solana pubkey encodings.
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// POST /api/stakes — register a pack submission and get a memo code.
// body: { pack_id, rule_id, author_wallet, stake_usd }
//
// The author then transfers `stake_usd` worth of $BRAIN, SOL, or USDC to
// BOUNTY_POOL_WALLET with the returned memo_code attached. POST
// /api/stakes/sync (the indexer) matches the memo and flips status to
// 'staked'.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { pack_id, rule_id, author_wallet, stake_usd } = body ?? {};
  if (
    typeof pack_id !== "string" ||
    typeof rule_id !== "string" ||
    typeof author_wallet !== "string" ||
    typeof stake_usd !== "number" ||
    stake_usd <= 0
  ) {
    return NextResponse.json(
      { error: "pack_id, rule_id, author_wallet (string) and stake_usd (positive number) are required" },
      { status: 400 },
    );
  }
  if (!SOLANA_ADDRESS_RE.test(author_wallet)) {
    return NextResponse.json({ error: "author_wallet must be a valid Solana address" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const memo_code = generateMemoCode();

  const { data, error } = await db
    .from("stake_submissions")
    .insert({ memo_code, pack_id, rule_id, author_wallet, stake_usd, status: "pending_payment" })
    .select("id, memo_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    memo_code: data.memo_code,
    pay_to: BOUNTY_POOL_WALLET,
    stake_usd,
    instructions: `Transfer ${stake_usd} USD worth of $BRAIN, SOL, or USDC to ${BOUNTY_POOL_WALLET} with memo "${data.memo_code}". $BRAIN payments get a 10% discount on the equivalent USD stake.`,
  });
}

// GET /api/stakes?status=pending_payment&memo_code=BB-xxxxxxxx — list stake
// submissions, optionally filtered by status and/or memo_code.
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const memoCode = req.nextUrl.searchParams.get("memo_code");
  const db = supabaseAdmin();

  let query = db
    .from("stake_submissions")
    .select("id, memo_code, pack_id, rule_id, author_wallet, stake_usd, status, tx_signature, token_mint, token_amount, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (memoCode) query = query.eq("memo_code", memoCode);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ stakes: data ?? [] });
}
