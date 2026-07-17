import { NextRequest, NextResponse } from "next/server";
import { markProofVerified, checkReproveAuth } from "../../../../lib/submissions";

// POST /api/vti/verify — the re-prover writes back a RED→GREEN verdict.
// Body: { trapId, proofVerified, method }. Bearer BRAINBLAST_REPROVE_TOKEN.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = checkReproveAuth(req.headers.get("authorization"));
  if (auth === "unconfigured") {
    return NextResponse.json({ error: "reprove endpoint not configured (BRAINBLAST_INGEST_TOKEN unset on this deployment)" }, { status: 503 });
  }
  if (auth !== "ok") return NextResponse.json({ error: "unauthorized (token mismatch)" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "malformed JSON" }, { status: 400 });
  }
  const { trapId, proofVerified, method } = body ?? {};
  if (typeof trapId !== "string" || typeof proofVerified !== "boolean") {
    return NextResponse.json({ error: "trapId (string) and proofVerified (boolean) are required" }, { status: 400 });
  }
  const res = await markProofVerified(trapId, proofVerified, typeof method === "string" ? method : "static-checker", new Date().toISOString());
  if (!res.updated) return NextResponse.json({ updated: false, error: res.reason }, { status: 404 });
  return NextResponse.json({ updated: true, trapId, proofVerified });
}
