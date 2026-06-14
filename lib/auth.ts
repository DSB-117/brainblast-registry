import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

// Constant-time comparison against SYNC_TOKEN to avoid leaking the secret's
// length/content via response-time differences.
export function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.SYNC_TOKEN;
  if (!expected) return false;

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
