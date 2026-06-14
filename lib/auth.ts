import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Constant-time comparison against SYNC_TOKEN (manual/CI calls) or
// CRON_SECRET (set by Vercel Cron, which sends it as a Bearer token on every
// scheduled invocation) to avoid leaking either secret's length/content via
// response-time differences.
export function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const syncToken = process.env.SYNC_TOKEN;
  if (syncToken && constantTimeEquals(token, syncToken)) return true;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && constantTimeEquals(token, cronSecret)) return true;

  return false;
}
