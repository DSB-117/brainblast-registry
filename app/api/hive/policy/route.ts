import { NextRequest, NextResponse } from "next/server";
import { handleRequest, SupabaseHiveStore } from "../../../../lib/brainblast";

// /api/hive/policy — per-space access policy (ACL) for HiveMind federation
// (brainblast v0.13.0). A space id (hs_…) is a capability; a POLICY layers
// governance on top WITHOUT accounts: it's an ed25519-signed document, and the
// signature is the authority.
//
//   GET   → { policy | null }
//   POST  (signed SpacePolicy)  → { ok, version }   (403 on bad-sig / not-admin /
//                                  stale-version / self-not-admin / space-mismatch)
//
// The verification (TOFU first, then admin-signed monotonic updates) runs inside
// the vendored handler; this route only maps NextRequest → ServerRequest and
// injects the Supabase-backed store. All the trust logic is shared with the CLI
// and `brainblast serve` — one implementation.
export const dynamic = "force-dynamic";

async function respond(req: NextRequest): Promise<NextResponse> {
  const store = new SupabaseHiveStore(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  const resp = await handleRequest(
    {
      method: req.method ?? "GET",
      path: "/hive/policy",
      query: {},
      space: req.headers.get("x-brainblast-space") ?? undefined,
      body: req.method === "POST" ? await req.text() : undefined,
    },
    { lots: [], hiveStore: store },
  );
  return new NextResponse(resp.body, { status: resp.status, headers: { "content-type": resp.contentType } });
}

export async function GET(req: NextRequest) {
  return respond(req);
}
export async function POST(req: NextRequest) {
  return respond(req);
}
