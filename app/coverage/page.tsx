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
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12 }}>Coverage</div>
        <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>What the corpus proves</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
          The verified surface today — and, just as importantly, what it doesn&apos;t cover yet. Every thin cell and open class is a scout work-order.
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
    </div>
  );
}
