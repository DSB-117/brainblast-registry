import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "../../../../lib/auth";
import { syncPackRegistry, syncStakes } from "../../../../lib/sync";

// GET /api/cron/sync — scheduled job (Vercel Cron, see vercel.json) that
// keeps pack_registry in sync with the GitHub pack index and flips
// pending_payment stake submissions to 'staked' once their on-chain
// transfer is confirmed. Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` on cron-triggered requests.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [packs, stakes] = await Promise.all([syncPackRegistry(), syncStakes()]);

  return NextResponse.json({ packs, stakes });
}
