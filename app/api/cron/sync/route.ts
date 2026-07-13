import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "../../../../lib/auth";
import { syncPackRegistry, syncStakes } from "../../../../lib/sync";
import { syncPurchases } from "../../../../lib/purchases";

// GET /api/cron/sync — scheduled job (Vercel Cron, see vercel.json) that
// keeps pack_registry in sync with the GitHub pack index, flips
// pending_payment stake submissions to 'staked' once their on-chain
// transfer is confirmed, and settles self-serve purchases whose buyer paid
// but never called /api/purchases/verify (plus expires abandoned quotes).
// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered requests.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [packs, stakes, purchases] = await Promise.all([syncPackRegistry(), syncStakes(), syncPurchases()]);

  return NextResponse.json({ packs, stakes, purchases });
}
