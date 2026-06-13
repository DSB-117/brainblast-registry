import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

// GET /api/packs — serves the mirrored pack registry (see pack_registry
// table). The source of truth is the GitHub index at
// PACK_REGISTRY_INDEX_URL (DSB-117/brainblast-pack-registry/packs.json,
// Phase 7); this table is a cache so registry.brainblast.tech doesn't hit
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

interface PackIndexEntry {
  pack_id: string;
  name: string;
  repo_url: string;
  author?: string;
  description?: string;
  latest_version?: string;
}

// POST /api/packs/sync — refreshes the pack_registry table from the
// GitHub-based index. Protected by SYNC_TOKEN (set in Vercel env vars);
// intended to be called from a scheduled job (e.g. Vercel Cron) or
// manually after a new pack is published to the index repo.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.SYNC_TOKEN || token !== process.env.SYNC_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const indexUrl =
    process.env.PACK_REGISTRY_INDEX_URL ??
    "https://raw.githubusercontent.com/DSB-117/brainblast-pack-registry/main/packs.json";

  const res = await fetch(indexUrl, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: `failed to fetch pack index: ${res.status}` }, { status: 502 });
  }

  const entries = (await res.json()) as PackIndexEntry[];
  if (!Array.isArray(entries)) {
    return NextResponse.json({ error: "pack index is not an array" }, { status: 502 });
  }

  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await db.from("pack_registry").upsert(
    entries.map((e) => ({
      pack_id: e.pack_id,
      name: e.name,
      repo_url: e.repo_url,
      author: e.author ?? null,
      description: e.description ?? null,
      latest_version: e.latest_version ?? null,
      synced_at: now,
    })),
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ synced: entries.length });
}
