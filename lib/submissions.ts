// The reconciliation layer — the bridge that makes the direct API the real
// ingestion path (no PRs).
//
// A VTI submitted to POST /api/vti lands in the `vtis` table provenance-verified
// but proof_verified=false: the registry has no prover, so it can't re-run
// RED→GREEN in-process. This module is the two-sided seam:
//
//   - loadUnprovenQueue()  — the brainblast-side re-prover (which DOES have the
//     prover) pulls the full findings that still need RED→GREEN.
//   - markProofVerified()  — it writes the verdict back, flipping proof_verified
//     and stamping the record's redGreenProof receipt.
//   - loadVerifiedSubmissions() — the catalog + dashboard fold PROVEN submissions
//     in alongside the git corpus, so an API-landed VTI shows up publicly with no
//     PR. Only proof_verified rows surface — the "100% reproduced" invariant holds.

import { supabaseAdmin } from "./supabase";
import type { CorpusVti } from "./brainblast/corpus";

export interface QueuedFinding {
  trapId: string;
  finding: Record<string, any>; // the full submitted Finding (fixtures included)
}

// Map a stored submission `record` to the CorpusVti shape the catalog/dashboard
// consume. A proof_verified row is, by definition, RED→GREEN — so we stamp the
// receipt true and carry the re-proof method through.
function langFromFilename(filename?: string): string {
  const f = filename ?? "";
  if (/\.tsx?$/.test(f)) return "typescript";
  if (/\.jsx?$/.test(f)) return "javascript";
  if (/\.go$/.test(f)) return "go";
  if (/\.sol$/.test(f)) return "solidity";
  if (/\.py$/.test(f)) return "python";
  if (/\.rs$/.test(f)) return "rust";
  return "typescript";
}

function recordToCorpusVti(record: Record<string, any>): CorpusVti {
  const proof = (record.redGreenProof as Record<string, any> | undefined) ?? {};
  const fx = (record.fixtures as Record<string, any> | undefined) ?? {};
  const lang = langFromFilename(fx.filename);
  return {
    trapId: record.trapId,
    title: record.title,
    sdk: { name: record.sdk?.name ?? "unknown", version: record.sdk?.version ?? null },
    severity: record.severity,
    class: record.class,
    corroborationCount: Math.max(0, record.corroborationCount ?? 0),
    redGreenProof: { red: true, green: true, method: proof.method ?? "static-checker" },
    // Full fixtures (not just the vulnerable snippet) so the paid distribution
    // feed serves a complete trainable record, same as a git-corpus VTI.
    vulnerable: { lang, path: fx.filename ?? null, snippet: fx.vulnerable ?? "" },
    fixed: { lang, path: fx.filename ?? null, snippet: fx.fixed ?? "" },
    generatedTest: null,
    license: record.license ?? "contributor-grant-v1",
    capturedAt: record.capturedAt ?? null,
  } as CorpusVti;
}

// Every PROVEN direct submission, as CorpusVtis — the set the served corpus folds
// in. Never throws (a Supabase blip must not take down the public catalog).
export async function loadVerifiedSubmissions(): Promise<CorpusVti[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("vtis")
      .select("record")
      .eq("proof_verified", true)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((r: any) => recordToCorpusVti(r.record ?? {})).filter((v) => v.trapId);
  } catch {
    return [];
  }
}

// The re-proof queue: full findings still awaiting RED→GREEN. Server-secret gated
// (the caller is the brainblast re-prover, not a browser) — it returns fixtures.
export async function loadUnprovenQueue(limit = 100): Promise<QueuedFinding[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("vtis")
    .select("trap_id, record")
    .eq("proof_verified", false)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ trapId: r.trap_id, finding: findingFromRecord(r.record ?? {}) }));
}

// Reconstruct the exact submittable Finding (what proveFinding needs) from a
// stored record — the inverse of ingestVtiSubmission's minting. `detect`/`binding`
// are stored verbatim; a record from before that change has no `binding` and is
// skipped by the re-prover (returns a finding with binding=null).
function findingFromRecord(record: Record<string, any>): Record<string, any> {
  return {
    id: record.trapId,
    severity: record.severity,
    title: record.title,
    class: record.class,
    component: { name: record.sdk?.name ?? "unknown", type: record.sdk?.type ?? "", version: record.sdk?.version ?? undefined },
    detect: record.detect ?? null,
    binding: record.binding ?? null,
    fixtures: record.fixtures ?? {},
    provenance: record.provenance ?? {},
  };
}

// Record a re-proof verdict. On success flips proof_verified=true and stamps the
// receipt into the record; a failed re-proof is left unproven (and logged).
export async function markProofVerified(
  trapId: string,
  proven: boolean,
  method: string,
  now: string,
): Promise<{ updated: boolean; reason?: string }> {
  const db = supabaseAdmin();
  const { data: existing, error: readErr } = await db.from("vtis").select("record").eq("trap_id", trapId).maybeSingle();
  if (readErr) return { updated: false, reason: readErr.message };
  if (!existing) return { updated: false, reason: "no such trapId" };

  const record = (existing.record ?? {}) as Record<string, any>;
  if (proven) {
    record.proofVerified = true;
    record.redGreenProof = { red: true, green: true, method, verifiedAt: now };
  }
  const { error } = await db
    .from("vtis")
    .update({ record, proof_verified: proven })
    .eq("trap_id", trapId);
  if (error) return { updated: false, reason: error.message };
  return { updated: true };
}
