// Wrapped SOL mint — used only as a price-lookup key for native SOL (which
// has no SPL mint of its own for transfer purposes).
const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

// Known SPL token mints accepted for stake payments (see app/stake/[memoCode]).
// Decimals are fetched on-chain at send time (via getMint) rather than
// hardcoded here, so we never risk sending the wrong number of base units.
// `priceMint` is the mint used to look up a USD price (wrapped SOL for
// native SOL, since SOL itself has no mint address).
export const TOKENS = {
  SOL: { symbol: "SOL", mint: null, priceMint: WRAPPED_SOL_MINT },
  USDC: { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", priceMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  BRAIN: { symbol: "$BRAIN", mint: "5wxVBRmjaRLw71SE7nNFzTioEtQdzM5EkdP5k1BDBAGS", priceMint: "5wxVBRmjaRLw71SE7nNFzTioEtQdzM5EkdP5k1BDBAGS" },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// $BRAIN payments get a 10% discount on the equivalent USD stake (see
// POST /api/stakes' `instructions` text).
export const BRAIN_DISCOUNT = 0.1;
