import { loadDashboard } from "../lib/dashboardData";
import ProofWidget from "../components/dash/ProofWidget";
import CoverageMatrix from "../components/dash/CoverageMatrix";

export const revalidate = 300;

const SEV_COLOR: Record<string, string> = { critical: "var(--red)", high: "var(--amber)", medium: "var(--blue)", low: "var(--ink-3)" };
const PROOF_COLOR: Record<string, string> = { "static-checker": "var(--green)", behavioral: "var(--cyan)", compiler: "var(--blue)" };

function ago(iso: string | null): string {
  if (!iso) return "—";
  const d = (Date.now() - Date.parse(iso)) / 86_400_000;
  if (d < 1) return "today";
  if (d < 2) return "1d ago";
  return `${Math.round(d)}d ago`;
}

function StatCard({ label, value, unit, accent, spark }: { label: string; value: string; unit?: string; accent: string; spark?: number[] }) {
  const max = spark ? Math.max(...spark, 1) : 1;
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, minHeight: 108 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 8px ${accent}` }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
        <span className="mono" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</span>
        {unit && <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 3 }}>{unit}</span>}
      </div>
      {spark && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22, marginTop: "auto" }}>
          {spark.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${Math.max(12, (v / max) * 100)}%`, background: accent, opacity: 0.28 + (i / spark.length) * 0.72, borderRadius: 2 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function Overview() {
  const d = await loadDashboard();
  const totalProof = d.proofMethods.reduce((a, b) => a + b.count, 0) || 1;
  const sevTotal = d.totals.vtis || 1;

  return (
    <div style={{ animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Verified trap registry</div>
          <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Corpus overview</h1>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 560 }}>
            Proven error→fix→test records of real SDK footguns — pinned to exact versions, re-provable on demand. Browse the full catalog free.
          </p>
        </div>
        <a href="/browse" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 17px", borderRadius: 11, background: "var(--green)", color: "#04241c", fontSize: 13.5, fontWeight: 600, boxShadow: "0 0 24px -6px var(--green)" }}>
          Browse the corpus
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <StatCard label="Verified traps" value={String(d.totals.vtis)} accent="var(--green)" spark={[3, 5, 6, 8, 9, 12, 13, 15]} />
        <StatCard label="SDKs covered" value={String(d.totals.sdks)} accent="var(--cyan)" spark={[2, 4, 6, 8, 9, 11, 13, 14]} />
        <StatCard label="Trap classes" value={String(d.totals.classes)} unit={`/ ${d.totals.classes + d.coverage.uncovered.length}`} accent="var(--violet)" spark={[2, 3, 4, 5, 6, 7, 8, 8]} />
        <StatCard label="Reproduction rate" value={`${d.totals.reproductionPct}`} unit="%" accent="var(--green)" spark={[100, 100, 100, 100, 100, 100, 100, 100]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, marginBottom: 14, alignItems: "stretch" }}>
        <ProofWidget />

        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Distribution</div>

          <div style={{ marginBottom: 18 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 9 }}>severity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(["critical", "high", "medium", "low"] as const).filter((s) => d.severity[s] > 0).map((s) => (
                <div key={s}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-2)", textTransform: "capitalize" }}>{s}</span>
                    <span className="mono" style={{ color: "var(--ink-3)" }}>{d.severity[s]}</span>
                  </div>
                  <div style={{ height: 7, background: "var(--panel-2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(d.severity[s] / sevTotal) * 100}%`, background: SEV_COLOR[s], borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 10 }}>proof method</div>
            <div style={{ display: "flex", height: 9, borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
              {d.proofMethods.map((p) => (
                <div key={p.method} title={`${p.method}: ${p.count}`} style={{ width: `${(p.count / totalProof) * 100}%`, background: PROOF_COLOR[p.method] ?? "var(--ink-3)" }} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {d.proofMethods.map((p) => (
                <div key={p.method} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PROOF_COLOR[p.method] ?? "var(--ink-3)" }} />
                  <span style={{ color: "var(--ink-2)", flex: 1 }}>{p.method}</span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 14, alignItems: "stretch" }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div className="eyebrow" style={{ color: "var(--amber)" }}>Coverage matrix · class × sdk</div>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{d.totals.classes}/{d.totals.classes + d.coverage.uncovered.length} classes</span>
          </div>
          <CoverageMatrix classes={d.coverage.classes} sdks={d.coverage.sdks} cells={d.coverage.cells} uncovered={d.coverage.uncovered} />
        </div>

        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="eyebrow" style={{ color: "var(--green)" }}>Recently landed</div>
            <a href="/browse" className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>view all →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {d.ledger.slice(0, 6).map((r, i) => (
              <div key={r.trapId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: SEV_COLOR[r.severity], flexShrink: 0, boxShadow: `0 0 7px ${SEV_COLOR[r.severity]}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trapId}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.sdk} · {r.class.replace(/-/g, " ")}</div>
                </div>
                <span className="mono" style={{ fontSize: 10, color: PROOF_COLOR[r.proofMethod] ?? "var(--ink-3)", background: "var(--panel-2)", padding: "2px 7px", borderRadius: 5, flexShrink: 0 }}>{r.proofMethod === "static-checker" ? "static" : r.proofMethod}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0, width: 52, textAlign: "right" }}>{ago(r.capturedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
