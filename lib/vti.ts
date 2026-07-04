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

export async function loadLots(): Promise<ServerLot[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.lots;
  const lots: ServerLot[] = [];
  for (const url of sources()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`failed to fetch VTI lot ${url}: ${res.status}`);
    const text = await res.text();
    // Skip any line that doesn't parse (e.g. a stray git conflict marker
    // committed into the dataset) rather than throwing away the whole lot.
    const vtis: CorpusVti[] = [];
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        vtis.push(JSON.parse(t) as CorpusVti);
      } catch {
        // skip the unparseable line
      }
    }
    lots.push({ name: url.split("/").pop() ?? url, vtis });
  }

  // Fold in RED→GREEN-verified direct submissions (the /api/vti path) as their own
  // lot, deduped against the git corpus by trapId — so an API-landed VTI appears in
  // the served corpus with no PR, without ever double-counting one already in git.
  const known = new Set(lots.flatMap((l) => l.vtis.map((v) => v.trapId)));
  const submitted = (await loadVerifiedSubmissions()).filter((v) => !known.has(v.trapId));
  if (submitted.length) lots.push({ name: "api-submissions", vtis: submitted });

  cache = { at: Date.now(), lots };
  return lots;
}
