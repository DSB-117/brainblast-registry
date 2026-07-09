import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";

// GET /api/cron/prune — scheduled housekeeping (Vercel Cron, see vercel.json).
// The per-IP rate-limit audit tables only ever need a rolling hour of history;
// anything older is dead weight. Prunes rows older than 24h from every audit
// table (salted ip-hashes only — no payloads live here). Deleting is safe and
// idempotent: the tables are counters, not records.
export const dynamic = "force-dynamic";

// table → its timestamp column (older tables used recorded_at).
const AUDIT_TABLES: Record<string, string> = {
  hive_experience_audit: "created_at",
  vti_ingest_audit: "recorded_at",
  fleet_ledger_audit: "recorded_at",
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const pruned: Record<string, number | string> = {};
  for (const [table, tsColumn] of Object.entries(AUDIT_TABLES)) {
    const { count, error } = await db.from(table).delete({ count: "exact" }).lt(tsColumn, cutoff);
    // A missing table (migration not applied everywhere) is reported, never fatal.
    pruned[table] = error ? `skipped: ${error.message}` : count ?? 0;
  }
  return NextResponse.json({ cutoff, pruned });
}
