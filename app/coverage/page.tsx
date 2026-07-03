import { loadDashboard } from "../../lib/dashboardData";
import type { TrapClass } from "../../lib/brainblast/vtiClass";

export const revalidate = 300;

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

export default async function Coverage() {
  const d = await loadDashboard();
  const map = new Map(d.coverage.cells.map((c) => [`${c.class}|${c.sdk}`, c.count]));
  const classCounts = new Map<string, number>();
  for (const c of d.coverage.cells) classCounts.set(c.class, (classCounts.get(c.class) ?? 0) + c.count);
  const classRows = [...classCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxClass = Math.max(...classRows.map((r) => r[1]), 1);
  const maxSdk = Math.max(...d.sdkCounts.map((s) => s.count), 1);
  const rows: (TrapClass | { gap: TrapClass })[] = [...d.coverage.classes, ...d.coverage.uncovered.slice(0, 1).map((g) => ({ gap: g }))];
  const classesTotal = d.totals.classes + d.coverage.uncovered.length;
  const sdks = d.coverage.sdks;

  const stats = [
    { l: "Trap classes covered", v: `${d.totals.classes}`, sub: `of ${classesTotal}`, c: "#34d399" },
    { l: "SDKs covered", v: `${d.totals.sdks}`, sub: "and growing", c: "#22d3ee" },
    { l: "Populated cells", v: `${d.coverage.cells.length}`, sub: "class × sdk pairs", c: "#8b7bff" },
    { l: "Open classes", v: `${d.coverage.uncovered.length}`, sub: "fleet is hunting", c: "#fbbf24" },
  ];

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Coverage</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>What the corpus proves</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
          The verified surface today — and, just as importantly, what it doesn&apos;t cover yet. Every thin cell and open class is a scout work-order.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
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
          <div style={{ fontSize: 13, color: "var(--amber)", fontWeight: 500 }}>Class × SDK matrix</div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>cell value = corroborating instances</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${sdks.length}, minmax(0,1fr))`, gap: 4, alignItems: "center" }}>
          <div />
          {sdks.map((s) => (
            <div key={s} className="mono" style={{ fontSize: 8.5, color: "var(--ink-4)", textAlign: "center", height: 42, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <span style={{ transform: "rotate(-42deg)", transformOrigin: "center", whiteSpace: "nowrap" }}>{s}</span>
            </div>
          ))}
          {rows.map((row, ri) => {
            const isGap = typeof row === "object";
            const cls = isGap ? row.gap : row;
            const color = CLASS_COLOR[cls] ?? "var(--ink-2)";
            return (
              <div key={ri} style={{ display: "contents" }}>
                <div className="mono" style={{ fontSize: 10.5, color: isGap ? "var(--amber)" : "var(--ink-2)", textAlign: "right", paddingRight: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label(cls)}</div>
                {sdks.map((sdk) => {
                  const v = map.get(`${cls}|${sdk}`);
                  if (isGap) return <div key={sdk} style={{ height: 26, border: "1px dashed rgba(251,191,36,0.4)", borderRadius: 5, animation: "livepulse 2.6s infinite" }} />;
                  if (v)
                    return (
                      <div key={sdk} title={`${label(cls)} × ${sdk} = ${v}`} className="mono" style={{ height: 26, background: color, opacity: v > 1 ? 1 : 0.62, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, color: "#07070e", fontWeight: 600 }}>{v}</div>
                    );
                  return <div key={sdk} style={{ height: 26, background: "var(--glass-2)", borderRadius: 5 }} />;
                })}
              </div>
            );
          })}
        </div>
        {d.coverage.uncovered.length > 0 && (
          <p className="mono" style={{ fontSize: 11, color: "var(--amber)", marginTop: 18, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, border: "1px dashed var(--amber)", borderRadius: 3 }} />
            {label(d.coverage.uncovered[0])} — the one open class the scout fleet is hunting now
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 26 }}>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20, fontWeight: 500 }}>Traps by class</div>
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
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20, fontWeight: 500 }}>Traps by SDK</div>
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
    </div>
  );
}
