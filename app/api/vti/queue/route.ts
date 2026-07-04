import { NextRequest, NextResponse } from "next/server";
import { loadUnprovenQueue, checkReproveAuth } from "../../../../lib/submissions";

// GET /api/vti/queue — the re-proof queue (full findings, fixtures included) for
// the brainblast re-prover. Bearer BRAINBLAST_REPROVE_TOKEN. 503 = the token is
// unset on this deployment; 401 = wrong token.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = checkReproveAuth(req.headers.get("authorization"));
  if (auth === "unconfigured") {
    return NextResponse.json({ error: "reprove endpoint not configured (BRAINBLAST_REPROVE_TOKEN unset)" }, { status: 503 });
  }
  if (auth !== "ok") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const items = await loadUnprovenQueue();
    return NextResponse.json({ count: items.length, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "queue error" }, { status: 500 });
  }
}
