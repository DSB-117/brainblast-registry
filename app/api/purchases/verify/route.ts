import { NextRequest, NextResponse } from "next/server";
import { verifyPurchase } from "../../../../lib/purchases";

export const dynamic = "force-dynamic";

// POST /api/purchases/verify — settle a checkout instantly.
// body: { memo_code, claim_secret, tx_signature }
//
// Fetches the transaction BY SIGNATURE and verifies, on-chain: it confirmed
// without error, it moved funds to the sales treasury, the mint matches the
// quote's token, the amount covers the quote (≥99%, so wallet rounding never
// strands a real payment), and the SPL memo is this purchase's memo_code. On
// success the ed25519 grant is issued inline and returned — the same grant
// format /api/feed already enforces. Idempotent: re-verifying a granted
// purchase returns the stored grant (with the claim secret as the credential).
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const memo = body?.memo_code;
  const claim = body?.claim_secret;
  if (typeof memo !== "string" || typeof claim !== "string") {
    return NextResponse.json({ error: "memo_code and claim_secret are required" }, { status: 400 });
  }

  const result = await verifyPurchase(memo, claim, body?.tx_signature);
  if (!result.settled) {
    return NextResponse.json(
      { error: result.error, ...(result.shortfall !== undefined ? { shortfall: result.shortfall } : {}) },
      { status: result.status },
    );
  }
  return NextResponse.json({ purchase: result.purchase });
}
