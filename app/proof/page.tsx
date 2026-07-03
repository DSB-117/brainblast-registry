const BACKENDS = [
  { tier: "T0", name: "static-checker", detail: "AST pattern match against the vulnerable shape. Offline, no code executed — the default.", time: "~4ms", color: "var(--green)" },
  { tier: "T1", name: "compiler", detail: "Type-checks the candidate against the pinned SDK. Catches hallucinated or moved APIs with zero execution.", time: "~280ms", color: "var(--blue)" },
  { tier: "T2", name: "executed-test", detail: "Runs a vetted contract test in a sandbox. A behavioral proof for traps with no static shape.", time: "~1.2s", color: "var(--violet)" },
  { tier: "T2", name: "differential", detail: "Runs the candidate against a golden input→output table. Catches wrong-constant / logic bugs.", time: "~1.8s", color: "var(--violet)" },
];

const GATES = [
  { n: 1, name: "secret-scan", detail: "Every file runs through Keyguard. One key refuses the whole submission — fail-closed." },
  { n: 2, name: "RED→GREEN reproduction", detail: "The oracle re-proves the trap. This is the anti-poisoning gate: non-reproducing data can't land." },
  { n: 3, name: "consent / license", detail: "Contributor-grant-v1 stamped, scope verified. Owned and contributed lots stay physically separate." },
];

export default function Proof() {
  return (
    <div style={{ animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ marginBottom: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Trust · methodology</div>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>How proof works</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 640 }}>
          A Verified Trap Instance isn&apos;t a scraped bug — it&apos;s a claim that&apos;s been mechanically proven and can be re-proven by anyone. Two things make that true: a generalized oracle, and a fail-closed ingest funnel.
        </p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div className="eyebrow" style={{ color: "var(--green)", marginBottom: 4 }}>The generalized oracle</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>Four backends, cheapest first</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 20px", maxWidth: 560 }}>
          The rule must fail on the vulnerable fixture and pass on the fixed one. Whichever backend can prove that wins; corroborating backends are recorded alongside it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {BACKENDS.map((b) => (
            <div key={b.name} style={{ display: "flex", gap: 13, padding: "15px 16px", borderRadius: 12, background: "var(--panel-2)", borderLeft: `2px solid ${b.color}` }}>
              <span className="mono" style={{ fontSize: 10, color: b.color, background: "rgba(255,255,255,0.05)", padding: "3px 7px", borderRadius: 5, height: "fit-content" }}>{b.tier}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <span className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{b.name}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{b.time}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.55 }}>{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: "var(--blue)", marginBottom: 4 }}>The trust funnel</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>Three gates, all fail-closed</h2>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 20px" }}>Contributed traps clear each gate in order. Any rejection stops the record — nothing slips through silently.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GATES.map((g) => (
              <div key={g.n} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                <span className="mono" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: "50%", border: "1px solid var(--blue)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{g.n}</span>
                <div style={{ paddingTop: 2 }}>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{g.name}</div>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>{g.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <div className="eyebrow" style={{ color: "var(--green)", marginBottom: 14 }}>Verify it yourself</div>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 16px" }}>
            Every record ships its own re-runnable receipt. There is no secret answer key — the same procedure returns the same color for anyone.
          </p>
          <div className="mono" style={{ fontSize: 12, color: "var(--green)", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", lineHeight: 1.9, marginBottom: 14 }}>
            <div style={{ color: "var(--ink-3)" }}># re-prove any pack RED→GREEN</div>
            npx brainblast verify ./pack
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
            <span className="mono" style={{ flex: 1, fontSize: 11, textAlign: "center", padding: "9px 0", borderRadius: 8, background: "var(--red-bg)", color: "var(--red)" }}>vulnerable → RED</span>
            <span className="mono" style={{ flex: 1, fontSize: 11, textAlign: "center", padding: "9px 0", borderRadius: 8, background: "rgba(36,242,168,0.14)", color: "var(--green)" }}>fixed → GREEN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
