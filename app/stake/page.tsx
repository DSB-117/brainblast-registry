import { supabaseAdmin } from "../../lib/supabase";
import { loadLots } from "../../lib/vti";
import { buildCatalog } from "../../lib/brainblast";
import { loadBondableVtis, type BondableVti } from "../../lib/corpusIndex";
import StakeSection from "../../components/StakeSection";
import WalletButton from "../../components/WalletButton";
import WalletBalances from "../../components/WalletBalances";
import MySubmissions from "../../components/MySubmissions";

export const dynamic = "force-dynamic";

interface Pack {
  pack_id: string;
  name: string;
  repo_url: string;
  author: string | null;
  description: string | null;
  latest_version: string | null;
  synced_at: string;
}

interface CorpusStats {
  vtis: number;
  sdks: number;
  classes: number;
}

async function getPacks(): Promise<Pack[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("pack_registry")
      .select("pack_id, name, repo_url, author, description, latest_version, synced_at")
      .order("name", { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// Real corpus numbers, straight from the same lots the distribution endpoint
// serves — the count of PROVEN VTIs, the SDKs they cover, and the trap classes.
async function getCorpusStats(): Promise<CorpusStats> {
  try {
    const lots = await loadLots();
    const vtis = lots.flatMap((l) => l.vtis);
    const c = buildCatalog(vtis);
    return { vtis: c.counts.proven, sdks: c.counts.sdks, classes: c.counts.classes };
  } catch {
    return { vtis: 0, sdks: 0, classes: 0 };
  }
}

// The proven VTIs a contributor can place a confidence bond behind, richest first.
async function getBondableVtis(): Promise<BondableVti[]> {
  try {
    return await loadBondableVtis();
  } catch {
    return [];
  }
}

function inferCategory(pack_id: string): string {
  if (/solana|spl|anchor|metaplex|pump|jito|raydium/i.test(pack_id)) return "Solana";
  if (/stripe|payment|webhook|billing/i.test(pack_id)) return "Payments";
  if (/auth|privy|oauth|jwt|token/i.test(pack_id)) return "Auth";
  if (/openai|anthropic|llm|ai|agent/i.test(pack_id)) return "AI";
  if (/aws|gcp|azure|cloud/i.test(pack_id)) return "Cloud";
  return "Web3";
}

// The real contribution loop — how a trap actually becomes a VTI in the corpus.
const STEPS = [
  ["Prove it RED→GREEN", "Author a candidate that catches the bug and prove it locally: the oracle FAILS your vulnerable fixture and PASSES your fix. Non-reproducing work never makes it in."],
  ["Cite the real source", "Point at the exact commit the bug lives in (owner/repo@<sha>:path) with the verbatim vulnerable line. The server fetches that file at that commit and confirms it's real — the anti-fabrication check that replaces human review."],
  ["Submit — no PR", "`brainblast submit:vti` posts your candidate straight into the corpus. It's re-checked end to end — RED→GREEN + secret scan + provenance — and only what passes lands. No fork, no reviewer, no waiting."],
  ["Earn on usage", "Your finding becomes a VTI scored by severity × corroboration. As the corpus is licensed for training and evaluation, the data dividend routes value back to the contributors whose records are used."],
];

function PackCard({ pack }: { pack: Pack }) {
  return (
    <div className="glass lift" style={{ borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 999, background: "var(--glass-2)", color: "var(--ink-2)" }}>{inferCategory(pack.pack_id)}</span>
        {pack.latest_version && <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>v{pack.latest_version}</span>}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{pack.name}</h3>
      {pack.description && <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>{pack.description}</p>}
      <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)", marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pack.pack_id}</div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-3)" }}>
        {pack.author && <span>by {pack.author}</span>}
        <a href={pack.repo_url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", marginLeft: "auto" }}>repo →</a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "20px 22px" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 8 }}>{label}</div>
      <div className="mono grad-text" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

const SUBMIT_CMD = [
  "# prove it locally, then post it straight into the corpus",
  "brainblast submit:vti --candidate ./my-trap.json --dry-run",
  "brainblast submit:vti --candidate ./my-trap.json",
];

export default async function StakePage() {
  const [packs, stats, bondableVtis] = await Promise.all([getPacks(), getCorpusStats(), getBondableVtis()]);

  return (
    <div className="stake-app" style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Contribute · Earn</div>
        <h1 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Contribute a verified trap</h1>
        <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "12px 0 0", maxWidth: 680, lineHeight: 1.6 }}>
          Prove a real SDK footgun RED→GREEN, cite the commit it lives in, and submit it in one command — no PR, no reviewer. It becomes a VTI in the corpus buyers train and evaluate on, and the data dividend pays you as it's used. New here? <a href="/earn" style={{ color: "var(--emerald)" }}>Read the contributor guide →</a>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Verified VTIs" value={stats.vtis.toLocaleString()} />
        <Stat label="SDKs covered" value={String(stats.sdks)} />
        <Stat label="Trap classes" value={String(stats.classes)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 22, alignItems: "start" }}>
        {/* Left — the real contribution path + the optional bond */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card glass sidebar-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Submit in one command</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.55 }}>
              Contribution is a CLI command, not a form — the gate is automatic. Your candidate is re-proven server-side and only lands if RED→GREEN, secret-clean, and provenance-verified all pass.
            </p>
            <pre className="mono" style={{ margin: 0, padding: "14px 16px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-2)", overflowX: "auto" }}>
              {SUBMIT_CMD.map((l) => (
                <div key={l} style={{ color: l.startsWith("#") ? "var(--ink-4)" : "var(--ink-2)" }}>{l}</div>
              ))}
            </pre>
            <a href="/docs" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 14, fontSize: 13, fontWeight: 600, color: "var(--emerald)" }}>
              Candidate format &amp; provenance
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>

          {/* Confidence bond on a real VTI — bonding + slashing are live; the
              dividend payout is the remaining operational step. */}
          <div className="card glass sidebar-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Optional: bond $BRAIN behind a VTI</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 14px", lineHeight: 1.55 }}>
              Never required to contribute. Bond $BRAIN, SOL, or USDC (10% off in $BRAIN) behind a proven VTI to signal confidence and amplify your dividend share — weighted by the trap&apos;s score (severity × corroboration). The reproduction gate is the slash trigger: if the VTI ever stops reproducing, the bond is slashed. Bonding and slashing are live; the on-chain dividend <em>payout</em> is rolling out.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Connect a wallet to register a bond.</div>
              <WalletButton />
            </div>
            <WalletBalances />
            <div style={{ marginTop: 14 }}>
              <StakeSection vtis={bondableVtis} />
            </div>
          </div>
          <MySubmissions />
        </div>

        {/* Right — how it works + $BRAIN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 84 }}>
          <div className="card glass sidebar-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>How it works</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {STEPS.map(([t, b], i) => (
                <div key={t} style={{ display: "flex", gap: 13 }}>
                  <span className="mono" style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--glass-2)", color: "var(--emerald)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{t}</div>
                    <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>{b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card glass sidebar-card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>What $BRAIN is</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "0 0 10px", lineHeight: 1.55 }}>
              An optional rail, never a paywall. Buyers pay in USD by default; $BRAIN pays at a standing 10% discount, and holding it unlocks the access tiers. USDC we take at full price is bought back into $BRAIN and routed to contributors.
            </p>
            <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--emerald)" }}>
              See the access tiers
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Installable rule packs (separate from the VTI corpus) */}
      <div style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Installable rule packs</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: "0 0 16px", maxWidth: 620, lineHeight: 1.55 }}>
          The guardrail packs you can install to catch these traps in your own CI — distinct from the VTI training corpus above.
        </p>
        {packs.length === 0 ? (
          <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "36px 24px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>No packs registered yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {packs.map((p) => <PackCard pack={p} key={p.pack_id} />)}
          </div>
        )}
      </div>
    </div>
  );
}
