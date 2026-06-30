import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { validateFleetToken } from "../../../lib/fleetAuth";

// The shared scout-fleet ledger (R7). Outside operators read/write it with a
// per-fleet Bearer token (see /api/fleet-tokens) — they NEVER hold the Supabase
// service-role key; only this server does.
export const dynamic = "force-dynamic";

// GET — the investigated-repo set, so a fleet's discovery skips what's done.
export async function GET(req: NextRequest) {
  const op = await validateFleetToken(req);
  if (!op) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("fleet_ledger")
    .select("repo, sdk, traps, investigated_at")
    .order("investigated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ repos: data ?? [] });
}

// POST — record investigated repos. Body: { rows: [{ repo, sdk?, traps? }] }.
// Upsert on repo; stamps the operator label for an audit trail.
export async function POST(req: NextRequest) {
  const op = await validateFleetToken(req);
  if (!op) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "malformed JSON" }, { status: 400 });
  }
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  if (rows.length === 0) return NextResponse.json({ error: "no rows" }, { status: 400 });

  const now = new Date().toISOString();
  const records = rows
    .filter((r: any) => typeof r?.repo === "string" && r.repo)
    .map((r: any) => ({
      repo: r.repo,
      sdk: typeof r.sdk === "string" ? r.sdk : null,
      traps: Array.isArray(r.traps) ? r.traps : [],
      investigated_at: now,
      investigated_by: op.label,
    }));

  const db = supabaseAdmin();
  const { error } = await db.from("fleet_ledger").upsert(records, { onConflict: "repo" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recorded: records.length });
}
