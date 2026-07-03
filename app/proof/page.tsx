const BACKENDS = [
  { tier: "T0", name: "static-checker", detail: "AST pattern match against the vulnerable shape. Offline, no code executed — the default.", time: "~4ms", color: "var(--emerald)", tint: "rgba(52,211,153,0.14)" },
  { tier: "T1", name: "compiler", detail: "Type-checks the candidate against the pinned SDK. Catches hallucinated or moved APIs with zero execution.", time: "~280ms", color: "var(--cyan)", tint: "rgba(34,211,238,0.14)" },
  { tier: "T2", name: "executed-test", detail: "Runs a vetted contract test in a sandbox. A behavioral proof for bugs with no static shape.", time: "~1.2s", color: "var(--violet)", tint: "rgba(139,123,255,0.14)" },
  { tier: "T2", name: "differential", detail: "Runs the candidate against a golden input→output table. Catches wrong-constant / logic bugs.", time: "~1.8s", color: "var(--violet)", tint: "rgba(139,123,255,0.14)" },
];

const GATES = [
  { n: 1, name: "secret-scan", detail: "Every file runs through Keyguard. One key refuses the whole submission — fail-closed." },
  { n: 2, name: "RED→GREEN reproduction", detail: "The oracle re-proves the finding. This is the anti-poisoning gate: non-reproducing data can't land." },
  { n: 3, name: "consent / license", detail: "Contributor-grant-v1 stamped, scope verified. Owned and contributed lots stay physically separate." },
];

export default function Proof() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>How it works</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Proven, not scraped</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
          A Verified Trap Instance is a claim that&apos;s been mechanically proven and can be re-proven by anyone. Two things make that true: a generalized oracle, and a fail-closed ingest funnel.
        </p>
      </div>

      <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 4 }}>The generalized oracle</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Four backends, cheapest first</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "0 0 24px", maxWidth: 560, lineHeight: 1.6 }}>
          The rule must fail on the vulnerable fixture and pass on the fixed one. Whichever backend can prove that wins; corroborating backends are recorded alongside it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {BACKENDS.map((b) => (
            <div key={b.name} style={{ display: "flex", gap: 14, padding: "17px 18px", borderRadius: 14, background: "var(--glass-2)", border: "1px solid var(--line)" }}>
              <span className="mono" style={{ fontSize: 11, color: b.color, background: b.tint, padding: "3px 8px", borderRadius: 6, height: "fit-content" }}>{b.tier}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <span className="mono" style={{ fontSize: 14.5, fontWeight: 500 }}>{b.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{b.time}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, lineHeight: 1.55 }}>{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28 }}>
          <div style={{ fontSize: 13, color: "var(--cyan)", fontWeight: 500, marginBottom: 4 }}>The trust funnel</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Three gates, all fail-closed</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px", lineHeight: 1.6 }}>Contributed records clear each gate in order. Any rejection stops the record — nothing slips through silently.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {GATES.map((g) => (
              <div key={g.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span className="mono" style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)", color: "var(--cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5 }}>{g.n}</span>
                <div style={{ paddingTop: 2 }}>
                  <div className="mono" style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 3 }}>{g.name}</div>
                  <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0, lineHeight: 1.55 }}>{g.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14 }}>Verify it yourself</div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 18px", lineHeight: 1.6 }}>
            Every record ships its own re-runnable receipt. No secret answer key — the same procedure returns the same color for anyone.
          </p>
          <div className="mono" style={{ fontSize: 12.5, color: "var(--emerald)", background: "rgba(0,0,0,0.35)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", lineHeight: 1.9, marginBottom: 16 }}>
            <div style={{ color: "var(--ink-4)" }}># re-prove any pack RED→GREEN</div>
            npx brainblast verify ./pack
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
            <span className="mono" style={{ flex: 1, fontSize: 11.5, textAlign: "center", padding: "10px 0", borderRadius: 9, background: "rgba(251,113,133,0.12)", color: "var(--rose)" }}>vulnerable → RED</span>
            <span className="mono" style={{ flex: 1, fontSize: 11.5, textAlign: "center", padding: "10px 0", borderRadius: 9, background: "rgba(52,211,153,0.14)", color: "var(--emerald)" }}>fixed → GREEN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
