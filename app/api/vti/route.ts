import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { ipHash } from "../../../lib/fleetGuard";
import { ingestVtiSubmission, toTeaser } from "../../../lib/vtiIngest";

// POST /api/vti — the git-less on-ramp for Verified Trap Instances (R11).
//
// OPEN + server-validated, like the fleet ledger — no token, no key. The gates
// are the guard, not a password: a submission must pass SHAPE + SECRET-SCAN +
// PROVENANCE (the server fetches the cited commit and confirms the vulnerable
// line is really there) before it lands. The RED→GREEN reproduction proof is
// re-run brainblast-side (where ts-morph lives) and flips `proof_verified`
// before a record reaches a paid tier. Griefing defence: a per-IP hourly cap.
//
//   POST /api/vti  body: { finding, consentScope?, corroborationCount? }
//                  → 201 { accepted:true, trapId, provenanceUrl }   (landed, pending re-proof)
//                  → 200 { accepted:true, duplicate:true, trapId }  (already present)
//                  → 422 { accepted:false, reasons }                (failed a gate)
//                  → 429 { error }                                  (rate limited)
//   GET  /api/vti  → 200 { count, records:[ …sample-tier teasers… ] }
export const dynamic = "force-dynamic";

const HOURLY_SUBMIT_CAP = 60; // provenance-fetches per IP per rolling hour

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("vtis")
    .select("record")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const records = (data ?? []).map((r: any) => toTeaser(r.record ?? {}));
  return NextResponse.json({ count: records.length, records });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ accepted: false, reasons: ["malformed JSON"] }, { status: 400 });
  }

  const db = supabaseAdmin();
  const hash = ipHash(req);

  // Rate limit BEFORE the provenance fetch (the expensive, outbound step).
  const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recent } = await db
    .from("vti_ingest_audit")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("recorded_at", sinceIso);
  if ((recent ?? 0) >= HOURLY_SUBMIT_CAP) {
    return NextResponse.json({ error: "rate limit: too many submissions this hour" }, { status: 429 });
  }

  const finding = body && typeof body === "object" && "finding" in body ? body.finding : body;
  const consentScope = body?.consentScope;
  const corroborationCount = body?.corroborationCount;

  const result = await ingestVtiSubmission(finding, { consentScope, corroborationCount });

  // Log the attempt for rate-limiting (best-effort), regardless of verdict.
  await db.from("vti_ingest_audit").insert({ ip_hash: hash, trap_id: result.trapId ?? null }).then(() => {}, () => {});

  if (!result.accepted) {
    return NextResponse.json({ accepted: false, trapId: result.trapId, reasons: result.reasons }, { status: 422 });
  }

  // Idempotent, non-destructive insert on the trap_id primary key.
  const { error, data } = await db
    .from("vtis")
    .upsert({ trap_id: result.trapId, record: result.record }, { onConflict: "trap_id", ignoreDuplicates: true })
    .select("trap_id");
  if (error) return NextResponse.json({ accepted: false, error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    return NextResponse.json({ accepted: true, duplicate: true, trapId: result.trapId });
  }
  return NextResponse.json({ accepted: true, trapId: result.trapId, provenanceUrl: result.provenanceUrl }, { status: 201 });
}
