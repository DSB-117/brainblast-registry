import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { isAuthorized } from "../../../../lib/auth";
import { fetchIncomingTransfers, BOUNTY_POOL_WALLET } from "../../../../lib/solana";

// POST /api/stakes/sync — the stake indexer. Scans recent transactions to
// BOUNTY_POOL_WALLET for memo-tagged transfers and matches them against
// pending_payment stake_submissions by memo_code, flipping matches to
// 'staked'. Protected by SYNC_TOKEN; intended to run on a schedule (e.g.
// Vercel Cron, every few minutes).
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: pending, error } = await db
    .from("stake_submissions")
    .select("id, memo_code")
    .eq("status", "pending_payment");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!pending || pending.length === 0) {
    return NextResponse.json({ matched: 0, checked: 0 });
  }

  const byMemo = new Map(pending.map((p) => [p.memo_code, p.id] as const));

  let transfers;
  try {
    transfers = await fetchIncomingTransfers(BOUNTY_POOL_WALLET);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 502 });
  }

  let matched = 0;
  for (const t of transfers) {
    const stakeId = byMemo.get(t.memo ?? "");
    if (stakeId === undefined) continue;

    const { error: updateError } = await db
      .from("stake_submissions")
      .update({
        status: "staked",
        tx_signature: t.signature,
        token_mint: t.mint,
        token_amount: t.mint ? t.amount : t.amount / 1e9, // lamports -> SOL for native transfers
        updated_at: new Date().toISOString(),
      })
      .eq("id", stakeId)
      .eq("status", "pending_payment");

    if (!updateError) matched++;
  }

  return NextResponse.json({ matched, checked: transfers.length });
}
