import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { ipHash, recentCount, verifyRepo, mergeTraps, HOURLY_REPO_CAP } from "../../../lib/fleetGuard";

// The shared scout-fleet ledger (R7). OPEN + server-validated: any fleet can read
// the investigated-repo set and record what it scouted — no token, no key. The
// Supabase service-role key never leaves this server. Griefing defenses
// (per-IP rate limit, GitHub repo verification, non-destructive trap merge,
// plus the consumer-side freshness TTL) keep the open list honest.
export const dynamic = "force-dynamic";

const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/; // owner/repo
const ID_RE = /^[a-z0-9][a-z0-9-]*$/; // trap/rule ids
const MAX_ROWS = 100;

// GET — the investigated set, so a fleet's discovery skips what's done.
export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("fleet_ledger")
    .select("repo, sdk, traps, investigated_at")
    .order("investigated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ repos: data ?? [] });
}

// POST { rows: [{ repo, sdk?, traps? }] } — record scouted repos. Server-side
// validation is the only gate: well-formed `owner/repo`, sane field types/sizes,
// capped row count. Upsert on repo (idempotent; re-recording is harmless).
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "malformed JSON" }, { status: 400 });
  }
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  if (rows.length === 0) return NextResponse.json({ error: "no rows" }, { status: 400 });
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `too many rows (max ${MAX_ROWS})` }, { status: 400 });

  // Shape validation (cheapest gate, before any DB/network work).
  const clean: { repo: string; sdk: string | null; traps: string[] }[] = [];
  for (const r of rows) {
    if (typeof r?.repo !== "string" || !REPO_RE.test(r.repo)) {
      return NextResponse.json({ error: `invalid repo: ${JSON.stringify(r?.repo)} (expect owner/repo)` }, { status: 400 });
    }
    const traps = Array.isArray(r.traps) ? r.traps : [];
    if (!traps.every((t: any) => typeof t === "string" && ID_RE.test(t))) {
      return NextResponse.json({ error: `invalid trap id in ${r.repo}` }, { status: 400 });
    }
    clean.push({
      repo: r.repo,
      sdk: typeof r.sdk === "string" && r.sdk.length <= 100 ? r.sdk : null,
      traps: traps.slice(0, 50),
    });
  }

  const db = supabaseAdmin();

  // 1. Rate limit per IP (windowed). Caps how much one actor can pollute.
  const hash = ipHash(req);
  const recent = await recentCount(db, hash);
  if (recent + clean.length > HOURLY_REPO_CAP) {
    return NextResponse.json({ error: "rate limit: too many repos recorded this hour" }, { status: 429 });
  }

  // 2. Non-destructive merge: a submission can never ERASE traps another fleet
  //    found. Read existing rows; known repos union their traps (skip GitHub
  //    re-verification), new repos must pass verification.
  const repos = clean.map((c) => c.repo);
  const { data: existing } = await db.from("fleet_ledger").select("repo, traps").in("repo", repos);
  const known = new Map<string, string[]>((existing ?? []).map((e: any) => [e.repo, e.traps ?? []]));

  const now = new Date().toISOString();
  const records: { repo: string; sdk: string | null; traps: string[]; investigated_at: string }[] = [];
  const rejected: { repo: string; reason: string }[] = [];
  for (const c of clean) {
    if (known.has(c.repo)) {
      records.push({ repo: c.repo, sdk: c.sdk, traps: mergeTraps(known.get(c.repo)!, c.traps), investigated_at: now });
      continue;
    }
    // 3. New repo → verify it exists + clears the popularity bar on GitHub.
    const v = await verifyRepo(c.repo);
    if (!v.ok) {
      rejected.push({ repo: c.repo, reason: v.reason ?? "rejected" });
      continue;
    }
    records.push({ repo: c.repo, sdk: c.sdk, traps: c.traps, investigated_at: now });
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "no valid repos", rejected }, { status: 400 });
  }

  const { error } = await db.from("fleet_ledger").upsert(records, { onConflict: "repo" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Record the abuse-log rows for the rate limiter (best-effort).
  await db.from("fleet_ledger_audit").insert(records.map((r) => ({ ip_hash: hash, repo: r.repo })));

  return NextResponse.json({ recorded: records.length, rejected });
}
