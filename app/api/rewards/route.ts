import { NextRequest, NextResponse } from "next/server";
import { checkReproveAuth } from "../../../lib/submissions";
import { listAccruedRewards, markRewardPaid } from "../../../lib/rewards";

// Operator-only reward administration (BRAIN-UTILITY.md #3). Rewards accrue
// automatically when a VTI first proves; PAYOUT is operator-run (a $BRAIN
// transfer from the reward treasury, weekly batch like refunds).
//
//   GET  /api/rewards                  → { count, totalBrain, rows[] }   (accrued, awaiting payout)
//   POST /api/rewards  { id, txSignature } → mark one reward paid
//
// Both require the operator token (same auth as the re-prover). This route never
// moves funds — it only records that an out-of-band transfer happened.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (checkReproveAuth(req.headers.get("authorization")) !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await listAccruedRewards();
  if ("error" in result) return NextResponse.json(result, { status: 500 });
  return NextResponse.json({ count: result.rows.length, totalBrain: result.totalBrain, rows: result.rows });
}

export async function POST(req: NextRequest) {
  if (checkReproveAuth(req.headers.get("authorization")) !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const id = Number(body?.id);
  const txSignature = body?.txSignature;
  if (!Number.isFinite(id) || typeof txSignature !== "string" || txSignature.length < 32) {
    return NextResponse.json({ error: "id (number) and txSignature (string) are required" }, { status: 400 });
  }
  const result = await markRewardPaid(id, txSignature);
  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json({ ok: true });
}
