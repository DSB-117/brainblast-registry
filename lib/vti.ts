// VTI corpus loader for the distribution endpoint (R3).
//
// The server holds the lots; clients receive only what their grant entitles. We
// source the lot(s) from the brainblast repo's published datasets (raw GitHub by
// default, overridable via VTI_SOURCE_URL) and cache them in-memory per warm
// instance. Lot name = the URL's basename, so a grant's lot-scope matches.

import type { CorpusVti, ServerLot } from "./brainblast";

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
    const vtis = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as CorpusVti);
    lots.push({ name: url.split("/").pop() ?? url, vtis });
  }
  cache = { at: Date.now(), lots };
  return lots;
}
