import { NextRequest, NextResponse } from "next/server";

// Optional private-preview gate. When SITE_GATE_PASSWORD is set (in Vercel env),
// every human-facing page is behind HTTP Basic Auth. Unset it to go fully public
// — no redeploy needed, the env change takes effect on the next request.
//
// The API (/api/*) is intentionally NOT gated here, so the public catalog, the
// free sample feed, and CLI/feed testing keep working during the preview.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

export function middleware(req: NextRequest) {
  const password = process.env.SITE_GATE_PASSWORD;
  if (!password) return NextResponse.next(); // gate disabled → public

  const expectedUser = process.env.SITE_GATE_USER || "preview";
  const header = req.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    try {
      const [user, pass] = atob(header.slice(6)).split(":");
      if (user === expectedUser && pass === password) return NextResponse.next();
    } catch {
      // fall through to challenge
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Brainblast private preview"' },
  });
}
