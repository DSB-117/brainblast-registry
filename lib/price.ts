// USD price lookups via GeckoTerminal's free, unauthenticated "simple price"
// endpoint — used to convert a USD stake amount into a token amount so users
// don't have to do the math (or guess) themselves.
export async function fetchUsdPrices(mints: string[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(mints));
  if (unique.length === 0) return {};

  const url = `https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${unique.join(",")}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`price lookup failed: ${res.status}`);
  }

  const json = await res.json();
  const raw: Record<string, string> = json?.data?.attributes?.token_prices ?? {};

  const prices: Record<string, number> = {};
  for (const mint of unique) {
    const match = raw[mint] ?? raw[mint.toLowerCase()];
    if (match) prices[mint] = Number(match);
  }
  return prices;
}
