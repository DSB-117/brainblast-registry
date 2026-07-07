// The git-less VTI ingest gate — server side, at the registry edge.
//
// Turns an untrusted submission into a stored candidate VTI under the gates the
// registry can run WITHOUT the ts-morph prover (which deliberately does not live
// here — the registry is a lean data layer):
//
//   0. SHAPE       — required fields, a VETTED check.kind (fail-closed), a safe
//      id, size caps. Garbage is rejected before any network work.
//   1. SECRET SCAN — the fixtures run through the vendored Keyguard classifier;
//      any key/keypair/mnemonic refuses the submission. Never store a secret.
//   2. PROVENANCE  — the submission must cite a COMMIT-PINNED source + a verbatim
//      evidence snippet; the server fetches that exact file at that exact commit
//      and confirms the vulnerable line is really there. This is the un-fakeable
//      anti-fabrication check that replaces human PR review.
//
// The heavy RED→GREEN *reproduction* proof stays where ts-morph already runs: the
// client `submit:vti` command proves it locally before POSTing, and a brainblast-
// side pass re-proves stored candidates and flips `proof_verified` (the corpus's
// paid tiers gate on that flag). So the endpoint is safe against fabrication and
// secrets synchronously, and against non-reproduction before anything is sold.

import { detectFileSecrets } from "./brainblast/detect";
import { verifyProvenance } from "./brainblast/provenance";
import { classifyTrap, TRAP_CLASSES } from "./brainblast/vtiClass";

// Mirrors packages/core/src/checkers/index.ts::checkerKinds. Kept in sync by hand
// (the registry vendors data, not the checker engine); an unknown kind fails
// closed exactly like the proof gate.
const VETTED_CHECK_KINDS = new Set([
  "positional-arg-identity", "required-call-with-options", "fee-allocation-shape",
  "arg-equals-constant-identifier", "object-arg-property-literal-equals",
  "object-arg-property-forbidden-literal", "anchor-init-if-needed-guarded",
  "env-secrets-committed", "taint-to-sink", "literal-multiplier-wrong-constant",
  "forbidden-call-replacement", "solana-mint-identity-mismatch",
  "anchor-account-matches-idl", "anchor-account-missing-constraint",
  "anchor-forbidden-account-type", "anchor-body-call-pattern",
  "anchor-cpi-unverified-program", "fee-configs-zero-or-missing",
  "compiles-against-sdk", "differential-io", "array-property-contains-forbidden-literal",
  // Positional-argument analog of object-arg-property-forbidden-literal
  // (new Connection(url, "processed"), getBalance(x, "processed"), createHash("md5")).
  "positional-arg-forbidden-literal",
  // ABSENCE modality — a trigger call whose required follow-up is missing in the
  // same scope (viem sendTransaction/writeContract without waitForTransactionReceipt,
  // ethers sendTransaction without .wait()). class: unconfirmed-state / staleness.
  "required-followup-call-missing",
  // Multi-language static AST (tree-sitter) — Go + Solidity.
  "cst-struct-field-forbidden-literal", "cst-member-access-forbidden",
  // Solidity forbidden CALL by name (selfdestruct, delegatecall, suicide) —
  // bare or method, any receiver. Complements cst-member-access-forbidden.
  "cst-call-forbidden",
]);
const VETTED_TEST_KINDS = new Set([
  "stripe-webhook-signature", "privy-jwt-claims", "bags-fee-share",
  "token-program-consistency", "metaplex-immutable-metadata", "anchor-program-test", "none",
]);

const SEVERITIES = new Set(["critical", "high", "medium", "low"]);
const CONSENT_SCOPES = new Set(["opt-in:train", "opt-in:eval", "opt-in:train+eval"]);
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const MAX_FIXTURE_BYTES = 64 * 1024;

export interface IngestGateResult {
  accepted: boolean;
  trapId: string | null;
  reasons: string[];
  provenanceUrl?: string;
  record?: Record<string, unknown>;
}

function isStr(v: unknown, min = 1): v is string {
  return typeof v === "string" && v.length >= min;
}

export function validateShape(x: unknown): string[] {
  const r: string[] = [];
  if (typeof x !== "object" || x === null) return ["submission must be a JSON object"];
  const f = x as Record<string, any>;

  if (!isStr(f.id) || !ID_RE.test(f.id)) r.push("id must be kebab-case [a-z0-9-]");
  if (!isStr(f.severity) || !SEVERITIES.has(f.severity)) r.push("severity must be critical|high|medium|low");
  if (!isStr(f.title)) r.push("title is required");
  if (typeof f.component !== "object" || !isStr(f.component?.name)) r.push("component.name is required");

  const check = f.binding?.check;
  const test = f.binding?.test;
  if (typeof check !== "object" || !isStr(check?.kind)) r.push("binding.check.kind is required");
  else if (!VETTED_CHECK_KINDS.has(check.kind)) r.push(`binding.check.kind '${check.kind}' is not a vetted checker`);
  if (typeof test !== "object" || !isStr(test?.kind)) r.push('binding.test.kind is required (use "none")');
  else if (!VETTED_TEST_KINDS.has(test.kind)) r.push(`binding.test.kind '${test.kind}' is not a vetted test`);

  const fx = f.fixtures;
  if (typeof fx !== "object" || fx === null) r.push("fixtures { filename, vulnerable, fixed } is required");
  else {
    if (!isStr(fx.filename)) r.push("fixtures.filename is required");
    if (!isStr(fx.vulnerable)) r.push("fixtures.vulnerable source is required");
    if (!isStr(fx.fixed)) r.push("fixtures.fixed source is required");
    if (Buffer.byteLength(String(fx.vulnerable ?? ""), "utf8") > MAX_FIXTURE_BYTES ||
        Buffer.byteLength(String(fx.fixed ?? ""), "utf8") > MAX_FIXTURE_BYTES) {
      r.push(`fixtures too large (max ${MAX_FIXTURE_BYTES} bytes each)`);
    }
  }
  return r;
}

export async function ingestVtiSubmission(
  raw: unknown,
  opts: { consentScope?: string; corroborationCount?: number; fetchImpl?: typeof fetch; now?: string } = {},
): Promise<IngestGateResult> {
  const trapId = typeof (raw as any)?.id === "string" ? (raw as any).id : null;

  // Gate 0 — shape.
  const shape = validateShape(raw);
  if (shape.length) return { accepted: false, trapId, reasons: shape };
  const f = raw as Record<string, any>;

  const consentScope = opts.consentScope ?? "opt-in:train+eval";
  if (!CONSENT_SCOPES.has(consentScope)) return { accepted: false, trapId, reasons: [`invalid consentScope ${JSON.stringify(consentScope)}`] };

  // Gate 1 — never store a secret. Scan both fixture sources.
  const secrets = [
    ...detectFileSecrets(String(f.fixtures.vulnerable)),
    ...detectFileSecrets(String(f.fixtures.fixed)),
  ];
  if (secrets.length) {
    return { accepted: false, trapId, reasons: [`refusing to ingest: ${secrets.length} secret(s) detected (${secrets.map((s) => s.kind).join(", ")})`] };
  }

  // Gate 2 — provenance / anti-fabrication (fetch the cited commit).
  const prov = await verifyProvenance(f, { fetchImpl: opts.fetchImpl });
  if (!prov.ok) return { accepted: false, trapId, reasons: prov.reasons };

  // Mint the stored candidate. proof_verified=false: RED→GREEN is re-proven by
  // the brainblast side (where ts-morph lives) before this reaches a paid tier.
  const now = opts.now ?? new Date().toISOString();
  // Prefer the submitter's declared class when it's a valid taxonomy value — the
  // fleet already classified it authoritatively (its CLASS_BY_RULE knows the new
  // rule id, which the vendored heuristic here does not). Fall back to the
  // id+title heuristic only when no valid class was declared.
  const declared = typeof f.class === "string" && (TRAP_CLASSES as readonly string[]).includes(f.class) ? f.class : null;
  const cls = declared ?? classifyTrap({ id: f.id, title: f.title } as any);
  const record = {
    trapId: f.id,
    title: f.title,
    sdk: { name: f.component.name, version: f.component.version ?? null, type: f.component.type ?? null },
    severity: f.severity,
    class: cls,
    checkKind: f.binding.check.kind,
    // Stored verbatim so the brainblast-side re-prover can reconstruct the exact
    // Finding and re-run RED→GREEN (the reconciliation loop).
    detect: f.detect,
    binding: f.binding,
    fixtures: { filename: f.fixtures.filename, vulnerable: f.fixtures.vulnerable, fixed: f.fixtures.fixed },
    provenance: {
      sourceRef: f.provenance?.sourceRef ?? null,
      evidence: f.provenance?.evidence ?? null,
      verifiedSourceUrl: prov.resolvedUrl ?? null,
      provenanceVerified: true,
      sourceUrls: f.provenance?.sourceUrl ? [f.provenance.sourceUrl] : [],
    },
    // Client-claimed proof method (informational); authoritative RED→GREEN is
    // set by the brainblast-side re-proof that flips proofVerified.
    claimedProofMethod: typeof f.claimedProofMethod === "string" ? f.claimedProofMethod : null,
    proofVerified: false,
    corroborationCount: opts.corroborationCount ?? 1,
    license: "contributor-grant-v1",
    consentScope,
    capturedAt: now,
  };

  return { accepted: true, trapId: f.id, reasons: [], provenanceUrl: prov.resolvedUrl, record };
}

// Sample-tier teaser — metadata + receipts, never the trainable fixtures.
export function toTeaser(v: Record<string, any>): Record<string, unknown> {
  return {
    trapId: v.trapId ?? v.trap_id ?? null,
    title: v.title ?? null,
    sdk: v.sdk ?? null,
    class: v.class ?? null,
    severity: v.severity ?? null,
    provenanceVerified: v.provenance?.provenanceVerified ?? null,
    proofVerified: v.proofVerified ?? v.proof_verified ?? false,
    corroborationCount: v.corroborationCount ?? null,
    capturedAt: v.capturedAt ?? null,
  };
}
