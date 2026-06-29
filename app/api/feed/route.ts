import { NextRequest } from "next/server";
import { serve } from "../../../lib/distribution";

// GET /api/feed — anonymous → the open sample tier (receipt-only); with an
// `x-brainblast-grant: <base64 grant JSON>` header → the entitled tier, verified
// against BRAINBLAST_MARKET_PUBKEY (ed25519, no secret). Filterable by
// ?sdk=&class=&severity=&min_corroboration=&since=&limit=. Gated pulls are
// metered to the usage_ledger.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return serve(req, "/feed");
}
