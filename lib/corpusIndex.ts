// Bondable-VTI index — the bridge between the confidence-bond flow and the real
// corpus. A bond is placed on a specific VTI (its trapId), so we need to (a)
// validate a trapId actually exists and is PROVEN before accepting a bond, (b)
// expose the dividend weight (the VTI's score = severity × corroboration) the UI
// shows, and (c) tell the slash pass whether a bonded VTI still reproduces.
//
// Sourced from the same lots the distribution endpoint serves (`loadLots`), so
// it's always the live corpus — no separate table to drift.

import { loadLots } from "./vti";
import { scoreVti, type CorpusVti } from "./brainblast/corpus";

export interface BondableVti {
  trapId: string;
  sdk: string;
  class: string;
  severity: string;
  corroborationCount: number;
  score: number; // 0..100 — the dividend weight (severity × corroboration)
}

function isProven(v: CorpusVti): boolean {
  return v.redGreenProof?.red === true && v.redGreenProof?.green === true;
}

// Every PROVEN VTI you can bond behind, richest (highest score) first. Deduped by
// trapId (first proven record wins).
export async function loadBondableVtis(): Promise<BondableVti[]> {
  const lots = await loadLots();
  const seen = new Map<string, BondableVti>();
  for (const v of lots.flatMap((l) => l.vtis)) {
    if (!v?.trapId || !isProven(v) || seen.has(v.trapId)) continue;
    seen.set(v.trapId, {
      trapId: v.trapId,
      sdk: v.sdk?.name ?? "unknown",
      class: String(v.class ?? "other"),
      severity: v.severity,
      corroborationCount: Math.max(0, v.corroborationCount ?? 0),
      score: scoreVti(v),
    });
  }
  return [...seen.values()].sort((a, b) => b.score - a.score);
}

// The set of trapIds that currently reproduce — the slash oracle. A bond whose
// trapId is NOT in here has lost its backing VTI and is slashed.
export async function provenTrapIds(): Promise<Set<string>> {
  return new Set((await loadBondableVtis()).map((v) => v.trapId));
}
