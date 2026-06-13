import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

// POST /api/stakes/:id/reclaim — author requests a refund for a rejected
// stake. Queues a refund_requests row; refunds are processed manually every
// Friday (v0.5.0 launch decision — automate later).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
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
  if (stake.status !== "rejected") {
    return NextResponse.json({ error: `stake status is '${stake.status}', not 'rejected'` }, { status: 409 });
  }

  const { error: insertError } = await db.from("refund_requests").insert({ stake_id: id });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await db
    .from("stake_submissions")
    .update({ status: "refund_requested", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    id,
    status: "refund_requested",
    note: "Refunds are processed manually every Friday.",
  });
}
