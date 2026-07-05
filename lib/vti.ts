// VTI corpus loader for the distribution endpoint (R3).
//
// The server holds the lots; clients receive only what their grant entitles. We
// source the lot(s) from the brainblast repo's published datasets (raw GitHub by
// default, overridable via VTI_SOURCE_URL) and cache them in-memory per warm
// instance. Lot name = the URL's basename, so a grant's lot-scope matches.

import type { CorpusVti, ServerLot } from "./brainblast";
import { loadVerifiedSubmissions } from "./submissions";
import { lotFor, LOT_ORDER, type LotName } from "./lots";

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

// Lot taxonomy + pricing now live in ./lots (single source of truth). lotFor,
// LOT_ORDER, LotName are imported above.

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
