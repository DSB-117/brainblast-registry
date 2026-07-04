import { NextRequest, NextResponse } from "next/server";
import { loadUnprovenQueue, checkReproveAuth } from "../../../../lib/submissions";

// GET /api/vti/queue — the re-proof queue (full findings) for the brainblast
// re-prover. Bearer BRAINBLAST_REPROVE_TOKEN.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = checkReproveAuth(req.headers.get("authorization"));
  if (auth === "unconfigured") {
    // Safe presence diagnostic (booleans only — never values): confirms whether
    // env injection works at all on this deployment vs this one var being missing.
    return NextResponse.json(
      {
        error: "reprove endpoint not configured (BRAINBLAST_REPROVE_TOKEN unset on this deployment)",
        envSeen: {
          BRAINBLAST_REPROVE_TOKEN: !!process.env.BRAINBLAST_REPROVE_TOKEN,
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY),
        },
      },
      { status: 503 },
    );
  }
  if (auth !== "ok") return NextResponse.json({ error: "unauthorized (token mismatch)" }, { status: 401 });
  try {
    const items = await loadUnprovenQueue();
    return NextResponse.json({ count: items.length, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "queue error" }, { status: 500 });
  }
}
