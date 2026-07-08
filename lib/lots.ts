// Curated-lot taxonomy + the DYNAMIC coverage-anchored pricing engine.
//
// Single source of truth for: which lot a VTI belongs to (`lotFor`), its
// distinct-pattern signature (`patternKey`), the packages that bundle lots, and
// `computePricing()` — which derives every lot/package/Scale price from the LIVE
// corpus, not a hardcoded table.
//
// The pricing thesis: a lot is worth its COVERAGE (distinct footgun patterns +
// distinct SDKs), not its raw VTI count. So a new *instance* of an existing
// pattern doesn't move the price; a new *pattern or SDK* raises coverage and can
// bump the lot up a tier. Prices snap to clean tiers so they don't jitter.

import type { CorpusVti } from "./brainblast/corpus";

export type LotName =
  | "solana"
  | "evm"
  | "auth-sessions"
  | "transport-tls"
  | "web-hardening"
  | "cloud-storage"
  | "crypto"
  | "browser-desktop"
  | "other";

export interface LotMeta {
  name: string;
  accent: string;
  blurb: string;
  sellable: boolean;
}

export const LOTS: Record<LotName, LotMeta> = {
  solana: { name: "Solana", accent: "#a78bfa", blurb: "On-chain money & auth traps — commitment, preflight, royalties, slippage.", sellable: true },
  evm: { name: "EVM", accent: "#22d3ee", blurb: "Ethereum-stack traps — unconfirmed transactions, zero-slippage swaps, tx.origin auth.", sellable: true },
  "auth-sessions": { name: "Auth & Sessions", accent: "#34d399", blurb: "JWT, sessions, cookies, CORS credentials — the login surface.", sellable: true },
  "transport-tls": { name: "Transport & TLS", accent: "#f472b6", blurb: "Disabled certificate verification across HTTP/DB/message clients (MITM).", sellable: true },
  "web-hardening": { name: "Web Hardening", accent: "#fbbf24", blurb: "Security headers, CSP, CSRF, GraphQL introspection, HTTP smuggling.", sellable: true },
  "cloud-storage": { name: "Cloud & Storage", accent: "#38bdf8", blurb: "Public-read ACLs, block-public-access off, storage & bucket misconfig.", sellable: true },
  crypto: { name: "Cryptography", accent: "#fb923c", blurb: "Broken hashes & ciphers in app code — MD5, SHA-1, DES, weak key sizes.", sellable: true },
  "browser-desktop": { name: "Browser & Desktop", accent: "#c084fc", blurb: "TLS bypass & sandbox-off in Playwright, Puppeteer, Electron.", sellable: true },
  other: { name: "Other", accent: "#7c7c90", blurb: "Uncategorized — bundled into Scale only.", sellable: false },
};

export const LOT_ORDER: LotName[] = [
  "solana", "evm", "auth-sessions", "transport-tls", "web-hardening", "cloud-storage", "crypto", "browser-desktop", "other",
];
export const SELLABLE_LOTS: LotName[] = LOT_ORDER.filter((l) => LOTS[l].sellable);

// Packages — named bundles of lots at a discount, so buyers can shop at three
// granularities (lot → package → Scale).
export interface PackageDef { key: string; name: string; accent: string; lots: LotName[]; discount: number; blurb: string }
export const PACKAGES: PackageDef[] = [
  { key: "web3", name: "Web3", accent: "#a78bfa", lots: ["solana", "evm"], discount: 0.2, blurb: "Both blockchain lots — Solana + EVM." },
  { key: "appsec", name: "AppSec", accent: "#34d399", lots: ["auth-sessions", "transport-tls", "web-hardening", "cloud-storage", "crypto", "browser-desktop"], discount: 0.3, blurb: "Every web, backend, cloud & crypto lot." },
];
export const SCALE_DISCOUNT = 0.32; // vs the summed à-la-carte lots

// Billing periods. Annual is the committed rate; monthly is pay-as-you-go.
// annual = 10 × monthly — paying annually is "2 months free" (~17% off). Every
// price (lot, package, Scale, total) is a uniform ÷10, so discounts compose.
export const MONTHLY_FACTOR = 10;
export const monthlyOf = (annual: number) => Math.round(annual / MONTHLY_FACTOR);

// ── Classifier ───────────────────────────────────────────────────────────────
const RE_SOLANA = /solana|anchor|metaplex|spl-token|raydium|jupiter|orca|meteora|coral-xyz|web3\.js|jito|pyth|mpl-|bags|tensor|drift|switchboard/;
const RE_EVM = /\bviem\b|ethers|uniswap|1inch|\bsolidity\b|web3\.py|@0x|\bevm\b|wagmi|hardhat|foundry|permit2|aave|hop|sdk-core|v3-sdk/;

/** Which curated lot a VTI belongs to. Priority-ordered to resolve overlaps. */
export function lotFor(vti: { sdk?: { name?: string | null } | null; class?: string | null }): LotName {
  const n = (vti.sdk?.name ?? "").toLowerCase();
  if (RE_SOLANA.test(n)) return "solana";
  if (RE_EVM.test(n)) return "evm";
  if (/playwright|puppeteer|electron/.test(n)) return "browser-desktop";
  if (n.includes("node:crypto") || /(^|[^/])\bcrypto\b($|[^/])/.test(n)) return "crypto"; // node crypto primitives (not crypto/tls)
  if (/@aws-sdk|aws-sdk|\bs3\b|gcs|google-cloud|@azure|azure-storage|cloud-storage/.test(n)) return "cloud-storage";
  if (/jsonwebtoken|\bjose\b|\bjwt\b|express-jwt|express-session|passport|cookie|connect|iron-session|koa-session|next-auth/.test(n)) return "auth-sessions";
  if (/helmet|apollo|\bcors\b|node:http\b|graphql|csurf/.test(n)) return "web-hardening";
  if (/node:https|crypto\/tls|\btls\b|\brequest\b|undici|axios|got|node-fetch|\bpg\b|mysql|ioredis|\bredis\b|mongo|kafka|\bnats\b|amqp|cassandra|ldap|mssql|tedious|sequelize|knex|elastic|\bws\b|\bssl\b/.test(n)) return "transport-tls";
  if (/express|fastify|\bkoa\b|\bnext\b|\bhttp\b/.test(n)) return "auth-sessions"; // generic web frameworks
  // class fallback for an SDK no regex matched. Every trap class routes to a
  // sellable lot so nothing valuable falls into the unsellable "other" bucket:
  //  - staleness/slippage/revenue/unconfirmed → evm (DeFi / oracle / Ethereum-stack;
  //    the Solana instances of these already matched RE_SOLANA above)
  //  - immutable/wrong-constant → solana (dominated by Metaplex metadata locks &
  //    LAMPORTS_PER_SOL decimal-scaling; keeps each class coherent in one lot)
  const c = vti.class ?? "";
  if (c === "missing-slippage-guard" || c === "silent-zero-revenue" || c === "unconfirmed-state" || c === "unchecked-staleness") return "evm";
  if (c === "immutable-after-deploy" || c === "wrong-constant") return "solana";
  if (c === "auth-bypass") return "auth-sessions";
  if (c === "missing-verification") return "crypto";
  return "other";
}

// ── Pattern signature — the distinct "lesson" ────────────────────────────────
/** A stable key for a VTI's footgun pattern: same key ⇒ same lesson (different
 *  repo). Prefers the stored check binding; falls back to the trapId shape. */
export function patternKey(vti: Record<string, any>): string {
  if (typeof vti?.patternKey === "string" && vti.patternKey) return vti.patternKey; // precomputed
  const check = vti?.binding?.check;
  if (check?.kind) {
    const p = check.params ?? {};
    const target = p.propName ?? p.call ?? p.field ?? p.property ?? p.triggerCall ?? "";
    const val = p.forbiddenValue ?? (Array.isArray(p.requiredCalls) ? p.requiredCalls[0] : undefined) ?? "";
    return `${check.kind}|${target}|${val}`.toLowerCase();
  }
  // Fallback: the last two hyphen-tokens of the generated trapId are the shape
  // (…-rejectunauthorized-false, …-commitment-processed, …-sellerfeebasispoints-0).
  const id = String(vti?.trapId ?? "");
  const toks = id.split("-");
  if (toks.length >= 2) return toks.slice(-2).join("-").toLowerCase();
  return `${vti?.class ?? ""}|${(vti?.sdk?.name ?? "").toLowerCase()}`;
}

// ── Coverage → price ─────────────────────────────────────────────────────────
const SEV_WEIGHT: Record<string, number> = { critical: 1.5, high: 1.2, medium: 1.0, low: 0.8 };
// Clean price tiers a lot can land on (USD/yr). Thresholds are on the quality-
// weighted coverage score.
const TIERS: { min: number; price: number }[] = [
  { min: 16, price: 3500 },
  { min: 13, price: 3000 },
  { min: 10, price: 2500 },
  { min: 7, price: 2000 },
  { min: 0, price: 1500 },
];

export interface LotStat {
  lot: LotName;
  count: number;
  sdks: number;
  patterns: number;
  severity: Record<string, number>;
  provenancePct: number; // share with real (corroborated) provenance
  coverage: number; // quality-weighted coverage score (the pricing driver)
  price: number; // snapped tier
}
export interface PackageStat { key: string; name: string; accent: string; lots: LotName[]; price: number; listPrice: number; discount: number }
export interface Pricing {
  lots: LotStat[];
  packages: PackageStat[];
  scale: number;
  scaleListPrice: number;
  otherCount: number; // VTIs in the unsellable "other" lot (Scale-only) — so the à-la-carte grid reconciles with the corpus total
}

function round100(n: number) { return Math.round(n / 100) * 100; }

/** Derive every lot/package/Scale price from the live corpus. */
export function computePricing(vtis: Array<Record<string, any>>): Pricing {
  const byLot = new Map<LotName, Record<string, any>[]>();
  for (const v of vtis) {
    const l = lotFor(v);
    (byLot.get(l) ?? byLot.set(l, []).get(l)!).push(v);
  }

  const lots: LotStat[] = [];
  for (const lot of SELLABLE_LOTS) {
    const rs = byLot.get(lot) ?? [];
    if (rs.length === 0) continue;
    const sdks = new Set(rs.map((r) => (r.sdk?.name ?? "").toLowerCase())).size;
    const patterns = new Set(rs.map((r) => patternKey(r))).size;
    const severity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    let sevWeightSum = 0;
    let corroborated = 0;
    for (const r of rs) {
      const s = r.severity ?? "low";
      severity[s] = (severity[s] ?? 0) + 1;
      sevWeightSum += SEV_WEIGHT[s] ?? 1;
      if ((r.corroborationCount ?? 0) > 0) corroborated++;
    }
    const avgSev = sevWeightSum / rs.length; // ~0.8..1.5
    const provenancePct = corroborated / rs.length;
    const quality = (avgSev / 1.2) * (0.85 + 0.15 * provenancePct); // 1.2 = "high" baseline
    const coverage = (patterns + 0.5 * sdks) * quality;
    const price = TIERS.find((t) => coverage >= t.min)!.price;
    lots.push({ lot, count: rs.length, sdks, patterns, severity, provenancePct, coverage: Math.round(coverage * 10) / 10, price });
  }

  const priceOf = (l: LotName) => lots.find((x) => x.lot === l)?.price ?? 0;
  const packages: PackageStat[] = PACKAGES.map((p) => {
    const listPrice = p.lots.reduce((s, l) => s + priceOf(l), 0);
    return { key: p.key, name: p.name, accent: p.accent, lots: p.lots, listPrice, price: round100(listPrice * (1 - p.discount)), discount: p.discount };
  });

  const scaleList = lots.reduce((s, l) => s + l.price, 0);
  return { lots, packages, scale: round100(scaleList * (1 - SCALE_DISCOUNT)), scaleListPrice: scaleList, otherCount: (byLot.get("other") ?? []).length };
}
