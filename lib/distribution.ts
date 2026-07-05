// Next.js adapter for the brainblast distribution endpoint (R3).
//
// The actual logic — public catalog, anonymous sample, ed25519/hmac grant
// verification, tiering, lot-scope — is the EXACT `handleRequest` from the
// brainblast package (the reference server is literally the deployable). This
// adapter only: (1) maps NextRequest → ServerRequest, (2) loads the lots, (3)
// turns the handler's synchronous meter into an async Supabase write, (4) maps
// ServerResponse → NextResponse. A failed metering write fail-closes (500) so a
// pull is never served unaccounted.

import { NextRequest, NextResponse } from "next/server";
import { handleRequest, type Grant, type ServerRequest, type UsageRecord } from "./brainblast";
import { loadLots } from "./vti";
import { computePricing } from "./lots";
import { meterPull } from "./ledger";

export async function serve(req: NextRequest, path: string): Promise<NextResponse> {
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  for (const [k, v] of url.searchParams) query[k] = v;

  let grant: Grant | undefined;
  const hdr = req.headers.get("x-brainblast-grant");
  if (hdr) {
    try {
      grant = JSON.parse(Buffer.from(hdr, "base64").toString("utf8"));
    } catch {
      return NextResponse.json({ error: "malformed x-brainblast-grant header (expect base64 JSON)" }, { status: 400 });
    }
  }

  let lots;
  try {
    lots = await loadLots();
  } catch (e: any) {
    return NextResponse.json({ error: "corpus unavailable", detail: e?.message ?? String(e) }, { status: 502 });
  }

  // The handler's meter is synchronous; capture the record and persist it after.
  let captured: UsageRecord | undefined;
  const serverReq: ServerRequest = { method: req.method ?? "GET", path, query, grant };
  const resp = handleRequest(serverReq, {
    lots,
    trustedDistributor: process.env.BRAINBLAST_MARKET_PUBKEY,
    hmacSecret: process.env.BRAINBLAST_MARKET_SECRET,
    meter: (rec) => {
      captured = rec;
    },
  });

  if (resp.status === 200 && captured) {
    try {
      await meterPull(captured);
    } catch (e: any) {
      // Fail-closed: the pull is not delivered if it can't be accounted.
      return NextResponse.json({ error: "metering failed", detail: e?.message ?? String(e) }, { status: 500 });
    }
  }

  // Augment the public storefront with the live coverage-derived pricing model
  // (8 lots + packages + Scale), so the catalog reflects what the site sells.
  if (path === "/catalog" && resp.status === 200) {
    try {
      const body = JSON.parse(resp.body);
      body.pricing = computePricing(lots.flatMap((l) => l.vtis) as unknown as Array<Record<string, unknown>>);
      return NextResponse.json(body, { status: 200 });
    } catch {
      /* fall through to the raw body */
    }
  }

  return new NextResponse(resp.body, { status: resp.status, headers: { "content-type": resp.contentType } });
}
