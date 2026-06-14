import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "../../../../lib/auth";
import { syncStakes } from "../../../../lib/sync";

// POST /api/stakes/sync — the stake indexer. Scans recent transactions to
// BOUNTY_POOL_WALLET for memo-tagged transfers and matches them against
// pending_payment stake_submissions by memo_code, flipping matches to
// 'staked'. Protected by SYNC_TOKEN/CRON_SECRET; runs on a schedule (see
// app/api/cron/sync) in addition to manual calls.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncStakes();
  if ("error" in result) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
