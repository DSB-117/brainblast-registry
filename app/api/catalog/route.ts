import { NextRequest } from "next/server";
import { serve } from "../../../lib/distribution";

// GET /api/catalog — the storefront. PUBLIC + anonymous (no grant): coverage,
// freshness, the tier/price ladder, and receipt-only teasers. North Star #1.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return serve(req, "/catalog");
}
