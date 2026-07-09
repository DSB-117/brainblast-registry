import { NextRequest, NextResponse } from "next/server";
import { handleRequest, SupabaseHiveStore } from "../../../../lib/brainblast";
import { supabaseAdmin } from "../../../../lib/supabase";
import { ipHash } from "../../../../lib/fleetGuard";

// /api/hive/experience — HiveMind federation (brainblast v0.11.0).
//
// The sync surface for cross-machine and team hives: a machine pushes its
// ed25519-SIGNED fix-event batches and pulls everyone else's, keyed by a
// **space** — an unguessable capability id (hs_…, 192-bit entropy) that
// travels in the `x-brainblast-space` header so it stays out of URL logs.
// OPEN + server-validated, like the fleet ledger and /api/vti: no accounts,
// no tokens — the space id is the membership check, the signature is the
// attribution check (verified by the vendored `verifyBatch` inside
// `handleRequest`; the transport space and the signed space must agree, so a
// batch can't be replayed into another space).
//
//   POST  body: signed ExperienceBatch      → 200 {accepted, duplicates, total}
//                                            → 403 {reason} on any signature/shape failure
//   GET   ?since=<seq>                       → 200 {events, cursor}
//
// Experience is advisory agent context — it NEVER enters the RED→GREEN-gated
// corpus, the feed, or the enforcement rule set. Griefing defence: per-IP
// hourly cap on POST (audit table keyed by salted IP hash, never a raw IP).
export const dynamic = "force-dynamic";

const HOURLY_PUSH_CAP = 120; // signed batches per IP per rolling hour

async function respond(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  for (const [k, v] of url.searchParams) query[k] = v;

  const store = new SupabaseHiveStore(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  const resp = await handleRequest(
    {
      method: req.method ?? "GET",
      path: "/hive/experience",
      query,
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
  // Rate limit BEFORE any body parsing or crypto.
  const db = supabaseAdmin();
  const hash = ipHash(req);
  const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recent } = await db
    .from("hive_experience_audit")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", sinceIso);
  if ((recent ?? 0) >= HOURLY_PUSH_CAP) {
    return NextResponse.json({ error: "rate limited — try again later" }, { status: 429 });
  }
  await db.from("hive_experience_audit").insert({ ip_hash: hash });

  return respond(req);
}
