import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { isAuthorized } from "../../../../lib/auth";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  staked: ["rejected", "graduated"],
};

// PATCH /api/stakes/:id — admin-only transition of a staked submission to
// 'rejected' or 'graduated'. Protected by SYNC_TOKEN (same shared secret as
// the pack registry sync endpoint).
// body: { status: "rejected" | "graduated" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const nextStatus = body?.status;
  if (nextStatus !== "rejected" && nextStatus !== "graduated") {
    return NextResponse.json({ error: "status must be 'rejected' or 'graduated'" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: stake, error: fetchError } = await db
    .from("stake_submissions")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!stake) {
    return NextResponse.json({ error: "stake not found" }, { status: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[stake.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `cannot transition from '${stake.status}' to '${nextStatus}'` },
      { status: 409 },
    );
  }

  const { error: updateError } = await db
    .from("stake_submissions")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ id, status: nextStatus });
}
