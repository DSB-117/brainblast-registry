import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

// Per-operator fleet tokens. Outside fleets call /api/fleet-ledger with a Bearer
// token; we store only its SHA-256 hash, so the DB never holds a usable secret.
// The token itself is high-entropy (256-bit), so a hash-equality lookup is not a
// timing oracle — no constant-time compare needed.

const PREFIX = "bbflt_";

export function generateFleetToken(): { token: string; hash: string } {
  const token = PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function bearer(req: NextRequest): string | null {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

// Resolve a presented fleet token to its operator label, or null if missing /
// unknown / revoked. The lookup is by hash, so the raw token never touches the DB.
export async function validateFleetToken(req: NextRequest): Promise<{ label: string } | null> {
  const token = bearer(req);
  if (!token || !token.startsWith(PREFIX)) return null;
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("fleet_tokens")
    .select("label, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;
  return { label: data.label };
}
