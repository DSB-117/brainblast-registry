import { NextRequest, NextResponse } from "next/server";

// Private-beta gate (magic-link invites, backed by Supabase `beta_invites`).
// When BETA_GATE=1, human-facing pages require a valid invite key — delivered
// via a magic link (?key=…) that sets a cookie, or entered on /beta. The API
// (/api/*) and the /beta entry page are never gated. Unset BETA_GATE to go
// fully public (needs a redeploy — Vercel bakes env at deploy time).
export const config = {
  matcher: ["/((?!api|beta|_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

const COOKIE = "bb_beta";

// Returns true (valid+active), false (missing/revoked), or null (couldn't ask
// the DB — treated as fail-open so a network blip never locks out the beta).
async function keyState(key: string): Promise<boolean | null> {
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/beta_invites?key=eq.${encodeURIComponent(key)}&active=eq.true&select=key`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return ((await res.json()) as unknown[]).length > 0;
  } catch {
    return null;
  }
}

async function recordActivation(key: string) {
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return;
  try {
    await fetch(`${url}/rest/v1/beta_invites?key=eq.${encodeURIComponent(key)}&activated_at=is.null`, {
      method: "PATCH",
      headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ activated_at: new Date().toISOString() }),
    });
  } catch {
    /* best effort */
  }
}

export async function middleware(req: NextRequest) {
  if (process.env.BETA_GATE !== "1") return NextResponse.next(); // gate off → public

  const keyParam = req.nextUrl.searchParams.get("key");
  const cookieKey = req.cookies.get(COOKIE)?.value;
  const key = keyParam || cookieKey;

  const toBeta = () => {
    const to = new URL("/beta", req.url);
    if (keyParam) to.searchParams.set("e", "1");
    const r = NextResponse.redirect(to);
    r.cookies.delete(COOKIE);
    return r;
  };

  if (!key) return toBeta();

  const state = await keyState(key);
  if (state === false) return toBeta(); // known-bad or revoked

  // state === true (valid) or null (couldn't verify → fail-open) → allow.
  if (keyParam) {
    if (state === true) await recordActivation(key);
    // Came via magic link: persist the cookie and strip the key from the URL.
    const clean = new URL(req.nextUrl.pathname, req.url);
    const r = NextResponse.redirect(clean);
    r.cookies.set(COOKIE, key, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return r;
  }
  return NextResponse.next();
}
