import { NextRequest, NextResponse } from "next/server";
import { loadUnprovenQueue } from "../../../../lib/submissions";

// GET /api/vti/queue — the re-proof queue: full findings (fixtures included) that
// still need server-side RED→GREEN. SERVER-SECRET gated (it returns trainable
// fixtures), for the brainblast re-prover only. Auth: Bearer BRAINBLAST_REPROVE_TOKEN.
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const token = process.env.BRAINBLAST_REPROVE_TOKEN;
  if (!token) return false; // fail closed: no token configured → endpoint disabled
  return req.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const items = await loadUnprovenQueue();
    return NextResponse.json({ count: items.length, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "queue error" }, { status: 500 });
  }
}
