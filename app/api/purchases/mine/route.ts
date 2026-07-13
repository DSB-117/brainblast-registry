import { NextRequest, NextResponse } from "next/server";
import { listPurchases, verifyWalletSignature } from "../../../../lib/purchases";

export const dynamic = "force-dynamic";

// POST /api/purchases/mine — list a wallet's purchases (the "Your licenses"
// panel), grants included for re-download.
// body: { wallet, ts, sig }
//
// Proof of ownership is a wallet signMessage over
// `brainblast:licenses:<wallet>:<ts>` — the wallet's ed25519 key IS the
// account, no signup or session. `ts` must be within ±10 minutes (replay
// window); the signature is base58.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const wallet = body?.wallet;
  const ts = Number(body?.ts);
  const sig = body?.sig;
  if (typeof wallet !== "string" || typeof sig !== "string" || !Number.isFinite(ts)) {
    return NextResponse.json({ error: "wallet, ts, and sig are required" }, { status: 400 });
  }
  if (!verifyWalletSignature(wallet, ts, sig)) {
    return NextResponse.json({ error: "signature verification failed (or message expired — retry)" }, { status: 403 });
  }

  const result = await listPurchases(wallet);
  if ("error" in result) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json({ purchases: result });
}
