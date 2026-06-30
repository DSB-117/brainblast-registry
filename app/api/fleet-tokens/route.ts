import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { isAuthorized } from "../../../lib/auth";
import { generateFleetToken } from "../../../lib/fleetAuth";

// Admin: issue / list / revoke per-operator fleet tokens. Protected by the same
// SYNC_TOKEN/CRON_SECRET as the other admin routes — only the project owner
// onboards or off-boards a fleet operator. The raw token is returned ONCE on
// issue (only its hash is stored); after that it cannot be recovered.
export const dynamic = "force-dynamic";

// POST { label } -> { id, label, token }  (token shown once — give it to the operator)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "malformed JSON" }, { status: 400 });
  }
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });

  const { token, hash } = generateFleetToken();
  const db = supabaseAdmin();
  const { data, error } = await db.from("fleet_tokens").insert({ label, token_hash: hash }).select("id, label").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, label: data.label, token });
}

// GET -> the operators (label + status), never the tokens/hashes.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("fleet_tokens")
    .select("id, label, created_at, revoked_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ operators: data ?? [] });
}

// DELETE ?id=N (or ?label=...) -> revoke. Revoked tokens stop authenticating.
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const label = url.searchParams.get("label");
  if (!id && !label) return NextResponse.json({ error: "id or label required" }, { status: 400 });

  const db = supabaseAdmin();
  const upd = db.from("fleet_tokens").update({ revoked_at: new Date().toISOString() });
  const filtered = id ? upd.eq("id", Number(id)) : upd.eq("label", label as string);
  const { data, error } = await filtered.select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ revoked: data?.length ?? 0 });
}
