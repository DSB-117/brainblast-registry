import { NextRequest, NextResponse } from "next/server";
import { createPurchase } from "../../../lib/purchases";
import type { TokenSymbol } from "../../../lib/tokens";

export const dynamic = "force-dynamic";

// POST /api/purchases — create a self-serve checkout quote.
// body: { lots: LotName[], period: "mo"|"yr", token: "SOL"|"USDC"|"BRAIN", buyer_wallet }
//
// The server recomputes the USD price from the live corpus (the client's
// number is never trusted), converts it to the chosen token at the live price
// — $BRAIN at its standing 10% discount — and returns the payment
// instructions: pay `token_amount_due` to `pay_to` with `memo_code` attached,
// then POST /api/purchases/verify with the tx signature and `claim_secret`.
//
// `claim_secret` is returned exactly ONCE here (stored only as a hash). The
// memo goes on-chain and is public; the secret is what proves the quote is
// yours when collecting the grant.
//
// Open by design (like /api/vti): a quote row is inert until real money moves
// on-chain, and unpaid quotes are pruned by the cron within a day.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const result = await createPurchase({
    lots: body?.lots,
    period: body?.period,
    token: body?.token as TokenSymbol,
    buyerWallet: body?.buyer_wallet,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(
    {
      purchase: result.purchase,
      claim_secret: result.claim_secret,
      instructions:
        `Send ${result.purchase.token_amount_due} ${result.purchase.token} to ${result.purchase.pay_to} ` +
        `in ONE transaction carrying the SPL Memo "${result.purchase.memo_code}", then ` +
        `POST /api/purchases/verify { memo_code, claim_secret, tx_signature } to receive your signed grant. ` +
        `Save claim_secret — it is shown only once.`,
    },
    { status: 201 },
  );
}
