import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { isAuthorized } from "../../../lib/auth";
import { syncPackRegistry } from "../../../lib/sync";

// GET /api/packs — serves the mirrored pack registry (see pack_registry
// table). The source of truth is the GitHub index at
// PACK_REGISTRY_INDEX_URL (DSB-117/brainblast-pack-registry/packs.json,
// Phase 7); this table is a cache so app.brainblast.tech doesn't hit
// GitHub on every request.
export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("pack_registry")
    .select("pack_id, name, repo_url, author, description, latest_version, synced_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ packs: data ?? [] });
}

// POST /api/packs — refreshes the pack_registry table from the GitHub-based
// index. Protected by SYNC_TOKEN/CRON_SECRET (set in Vercel env vars);
// intended to be called from a scheduled job (see app/api/cron/sync) or
// manually after a new pack is published to the index repo.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await syncPackRegistry();
  if ("error" in result) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
