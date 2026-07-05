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

// Shared auth for the re-prover endpoints (queue + verify). Whitespace-tolerant
// (a trailing newline from pasting a secret is the classic silent mismatch), and
// it distinguishes "not configured on this deployment" from "wrong token" so a
// 401 is actually diagnosable.
export type ReproveAuth = "ok" | "unconfigured" | "unauthorized";

export function checkReproveAuth(authHeader: string | null): ReproveAuth {
  const token = (process.env.BRAINBLAST_REPROVE_TOKEN ?? "").trim();
  if (!token) return "unconfigured";
  const provided = (authHeader ?? "").trim().replace(/^Bearer\s+/i, "").trim();
  return provided === token ? "ok" : "unauthorized";
}

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
    // PostgREST caps a single response at ~1000 rows. Without paging, the corpus
    // silently froze at seed + the OLDEST 1000 proven submissions once we passed
    // 1000 — every newer proven VTI was invisible on the dashboard/feed. Page
    // through the full set explicitly (ascending, stable order) until a short page.
    const PAGE = 1000;
    const out: CorpusVti[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from("vtis")
        .select("record")
        .eq("proof_verified", true)
        .order("created_at", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      for (const r of data) {
        const rec = (r as any).record ?? {};
        // Trust gate: serve ONLY rows whose stored record carries the real
        // RED→GREEN receipt (proofVerified===true, set by the brainblast-side
        // re-prover). The DB column alone is not enough — recordToCorpusVti
        // hardcodes a green receipt, so a column/blob drift must never let an
        // un-reproved record reach a paid tier.
        if (rec.proofVerified !== true) continue;
        const v = recordToCorpusVti(rec);
        if (v.trapId) out.push(v);
      }
      if (data.length < PAGE) break;
    }
    return out;
  } catch {
    return [];
  }
}

// The re-proof queue: full findings still awaiting RED→GREEN. Server-secret gated
// (the caller is the brainblast re-prover, not a browser) — it returns fixtures.
export async function loadUnprovenQueue(limit = 1000): Promise<QueuedFinding[]> {
  const db = supabaseAdmin();
  // BLOB-DRIVEN: a row is unproven until its stored record carries the real
  // RED→GREEN receipt (record.proofVerified===true, written by the re-prover). We
  // do NOT gate on the DB `proof_verified` column — it can drift out of sync with
  // the receipt (observed: freshly-inserted rows leaving the column-based queue
  // without ever being re-proved). Scan the most-recent rows (new submissions are
  // always recent) and return those not yet truly proven. Same definition of
  // "proven" as loadVerifiedSubmissions, so the two can never disagree.
  const { data, error } = await db
    .from("vtis")
    .select("trap_id, record")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  const out: QueuedFinding[] = [];
  for (const r of data ?? []) {
    if ((r as any).record?.proofVerified === true) continue;
    out.push({ trapId: (r as any).trap_id, finding: findingFromRecord((r as any).record ?? {}) });
    if (out.length >= limit) break;
  }
  return out;
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
