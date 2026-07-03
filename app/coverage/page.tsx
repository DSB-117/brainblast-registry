import { loadDashboard } from "../../lib/dashboardData";
import CoverageMatrix from "../../components/dash/CoverageMatrix";

export const revalidate = 300;

const CLASS_COLOR: Record<string, string> = {
  "auth-bypass": "var(--red)",
  "missing-slippage-guard": "var(--cyan)",
  "silent-zero-revenue": "var(--green)",
  "unconfirmed-state": "var(--blue)",
  "missing-verification": "var(--violet)",
  "unchecked-staleness": "var(--amber)",
  "wrong-constant": "#a488ff",
  other: "#5dcaa5",
};

export default async function Coverage() {
  const d = await loadDashboard();

  const classCounts = new Map<string, number>();
  for (const c of d.coverage.cells) classCounts.set(c.class, (classCounts.get(c.class) ?? 0) + c.count);
  const classRows = [...classCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxClass = Math.max(...classRows.map((r) => r[1]), 1);
  const maxSdk = Math.max(...d.sdkCounts.map((s) => s.count), 1);
  const totalCells = d.coverage.cells.length;

  return (
    <div style={{ animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Trust · coverage</div>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Coverage matrix</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 640 }}>
          What the corpus proves today, and — just as importantly — what it doesn&apos;t. Every thin cell and open class is a scout work-order.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        {[
          { l: "Trap classes covered", v: `${d.totals.classes}`, sub: `of ${d.totals.classes + d.coverage.uncovered.length}`, c: "var(--green)" },
          { l: "SDKs covered", v: `${d.totals.sdks}`, sub: "and growing", c: "var(--cyan)" },
          { l: "Populated cells", v: `${totalCells}`, sub: "class × sdk pairs", c: "var(--violet)" },
          { l: "Open classes", v: `${d.coverage.uncovered.length}`, sub: "fleet is hunting", c: "var(--amber)" },
        ].map((s) => (
          <div key={s.l} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>{s.l}</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.c, boxShadow: `0 0 8px ${s.c}` }} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{s.v}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="eyebrow" style={{ color: "var(--amber)" }}>Class × SDK</div>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>cell value = corroborating instances</span>
        </div>
        <CoverageMatrix classes={d.coverage.classes} sdks={d.coverage.sdks} cells={d.coverage.cells} uncovered={d.coverage.uncovered} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>Traps by class</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {classRows.map(([cls, n]) => (
              <div key={cls}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "var(--ink-2)" }}>{cls.replace(/-/g, " ")}</span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{n}</span>
                </div>
                <div style={{ height: 7, background: "var(--panel-2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(n / maxClass) * 100}%`, background: CLASS_COLOR[cls] ?? "var(--ink-3)", borderRadius: 4 }} />
                </div>
              </div>
            ))}
            {d.coverage.uncovered.map((cls) => (
              <div key={cls} style={{ opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "var(--amber)" }}>{cls.replace(/-/g, " ")}</span>
                  <span className="mono" style={{ color: "var(--amber)" }}>0 · hunting</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, border: "1px dashed rgba(255,194,77,0.4)" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>Traps by SDK</div>
          <div className="scrolly" style={{ display: "flex", flexDirection: "column", gap: 11, maxHeight: 320, overflowY: "auto" }}>
            {d.sdkCounts.map((s) => (
              <div key={s.sdk}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span className="mono" style={{ color: "var(--ink-2)" }}>{s.sdk}</span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{s.count}</span>
                </div>
                <div style={{ height: 7, background: "var(--panel-2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / maxSdk) * 100}%`, background: "var(--green)", opacity: 0.7, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
