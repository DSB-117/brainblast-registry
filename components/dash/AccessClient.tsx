"use client";

import { useState } from "react";

const TIERS = [
  { tier: "sample", min: 0, priceUsd: null as number | null, records: "5", fixtures: false, holdback: "7 days", color: "var(--ink-2)" },
  { tier: "standard", min: 100_000, priceUsd: 2500, records: "100", fixtures: true, holdback: "24 hours", color: "var(--green)" },
  { tier: "firehose", min: 1_000_000, priceUsd: 10000, records: "unlimited", fixtures: true, holdback: "none", color: "var(--violet)" },
];

function tierForBrain(b: number) {
  if (b >= 1_000_000) return "firehose";
  if (b >= 100_000) return "standard";
  return "sample";
}

export default function AccessClient() {
  const [brain, setBrain] = useState(150_000);
  const eligible = tierForBrain(brain);
  const cur = TIERS.find((t) => t.tier === eligible)!;
  const next = TIERS.find((t) => t.min > brain);
  const brainPrice = cur.priceUsd ? Math.round(cur.priceUsd * 0.9) : null;

  return (
    <div className="card" style={{ padding: 24, animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div className="eyebrow" style={{ color: "var(--green)" }}>Self-serve access</div>
        <span className="chip" style={{ borderColor: "var(--line-strong)" }}>no human in the loop</span>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>Check your tier</h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 22px", maxWidth: 480 }}>
        Prove the $BRAIN you hold and a grant is issued automatically — a signed access credential, no signup, no issuer.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>$BRAIN held</span>
            <span className="mono" style={{ fontSize: 24, fontWeight: 600, color: cur.color }}>{brain.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1_500_000}
            step={10_000}
            value={brain}
            onChange={(e) => setBrain(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--green)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>0</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>100k · standard</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>1M · firehose</span>
          </div>

          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 8 }}>
            {TIERS.map((t) => {
              const on = t.tier === eligible;
              const reachable = brain >= t.min;
              return (
                <div
                  key={t.tier}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 11,
                    border: `1px solid ${on ? t.color : "var(--line)"}`,
                    background: on ? `${t.color}14` : "var(--panel-2)",
                    opacity: reachable ? 1 : 0.5,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: reachable ? t.color : "var(--ink-4)", flexShrink: 0, boxShadow: on ? `0 0 9px ${t.color}` : "none" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, textTransform: "capitalize" }}>{t.tier}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>
                      {t.records} records · {t.fixtures ? "fixtures" : "receipts only"} · {t.holdback} holdback
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 13, color: on ? t.color : "var(--ink-2)" }}>
                      {t.priceUsd ? `$${t.priceUsd.toLocaleString()}` : "free"}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>≥ {t.min.toLocaleString()} $BRAIN</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderRadius: 14, border: `1px solid ${cur.color}44`, background: `${cur.color}0e`, padding: 18, position: "sticky", top: 84 }}>
          <div className="eyebrow" style={{ color: cur.color, marginBottom: 10 }}>You qualify for</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 600, textTransform: "capitalize", color: cur.color }}>{eligible}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-2)", margin: "0 0 16px", lineHeight: 1.5 }}>
            {cur.priceUsd ? (
              <>
                <span className="mono" style={{ color: "var(--ink)" }}>${cur.priceUsd.toLocaleString()}</span> in USDC, or{" "}
                <span className="mono" style={{ color: "var(--green)" }}>${brainPrice?.toLocaleString()}</span> paid in $BRAIN (10% off).
              </>
            ) : (
              <>The open tier — {cur.records} receipt-only records, always free and anonymous.</>
            )}
          </p>

          {next && (
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 16, padding: "9px 11px", borderRadius: 9, background: "var(--panel-2)" }}>
              <span className="mono" style={{ color: "var(--amber)" }}>+{(next.min - brain).toLocaleString()}</span> $BRAIN to reach <span style={{ textTransform: "capitalize" }}>{next.tier}</span>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 6 }}>pull your entitled delta</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--green)", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 11px", lineHeight: 1.6, overflowX: "auto" }}>
              brainblast feed \<br />
              &nbsp;&nbsp;--remote registry.brainblast.tech \<br />
              &nbsp;&nbsp;--grant ./grant.json
            </div>
          </div>

          <button
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: cur.color,
              color: "#04241c",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="3" /><path d="M2 10h20" /></svg>
            {cur.priceUsd ? "Connect wallet to issue grant" : "Start with the free tier"}
          </button>
        </div>
      </div>
    </div>
  );
}
