const TIERS = [
  {
    tier: "sample",
    price: "Free",
    sub: "always open, anonymous",
    brain: "no wallet needed",
    color: "var(--ink-2)",
    featured: false,
    features: ["5 records", "Metadata + proof receipts", "Fixtures withheld", "7-day freshness holdback"],
    cta: "Browse now",
    href: "/browse",
  },
  {
    tier: "standard",
    price: "$2,500",
    sub: "or $2,250 in $BRAIN",
    brain: "≥ 100,000 $BRAIN held",
    color: "var(--green)",
    featured: true,
    features: ["100 records", "Full vulnerable + fixed fixtures", "24-hour freshness delta", "Reproducibility receipts"],
    cta: "Get a grant",
    href: "/access",
  },
  {
    tier: "firehose",
    price: "$10,000",
    sub: "or $9,000 in $BRAIN",
    brain: "≥ 1,000,000 $BRAIN held",
    color: "var(--violet)",
    featured: false,
    features: ["Unlimited records", "Zero freshness holdback", "The full live delta", "Priority scout influence"],
    cta: "Get a grant",
    href: "/access",
  },
];

export default function Pricing() {
  return (
    <div style={{ animation: "bb-fadeup 0.4s ease" }}>
      <div style={{ marginBottom: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Access · pricing</div>
        <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Pricing</h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "7px 0 0", maxWidth: 620 }}>
          USD is the on-ramp; $BRAIN is the unit of access at a standing 10% discount. USDC is accepted at full price and buys $BRAIN back into the contributor pool.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className="card"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              border: t.featured ? `1px solid ${t.color}66` : "1px solid var(--line)",
              boxShadow: t.featured ? `0 0 40px -18px ${t.color}` : "none",
              position: "relative",
            }}
          >
            {t.featured && (
              <span className="mono" style={{ position: "absolute", top: -10, left: 24, fontSize: 10, color: "#04241c", background: t.color, padding: "3px 10px", borderRadius: 999 }}>most popular</span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: t.color, boxShadow: `0 0 9px ${t.color}` }} />
              <span style={{ fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>{t.tier}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{t.price}</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>{t.sub}</div>
            <div className="mono" style={{ fontSize: 11.5, color: t.color, marginBottom: 20 }}>{t.brain}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 24 }}>
              {t.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--ink-2)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                  {f}
                </div>
              ))}
            </div>

            <a
              href={t.href}
              style={{
                marginTop: "auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                height: 40,
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                background: t.featured ? t.color : "transparent",
                color: t.featured ? "#04241c" : "var(--ink)",
                border: t.featured ? "none" : "1px solid var(--line-strong)",
              }}
            >
              {t.cta} →
            </a>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>
          Settlement is a deliberate, out-of-band step — the catalog quotes the price and accounts usage; it never moves money automatically. Paid tiers are self-serve: prove your $BRAIN and a grant is issued.
        </p>
      </div>
    </div>
  );
}
