import { NextRequest, NextResponse } from "next/server";
import { markProofVerified } from "../../../../lib/submissions";

// POST /api/vti/verify — the re-prover writes back a RED→GREEN verdict.
// Body: { trapId, proofVerified, method }. Same server-secret gate as the queue.
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const token = process.env.BRAINBLAST_REPROVE_TOKEN;
  if (!token) return false;
  return req.headers.get("authorization") === `Bearer ${token}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
