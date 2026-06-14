// Known SPL token mints accepted for stake payments (see app/stake/[memoCode]).
// Decimals are fetched on-chain at send time (via getMint) rather than
// hardcoded here, so we never risk sending the wrong number of base units.
export const TOKENS = {
  SOL: { symbol: "SOL", mint: null },
  USDC: { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  BRAIN: { symbol: "$BRAIN", mint: "5wxVBRmjaRLw71SE7nNFzTioEtQdzM5EkdP5k1BDBAGS" },
} as const;

export type TokenSymbol = keyof typeof TOKENS;
