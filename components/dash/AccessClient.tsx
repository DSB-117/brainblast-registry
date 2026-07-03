"use client";

import { useState } from "react";

const TIERS = [
  { tier: "sample", min: 0, priceUsd: null as number | null, records: "5", fixtures: false, holdback: "7 days", color: "#2dd4bf" },
  { tier: "standard", min: 100_000, priceUsd: 2500, records: "100", fixtures: true, holdback: "24 hours", color: "#34d399" },
  { tier: "firehose", min: 1_000_000, priceUsd: 10000, records: "unlimited", fixtures: true, holdback: "none", color: "#8b7bff" },
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

  const contact = process.env.NEXT_PUBLIC_ACCESS_EMAIL || "access@brainblast.tech";
  const requestHref =
    `mailto:${contact}` +
    `?subject=${encodeURIComponent(`Brainblast access — ${eligible} tier`)}` +
    `&body=${encodeURIComponent(
      `I'd like a ${eligible} grant for the Brainblast verified corpus.\n\n` +
        `Wallet address (holds ≥ ${cur.min.toLocaleString()} $BRAIN):\n` +
        `Intended use:\n`,
    )}`;

  return (
    <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500 }}>Check your tier</div>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", padding: "5px 11px", borderRadius: 999, border: "1px solid var(--line)" }}>grant issued in ~1 day</span>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 6px" }}>What your $BRAIN unlocks</h2>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 28px", maxWidth: 480, lineHeight: 1.6 }}>
        Prove the $BRAIN you hold and we issue your signed access grant — no subscription, no lock-in. Fully self-serve issuance is rolling out.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>$BRAIN held</span>
            <span className="mono" style={{ fontSize: 26, fontWeight: 600, color: cur.color }}>{brain.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1_500_000}
            step={10_000}
            value={brain}
            onChange={(e) => setBrain(+e.target.value)}
            style={{ width: "100%", accentColor: cur.color }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>0</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>100k · standard</span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>1M · firehose</span>
          </div>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            {TIERS.map((t) => {
              const on = t.tier === eligible;
              const reachable = brain >= t.min;
              return (
                <div
                  key={t.tier}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "14px 16px",
                    borderRadius: 13,
                    border: `1px solid ${on ? t.color : "var(--line)"}`,
                    background: on ? `${t.color}18` : "var(--glass-2)",
                    opacity: reachable ? 1 : 0.5,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: reachable ? t.color : "var(--ink-4)", flexShrink: 0, boxShadow: on ? `0 0 10px ${t.color}` : "none" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, textTransform: "capitalize" }}>{t.tier}</div>
                    <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                      {t.records} records · {t.fixtures ? "fixtures" : "receipts only"} · {t.holdback} holdback
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 14, color: on ? t.color : "var(--ink-2)" }}>{t.priceUsd ? `$${t.priceUsd.toLocaleString()}` : "free"}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>≥ {t.min.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderRadius: 16, border: `1px solid ${cur.color}55`, background: `${cur.color}12`, padding: 20, position: "sticky", top: 84 }}>
          <div style={{ fontSize: 12, color: cur.color, marginBottom: 10, fontWeight: 500 }}>You qualify for</div>
          <div style={{ fontSize: 28, fontWeight: 600, textTransform: "capitalize", color: cur.color, marginBottom: 6, letterSpacing: "-0.02em" }}>{eligible}</div>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 18px", lineHeight: 1.55 }}>
            {cur.priceUsd ? (
              <>
                <span className="mono" style={{ color: "var(--ink)" }}>${cur.priceUsd.toLocaleString()}</span> in USDC, or{" "}
                <span className="mono" style={{ color: "var(--emerald)" }}>${brainPrice?.toLocaleString()}</span> in $BRAIN (10% off).
              </>
            ) : (
              <>The open tier — {cur.records} receipt-only records, always free and anonymous.</>
            )}
          </p>

          {next && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 18, padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.3)" }}>
              <span className="mono" style={{ color: "var(--amber)" }}>+{(next.min - brain).toLocaleString()}</span> $BRAIN to reach <span style={{ textTransform: "capitalize" }}>{next.tier}</span>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 7 }}>pull your entitled delta</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--emerald)", background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", lineHeight: 1.7, overflowX: "auto" }}>
              brainblast feed \<br />
              &nbsp;&nbsp;--remote registry.brainblast.tech \<br />
              &nbsp;&nbsp;--grant ./grant.json
            </div>
          </div>

          <a
            href={cur.priceUsd ? requestHref : "/browse"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 44,
              borderRadius: 12,
              background: cur.priceUsd ? "var(--grad-brand)" : "var(--glass-2)",
              color: cur.priceUsd ? "#03130c" : "var(--ink)",
              border: cur.priceUsd ? "none" : "1px solid var(--line-2)",
              fontSize: 14.5,
              fontWeight: 600,
            }}
          >
            {cur.priceUsd ? `Request ${eligible} access` : "Browse the free tier"}
          </a>
          {cur.priceUsd && (
            <p className="mono" style={{ fontSize: 10, color: "var(--ink-4)", margin: "10px 0 0", textAlign: "center", lineHeight: 1.5 }}>
              We issue your signed grant within a day. Self-serve on-chain settlement is rolling out.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
