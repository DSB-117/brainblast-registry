"use client";

import { useState } from "react";

// Illustrative estimator only. The model is real (share = your score ÷ corpus
// score, score = severity × corroboration), but the pool and the rest-of-corpus
// baseline are assumptions the user can move — this is not a quote or forecast.
const SEV = [
  { key: "medium", label: "Medium", w: 1.0 },
  { key: "high", label: "High", w: 1.4 },
  { key: "critical", label: "Critical", w: 1.9 },
] as const;

const BASELINE = 6000; // illustrative weighted usage of the rest of the corpus
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function EarnEstimator() {
  const [traps, setTraps] = useState(12);
  const [sevW, setSevW] = useState(1.4);
  const [corrob, setCorrob] = useState(4);
  const [pool, setPool] = useState(150_000);

  const score = traps * sevW * corrob;
  const share = score / (score + BASELINE);
  const perYear = pool * 4 * share; // pool is per-quarter

  const Slider = ({ label, value, children }: { label: string; value: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 17 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
        <span style={{ color: "var(--ink-2)" }}>{label}</span>
        <span className="mono" style={{ color: "var(--ink)" }}>{value}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 32, alignItems: "center" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Estimate your share</h3>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--amber)", background: "rgba(251,191,36,0.12)", padding: "2px 8px", borderRadius: 6 }}>illustrative</span>
        </div>

        <Slider label="Verified traps you contribute" value={`${traps}`}>
          <input type="range" min={1} max={50} value={traps} onChange={(e) => setTraps(+e.target.value)} style={{ width: "100%", accentColor: "var(--emerald)" }} />
        </Slider>

        <div style={{ marginBottom: 17 }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: "var(--ink-2)" }}>Typical severity</div>
          <div style={{ display: "flex", gap: 8 }}>
            {SEV.map((s) => (
              <button key={s.key} onClick={() => setSevW(s.w)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 12.5, fontWeight: 500, cursor: "pointer", border: `1px solid ${sevW === s.w ? "var(--emerald)" : "var(--line)"}`, background: sevW === s.w ? "rgba(52,211,153,0.12)" : "var(--glass-2)", color: sevW === s.w ? "var(--emerald)" : "var(--ink-2)" }}>{s.label}</button>
            ))}
          </div>
        </div>

        <Slider label="Avg corroboration (repos per trap)" value={`${corrob}×`}>
          <input type="range" min={1} max={8} value={corrob} onChange={(e) => setCorrob(+e.target.value)} style={{ width: "100%", accentColor: "var(--emerald)" }} />
        </Slider>

        <Slider label="Quarterly contributor pool (assumed)" value={usd(pool)}>
          <input type="range" min={25000} max={500000} step={25000} value={pool} onChange={(e) => setPool(+e.target.value)} style={{ width: "100%", accentColor: "var(--violet)" }} />
        </Slider>
      </div>

      <div style={{ textAlign: "center", borderLeft: "1px solid var(--line)", paddingLeft: 30 }}>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>Illustrative annual share</div>
        <div className="grad-text" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>{usd(perYear)}</div>
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", margin: "11px 0 0" }}>≈ {(share * 100).toFixed(share < 0.1 ? 2 : 1)}% of the pool · {usd(perYear / 4)}/qtr</div>
        <p style={{ fontSize: 11, color: "var(--ink-4)", margin: "20px 0 0", lineHeight: 1.55 }}>
          A model, not a quote or guarantee. Real payouts depend on total licensing, how often your records are used, and their severity and corroboration. The on-chain payout is rolling out.
        </p>
      </div>
    </div>
  );
}
