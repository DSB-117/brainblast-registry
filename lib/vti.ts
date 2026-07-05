// VTI corpus loader for the distribution endpoint (R3).
//
// The server holds the lots; clients receive only what their grant entitles. We
// source the lot(s) from the brainblast repo's published datasets (raw GitHub by
// default, overridable via VTI_SOURCE_URL) and cache them in-memory per warm
// instance. Lot name = the URL's basename, so a grant's lot-scope matches.

import type { CorpusVti, ServerLot } from "./brainblast";
import { loadVerifiedSubmissions } from "./submissions";

const DEFAULT_SOURCE =
  "https://raw.githubusercontent.com/DSB-117/brainblast/main/datasets/v0.1.0/full/vti.jsonl";

const TTL_MS = 5 * 60_000;
let cache: { at: number; lots: ServerLot[] } | null = null;

function sources(): string[] {
  return (process.env.VTI_SOURCE_URL ?? DEFAULT_SOURCE)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Curated lot taxonomy ─────────────────────────────────────────────────────
// The corpus is sold as curated slices, not one blob. Three à-la-carte lots
// (individually priced) plus an "other" bucket that ships only inside the
// all-corpus Scale bundle. A buyer's grant scopes to these names, so lot-scope
// enforcement (server.ts) filters the feed to exactly what they bought.
export type LotName = "solana" | "evm" | "web-backend" | "other";

export const SELLABLE_LOTS: LotName[] = ["solana", "evm", "web-backend"];
const LOT_ORDER: LotName[] = ["solana", "evm", "web-backend", "other"];

const RE_SOLANA = /solana|anchor|metaplex|spl-token|raydium|jupiter|orca|meteora|coral-xyz|web3\.js|jito|pyth|mpl-|bags|tensor|drift/;
const RE_EVM = /\bviem\b|ethers|uniswap|1inch|\bsolidity\b|web3\.py|@0x|\bevm\b|wagmi|hardhat|foundry|permit2|aave|hop/;
const RE_WEB = /jsonwebtoken|jose|\bjwt\b|express|cookie|session|helmet|cors|apollo|\brequest\b|\bpg\b|mysql|nodemailer|ioredis|\bws\b|mongo|\baws\b|\bs3\b|node:https|node:http|node:crypto|crypto\/tls|\btls\b|redis|kafka|undici|axios|fastify|koa|passport|nats|amqp|cassandra|ldap|mssql|sequelize|knex|elastic|playwright|puppeteer|libxml|next|http/;

/** Which sellable lot a VTI belongs to (by SDK name, with a class fallback). */
export function lotFor(vti: { sdk?: { name?: string | null } | null; class?: string | null }): LotName {
  const n = (vti.sdk?.name ?? "").toLowerCase();
  if (RE_SOLANA.test(n)) return "solana";
  if (RE_EVM.test(n)) return "evm";
  if (RE_WEB.test(n)) return "web-backend";
  // Class fallback for an SDK name no regex matched: slippage/royalty/unconfirmed
  // lean on-chain (bucket to EVM), auth/verification lean web-backend; the rest is
  // "other" (Scale-only).
  const c = vti.class ?? "";
  if (c === "missing-slippage-guard" || c === "silent-zero-revenue" || c === "unconfirmed-state") return "evm";
  if (c === "auth-bypass" || c === "missing-verification") return "web-backend";
  return "other";
}

export async function loadLots(): Promise<ServerLot[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.lots;

  // Gather the full corpus — published seed dataset(s) + every RED→GREEN-verified
  // direct submission — deduped by trapId, then bucket into curated lots.
  const all: CorpusVti[] = [];
  const seen = new Set<string>();
  const add = (v: CorpusVti) => {
    if (v?.trapId && !seen.has(v.trapId)) { seen.add(v.trapId); all.push(v); }
  };
  for (const url of sources()) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue; // seed source unavailable — degrade to submissions only
      for (const line of (await res.text()).split("\n")) {
        const t = line.trim();
        if (!t) continue;
        try { add(JSON.parse(t) as CorpusVti); } catch { /* skip unparseable line */ }
      }
    } catch { /* network blip on a seed source — skip it, keep the rest */ }
  }
  try {
    for (const v of await loadVerifiedSubmissions()) add(v);
  } catch { /* submissions store blip must never take down the feed */ }

  const buckets = new Map<LotName, CorpusVti[]>();
  for (const v of all) {
    const lot = lotFor(v);
    const arr = buckets.get(lot);
    if (arr) arr.push(v);
    else buckets.set(lot, [v]);
  }
  const lots: ServerLot[] = LOT_ORDER.filter((k) => buckets.has(k)).map((k) => ({ name: k, vtis: buckets.get(k)! }));

  cache = { at: Date.now(), lots };
  return lots;
}
