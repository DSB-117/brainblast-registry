import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { isAuthorized } from "../../../lib/auth";

// GET /api/refunds — admin view of the weekly refund queue: rejected stakes
// the author has reclaimed but that haven't been refunded yet. Protected by
// SYNC_TOKEN.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("refund_requests")
    .select(
      "id, requested_at, processed_at, refund_tx_signature, stake_submissions(id, author_wallet, stake_usd, token_mint, token_amount, memo_code)",
    )
    .is("processed_at", null)
    .order("requested_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ pending_refunds: data ?? [] });
}

// PATCH /api/refunds — mark a refund as processed.
// body: { refund_request_id, refund_tx_signature }
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { refund_request_id, refund_tx_signature } = body ?? {};
  if (typeof refund_request_id !== "number" || typeof refund_tx_signature !== "string") {
    return NextResponse.json(
      { error: "refund_request_id (number) and refund_tx_signature (string) are required" },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();
  const { data: refund, error: fetchError } = await db
    .from("refund_requests")
    .select("stake_id")
    .eq("id", refund_request_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!refund) {
    return NextResponse.json({ error: "refund request not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { error: updateRefundError } = await db
    .from("refund_requests")
    .update({ processed_at: now, refund_tx_signature })
    .eq("id", refund_request_id);
  if (updateRefundError) {
    return NextResponse.json({ error: updateRefundError.message }, { status: 500 });
  }

  const { error: updateStakeError } = await db
    .from("stake_submissions")
    .update({ status: "refunded", updated_at: now })
    .eq("id", refund.stake_id);
  if (updateStakeError) {
    return NextResponse.json({ error: updateStakeError.message }, { status: 500 });
  }

  return NextResponse.json({ refund_request_id, status: "refunded" });
}
