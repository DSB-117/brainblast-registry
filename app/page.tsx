import Link from "next/link";
import { loadDashboard } from "../lib/dashboardData";

export const revalidate = 300;

const SEV = {
  critical: { c: "var(--rose)", bg: "rgba(251,113,133,0.14)" },
  high: { c: "var(--amber)", bg: "rgba(251,191,36,0.14)" },
  medium: { c: "var(--cyan)", bg: "rgba(34,211,238,0.14)" },
  low: { c: "var(--ink-3)", bg: "rgba(255,255,255,0.06)" },
} as const;

// Smooth area-chart path from a normalized series.
function areaPath(series: number[], w: number, h: number, pad = 6) {
  const max = Math.max(...series);
  const min = Math.min(...series);
  const rng = max - min || 1;
  const step = (w - pad * 2) / (series.length - 1);
  const pts = series.map((v, i) => [pad + i * step, h - pad - ((v - min) / rng) * (h - pad * 2)]);
  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  const area = `${line} L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z`;
  return { line, area, last: pts[pts.length - 1] };
}

export default async function Home() {
  const d = await loadDashboard();
  const growth = [2, 3, 5, 6, 8, 9, 12, 13, 15].map((n) => Math.round((n / 15) * d.totals.vtis));
  const chart = areaPath(growth, 340, 128);
  const classesTotal = d.totals.classes + d.coverage.uncovered.length;

  const streams = [
    { name: "Sample", price: "Free", per: "", tag: "Open", records: "5 records", feat: ["Metadata + proof receipts", "Public and anonymous", "No wallet required"], featured: false, grad: "linear-gradient(135deg,#2dd4bf,#22d3ee)" },
    { name: "Standard", price: "$2,500", per: "/mo", tag: "Most popular", records: "100 records", feat: ["Full vulnerable + fixed fixtures", "24-hour freshness delta", "Reproducibility receipts"], featured: true, grad: "var(--grad-brand)" },
    { name: "Firehose", price: "$10,000", per: "/mo", tag: "Full stream", records: "Unlimited", feat: ["Zero freshness holdback", "The complete live delta", "Priority scout influence"], featured: false, grad: "var(--grad-violet)" },
  ];

  return (
    <div style={{ animation: "fade 0.5s ease" }}>
      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 28px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--glass)", fontSize: 12.5, color: "var(--ink-2)", marginBottom: 26 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)", boxShadow: "0 0 8px var(--emerald)" }} />
            Live corpus · {d.totals.reproductionPct}% reproduced
          </div>
          <h1 style={{ fontSize: 52, lineHeight: 1.05, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>
            The marketplace for<br /><span className="grad-text">machine-verified</span> training data
          </h1>
          <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.6, margin: "22px 0 32px", maxWidth: 480 }}>
            Subscribe to a live stream of Verified Trap Instances — proven error→fix→test records of the SDK footguns AI ships. Pinned to exact versions, re-provable on demand.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/browse" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", borderRadius: 12, background: "var(--grad-brand)", color: "#03130c", fontSize: 15, fontWeight: 600, boxShadow: "0 10px 34px -10px rgba(52,211,153,0.7)" }}>
              Browse the marketplace
            </Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 22px", borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--glass)", color: "var(--ink)", fontSize: 15, fontWeight: 500 }}>
              View pricing
            </Link>
          </div>
        </div>

        {/* Hero viz card */}
        <div className="glass" style={{ borderRadius: "var(--radius-xl)", padding: 26, boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", letterSpacing: "0.02em", marginBottom: 8 }}>Verified Trap Instances</div>
              <div className="mono" style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>{d.totals.vtis}</div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(52,211,153,0.14)", color: "var(--emerald)", fontSize: 12.5, fontWeight: 500 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
              growing
            </div>
          </div>

          <svg width="100%" viewBox="0 0 340 132" style={{ display: "block", margin: "8px 0 18px" }} aria-hidden="true">
            <defs>
              <linearGradient id="afill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#34d399" stopOpacity="0.42" />
                <stop offset="1" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="aline" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#34d399" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#afill)" />
            <path d={chart.line} fill="none" stroke="url(#aline)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={chart.last[0]} cy={chart.last[1]} r="4" fill="#34d399" />
            <circle cx={chart.last[0]} cy={chart.last[1]} r="8" fill="#34d399" opacity="0.25" />
          </svg>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            {[["SDKs", d.totals.sdks, "var(--cyan)"], ["Classes", `${d.totals.classes}/${classesTotal}`, "var(--violet)"], ["Reproduced", `${d.totals.reproductionPct}%`, "var(--emerald)"]].map(([l, v, c]) => (
              <div key={l as string}>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 5 }}>{l}</div>
                <div className="mono" style={{ fontSize: 19, fontWeight: 600, color: c as string }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 28px 8px" }}>
        <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "22px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[
            ["Pinned to versions", "Every trap is bound to an exact SDK release."],
            ["RED→GREEN proven", "The vulnerable code fails; the fix passes. Both on record."],
            ["Re-provable by anyone", "No secret answer key — verify it yourself."],
            ["A fresh delta", "New verified traps stream in continuously."],
          ].map(([h, s], i) => (
            <div key={i} style={{ padding: "0 16px", borderLeft: i === 0 ? "none" : "1px solid var(--line)" }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{h}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DATA STREAMS — subscribe */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 28px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 12, letterSpacing: "0.02em" }}>Subscribe to a data stream</div>
          <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Plug the verified delta into your loop</h2>
          <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: "12px auto 0", maxWidth: 520 }}>Browse the catalog free. Subscribe to unlock the full fixtures and the live stream, settled in USD or $BRAIN.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {streams.map((s) => (
            <div
              key={s.name}
              className="glass"
              style={{
                borderRadius: "var(--radius-lg)",
                padding: 26,
                position: "relative",
                border: s.featured ? "1px solid rgba(52,211,153,0.45)" : "1px solid var(--line)",
                boxShadow: s.featured ? "0 24px 70px -30px rgba(52,211,153,0.5)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 999, color: s.featured ? "#03130c" : "var(--ink-2)", background: s.featured ? "var(--grad-brand)" : "var(--glass-2)" }}>{s.tag}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{s.price}</span>
                <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{s.per}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>{s.records} · {s.name === "Sample" ? "receipts only" : "full fixtures"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 24 }}>
                {s.feat.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-2)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: s.grad, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                    </span>
                    {f}
                  </div>
                ))}
              </div>
              <Link
                href={s.name === "Sample" ? "/browse" : "/access"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  borderRadius: 11,
                  fontSize: 14.5,
                  fontWeight: 600,
                  background: s.featured ? "var(--grad-brand)" : "var(--glass-2)",
                  color: s.featured ? "#03130c" : "var(--ink)",
                  border: s.featured ? "none" : "1px solid var(--line-2)",
                }}
              >
                {s.name === "Sample" ? "Start browsing" : `Subscribe to ${s.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CATALOG */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--violet)", fontWeight: 500, marginBottom: 10 }}>In the marketplace</div>
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>Latest verified traps</h2>
          </div>
          <Link href="/browse" style={{ fontSize: 14, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Browse all {d.totals.vtis} VTIs
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {d.ledger.slice(0, 6).map((r) => {
            const sev = SEV[r.severity];
            return (
              <Link key={r.trapId} href="/browse" className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 20, display: "block", transition: "border-color 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 999, color: sev.c, background: sev.bg, textTransform: "capitalize" }}>{r.severity}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{r.proofMethod === "static-checker" ? "static" : r.proofMethod}</span>
                </div>
                <div className="mono" style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 8, letterSpacing: "-0.01em" }}>{r.trapId}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{r.sdk} · {r.class.replace(/-/g, " ")}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
