// Vendored slice of brainblast provenance (packages/core/src/contrib/provenance.ts).
//
// The anti-fabrication gate — the check that replaces human PR review. It is pure
// (fetch + string ops, no ts-morph), so it runs at the registry edge: every
// submission must cite a COMMIT-PINNED source and a verbatim `evidence` snippet;
// the server fetches that exact file at that exact commit and confirms the
// vulnerable line is really there. A fabricated finding (evidence not in the
// cited source) is rejected — which RED→GREEN alone cannot catch.

export interface SubmittedFinding {
  binding?: { check?: { params?: Record<string, any> } };
  provenance?: Record<string, any>;
}

export interface ProvenanceResult {
  ok: boolean;
  reasons: string[];
  resolvedUrl?: string;
}

const SHA_RE = /^[0-9a-f]{7,40}$/i;
const MUTABLE_REF_RE = /^(main|master|develop|dev|trunk|head|latest|v?\d+(\.\d+)*|release.*)$/i;

interface SourceRef {
  rawUrl: string;
  sha: string;
}

export function resolveSourceRef(ref: string): { ref?: SourceRef; reason?: string } {
  if (typeof ref !== "string" || ref.length === 0) return { reason: "no sourceRef provided" };

  const shorthand = ref.match(/^([^/\s]+)\/([^@\s]+)@([^:\s]+):(.+)$/);
  if (shorthand) {
    const [, owner, repo, sha, path] = shorthand;
    if (!SHA_RE.test(sha) || MUTABLE_REF_RE.test(sha)) return { reason: `sourceRef must pin a commit SHA, got '${sha}'` };
    return { ref: { sha, rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}` } };
  }

  if (/^https?:\/\//.test(ref)) {
    const blob = ref.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (blob) {
      const [, owner, repo, sha, path] = blob;
      if (!SHA_RE.test(sha) || MUTABLE_REF_RE.test(sha)) return { reason: `GitHub blob URL must pin a commit SHA (not a branch/tag like '${sha}')` };
      return { ref: { sha, rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}` } };
    }
    const raw = ref.match(/^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
    if (raw) {
      const sha = raw[3];
      if (!SHA_RE.test(sha) || MUTABLE_REF_RE.test(sha)) return { reason: `raw URL must pin a commit SHA (not a branch/tag like '${sha}')` };
      return { ref: { sha, rawUrl: ref } };
    }
    return { reason: "only github.com/raw.githubusercontent.com commit-pinned URLs are verifiable" };
  }

  return { reason: "sourceRef must be 'owner/repo@<sha>:path' or a commit-pinned GitHub URL" };
}

function expectedToken(finding: SubmittedFinding): string | undefined {
  const p = finding.binding?.check?.params ?? {};
  return (p.propName ?? p.call ?? undefined) as string | undefined;
}

function containsFlexible(haystack: string, needle: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  return norm(haystack).includes(norm(needle));
}

export async function verifyProvenance(
  finding: SubmittedFinding,
  opts: { fetchImpl?: typeof fetch; maxBytes?: number } = {},
): Promise<ProvenanceResult> {
  const f = opts.fetchImpl ?? fetch;
  const maxBytes = opts.maxBytes ?? 512 * 1024;
  const prov = (finding.provenance ?? {}) as Record<string, any>;
  const reasons: string[] = [];

  const sourceRef: string = prov.sourceRef ?? "";
  const evidence: string = prov.evidence ?? "";

  if (!evidence || typeof evidence !== "string" || evidence.trim().length < 3) {
    reasons.push("provenance.evidence is required — a verbatim snippet of the vulnerable line from the cited source");
  }

  const resolved = resolveSourceRef(sourceRef);
  if (!resolved.ref) {
    reasons.push(`provenance: ${resolved.reason}`);
    return { ok: false, reasons };
  }
  if (reasons.length > 0) return { ok: false, reasons };

  const token = expectedToken(finding);
  if (token && !evidence.includes(token)) {
    reasons.push(`provenance.evidence must contain the trap's target '${token}' (the cited line must be the actual footgun)`);
  }

  let body: string;
  try {
    const res = await f(resolved.ref.rawUrl);
    if (!res.ok) {
      reasons.push(`provenance: cited source not found (${res.status}) at ${resolved.ref.rawUrl}`);
      return { ok: false, reasons };
    }
    body = (await res.text()).slice(0, maxBytes);
  } catch (e: any) {
    reasons.push(`provenance: could not fetch cited source (${e?.message ?? e})`);
    return { ok: false, reasons };
  }

  if (!containsFlexible(body, evidence)) {
    reasons.push("provenance: evidence not found in the cited source at that commit — cannot confirm this trap is real (fabrication check failed)");
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, reasons: [], resolvedUrl: resolved.ref.rawUrl };
}
