import { loadDashboard } from "../../lib/dashboardData";
import { lotFor, LOTS, LOT_ORDER, type LotName } from "../../lib/lots";

export const revalidate = 300;

const SHORT_LOT: Record<string, string> = {
  solana: "Solana", evm: "EVM", "auth-sessions": "Auth", "transport-tls": "TLS",
  "web-hardening": "Web", "cloud-storage": "Cloud", crypto: "Crypto",
  "browser-desktop": "Desktop", other: "Other",
};
function shortLot(l: string) { return SHORT_LOT[l] ?? l; }

const CLASS_COLOR: Record<string, string> = {
  "auth-bypass": "#fb7185",
  "missing-slippage-guard": "#22d3ee",
  "silent-zero-revenue": "#34d399",
  "unconfirmed-state": "#6366f1",
  "missing-verification": "#8b7bff",
  "unchecked-staleness": "#fbbf24",
  "wrong-constant": "#a99bff",
  other: "#2dd4bf",
  "immutable-after-deploy": "#fbbf24",
};

function label(c: string) {
  return c.replace(/-/g, " ");
}

// Folded in from the former standalone "How it works" page — the proving engine
// behind every coverage cell above.
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

export default async function Coverage() {
  const d = await loadDashboard();
  const classCounts = new Map<string, number>();
  for (const c of d.coverage.cells) classCounts.set(c.class, (classCounts.get(c.class) ?? 0) + c.count);
  const classRows = [...classCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxClass = Math.max(...classRows.map((r) => r[1]), 1);
  const maxSdk = Math.max(...d.sdkCounts.map((s) => s.count), 1);
  const classesTotal = d.totals.classes + d.coverage.uncovered.length;

  // Class × Lot matrix — collapse the 121-SDK sprawl into the 9 curated lots via
  // the same lotFor() the store prices by, so the grid is readable and maps to
  // what's actually sold.
  const lotMap = new Map<string, number>();
  for (const c of d.coverage.cells) {
    const lot = lotFor({ sdk: { name: c.sdk }, class: c.class });
    lotMap.set(`${c.class}|${lot}`, (lotMap.get(`${c.class}|${lot}`) ?? 0) + c.count);
  }
  const lotTotals = new Map<LotName, number>();
  for (const [k, v] of lotMap) { const lot = k.slice(k.indexOf("|") + 1) as LotName; lotTotals.set(lot, (lotTotals.get(lot) ?? 0) + v); }
  const lotCols = LOT_ORDER.filter((l) => (lotTotals.get(l) ?? 0) > 0);
  const maxLotCell = Math.max(...[...lotMap.values()], 1);

  const stats = [
    { l: "Error classes covered", v: `${d.totals.classes}`, sub: `of ${classesTotal}`, c: "#34d399" },
    { l: "SDKs covered", v: `${d.totals.sdks}`, sub: "and growing", c: "#22d3ee" },
    { l: "Populated cells", v: `${d.coverage.cells.length}`, sub: "class × sdk pairs", c: "#8b7bff" },
  ];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Coverage &amp; proof</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>What the corpus proves — and how</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 664, lineHeight: 1.6 }}>
          The verified surface today — across error classes, SDKs and the curated lots — and, below it, the machine proof behind every record. Every thin cell is a scout work-order; every record is re-provable by anyone.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.l} className="glass" style={{ padding: "20px 22px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.l}</span>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.c, boxShadow: `0 0 8px ${s.c}` }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{s.v}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 13, color: "var(--amber)", fontWeight: 500 }}>Class × Lot matrix</div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>cell value = corroborating instances</span>
        </div>
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${lotCols.length}, minmax(58px,1fr))`, gap: 6, alignItems: "center", minWidth: 720 }}>
            <div />
            {lotCols.map((lot) => (
              <div key={lot} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: LOTS[lot].accent, boxShadow: `0 0 7px ${LOTS[lot].accent}` }} />
                <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", textAlign: "center", whiteSpace: "nowrap" }}>{shortLot(lot)}</span>
              </div>
            ))}
            {classRows.map(([cls]) => {
              const color = CLASS_COLOR[cls] ?? "var(--ink-2)";
              return (
                <div key={cls} style={{ display: "contents" }}>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-2)", textAlign: "right", paddingRight: 12, whiteSpace: "nowrap" }}>{label(cls)}</div>
                  {lotCols.map((lot) => {
                    const v = lotMap.get(`${cls}|${lot}`);
                    if (v)
                      return (
                        <div key={lot} title={`${label(cls)} × ${LOTS[lot].name} = ${v}`} className="mono" style={{ height: 32, background: color, opacity: 0.3 + 0.7 * (v / maxLotCell), borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#07070e", fontWeight: 700 }}>{v}</div>
                      );
                    return <div key={lot} style={{ height: 32, background: "var(--glass-2)", borderRadius: 6 }} />;
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {d.coverage.uncovered.length > 0 && (
          <p className="mono" style={{ fontSize: 11, color: "var(--amber)", marginTop: 12, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, border: "1px dashed var(--amber)", borderRadius: 3 }} />
            {label(d.coverage.uncovered[0])} — the one open class the scout fleet is hunting now
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20, fontWeight: 500 }}>VTIs by class</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {classRows.map(([cls, n]) => (
              <div key={cls}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: "var(--ink-2)" }}>{label(cls)}</span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{n}</span>
                </div>
                <div style={{ height: 8, background: "var(--glass-2)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(n / maxClass) * 100}%`, background: CLASS_COLOR[cls] ?? "var(--ink-3)", borderRadius: 5 }} />
                </div>
              </div>
            ))}
            {d.coverage.uncovered.map((cls) => (
              <div key={cls} style={{ opacity: 0.75 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: "var(--amber)" }}>{label(cls)}</span>
                  <span className="mono" style={{ color: "var(--amber)" }}>0 · hunting</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, border: "1px dashed rgba(251,191,36,0.4)" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20, fontWeight: 500 }}>VTIs by SDK</div>
          <div className="scrolly" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 340, overflowY: "auto" }}>
            {d.sdkCounts.map((s) => (
              <div key={s.sdk}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span className="mono" style={{ color: "var(--ink-2)" }}>{s.sdk}</span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{s.count}</span>
                </div>
                <div style={{ height: 8, background: "var(--glass-2)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxSdk) * 100}%`, background: "var(--grad-brand)", borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How every record is proven — folded from the former "How it works" page */}
      <div style={{ marginTop: 48, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>How it works</div>
        <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Proven, not scraped</h2>
        <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "14px 0 24px", maxWidth: 664, lineHeight: 1.6 }}>
          A Verified Trap Instance is a claim that&apos;s been mechanically proven and can be re-proven by anyone. Two things make that true — a generalized oracle, and a fail-closed ingest funnel. It&apos;s why the reproduced rate above is 100%.
        </p>

        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 4 }}>The generalized oracle</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Four backends, cheapest first</h3>
          <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "0 0 22px", maxWidth: 560, lineHeight: 1.6 }}>
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
            <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>Three gates, all fail-closed</h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 22px", lineHeight: 1.6 }}>Contributed records clear each gate in order. Any rejection stops the record — nothing slips through silently.</p>
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
    </div>
  );
}
