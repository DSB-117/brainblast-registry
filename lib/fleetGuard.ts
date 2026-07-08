import { createHash } from "node:crypto";
import { NextRequest } from "next/server";

// Abuse defenses for the OPEN /api/fleet-ledger (no tokens). The endpoint is a
// collaborative dedup list; these keep a griefer from poisoning it without
// imposing any auth on honest fleets.

export const HOURLY_REPO_CAP = 300; // per-IP repos recorded per rolling hour
export const MIN_STARS = 25; // a repo below this isn't a worthwhile scout target
const RATE_WINDOW_MS = 60 * 60 * 1000;

// Hash the client IP (never store it raw). Salt with a server secret if set so the
// hash can't be linked across services; falls back to a fixed salt otherwise.
export function ipHash(req: NextRequest): string {
  // Use the PLATFORM-set client IP, not the leftmost x-forwarded-for value —
  // a client can spoof `X-Forwarded-For: <rotating-ip>` to land in a fresh
  // rate-limit bucket every request and defeat the cap entirely. On Vercel the
  // trustworthy IP is x-vercel-forwarded-for / x-real-ip; if we must fall back
  // to x-forwarded-for, take the LAST hop (appended by the proxy), not the first.
  const fwd = (req.headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const ip =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    fwd[fwd.length - 1] ||
    "unknown";
  const salt = process.env.FLEET_IP_SALT ?? "brainblast-fleet";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// How many repos this IP has recorded in the last hour (for the rate limit).
export async function recentCount(db: any, hash: string): Promise<number> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count, error } = await db
    .from("fleet_ledger_audit")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("recorded_at", since);
  if (error) return 0; // fail-open on the rate counter (never block honest writes on a count error)
  return count ?? 0;
}

export interface RepoCheck {
  ok: boolean;
  reason?: string;
  stars?: number;
}

// Verify a repo is real + popular enough to be worth tracking. Requires a
// server-side GITHUB_TOKEN (otherwise GitHub's 60/hr unauthenticated limit makes
// this unusable, so we skip — rate-limit + TTL still apply). New repos only;
// re-recording an already-known repo skips this.
export async function verifyRepo(repo: string): Promise<RepoCheck> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { ok: true, reason: "unverified (no GITHUB_TOKEN)" };
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "brainblast-fleet" },
    });
    if (res.status === 404) return { ok: false, reason: "repo does not exist" };
    if (!res.ok) return { ok: true, reason: `github ${res.status} (allowed)` }; // don't block on GitHub hiccups
    const j = await res.json();
    const stars = typeof j.stargazers_count === "number" ? j.stargazers_count : 0;
    if (j.archived) return { ok: false, reason: "repo archived" };
    if (stars < MIN_STARS) return { ok: false, reason: `only ${stars} stars (min ${MIN_STARS})` };
    return { ok: true, stars };
  } catch {
    return { ok: true, reason: "github unreachable (allowed)" };
  }
}

// Union two trap-id lists (so a submission can't ERASE traps another fleet found).
export function mergeTraps(existing: string[], incoming: string[]): string[] {
  return [...new Set([...(existing ?? []), ...(incoming ?? [])])];
}
