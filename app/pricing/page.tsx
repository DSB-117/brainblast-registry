import Link from "next/link";

const TIERS = [
  {
    name: "Sample",
    price: "Free",
    per: "",
    tag: "Open",
    sub: "Always open, anonymous",
    brain: "No wallet required",
    grad: "linear-gradient(135deg,#2dd4bf,#22d3ee)",
    featured: false,
    feat: ["5 records", "Metadata + proof receipts", "Fixtures withheld", "7-day freshness holdback"],
    cta: "Start browsing",
    href: "/browse",
  },
  {
    name: "Standard",
    price: "$2,500",
    per: "/mo",
    tag: "Most popular",
    sub: "or $2,250 in $BRAIN · ≥ 100,000 held",
    brain: "≥ 100,000 $BRAIN",
    grad: "var(--grad-brand)",
    featured: true,
    feat: ["100 records", "Full vulnerable + fixed fixtures", "24-hour freshness delta", "Reproducibility receipts"],
    cta: "Subscribe to Standard",
    href: "/access",
  },
  {
    name: "Firehose",
    price: "$10,000",
    per: "/mo",
    tag: "Full stream",
    sub: "or $9,000 in $BRAIN · ≥ 1,000,000 held",
    brain: "≥ 1,000,000 $BRAIN",
    grad: "var(--grad-violet)",
    featured: false,
    feat: ["Unlimited records", "Zero freshness holdback", "The complete live delta", "Priority scout influence"],
    cta: "Subscribe to Firehose",
    href: "/access",
  },
];

export default function Pricing() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "72px 28px 20px", animation: "fade 0.4s ease" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 500, marginBottom: 14 }}>Pricing</div>
        <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", margin: 0 }}>Subscribe to the verified delta</h1>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "14px auto 0", maxWidth: 540, lineHeight: 1.6 }}>
          USD is the on-ramp; $BRAIN is the unit of access at a standing 10% discount. USDC buys $BRAIN back into the contributor pool.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 20 }}>
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`glass lift ${t.featured ? "lift-emerald" : ""}`}
            style={{
              borderRadius: "var(--radius-lg)",
              padding: 28,
              border: t.featured ? "1px solid rgba(52,211,153,0.45)" : "1px solid var(--line)",
              boxShadow: t.featured ? "0 24px 70px -30px rgba(52,211,153,0.5)" : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 999, color: t.featured ? "#03130c" : "var(--ink-2)", background: t.featured ? "var(--grad-brand)" : "var(--glass-2)" }}>{t.tag}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span className="mono" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>{t.price}</span>
              <span style={{ fontSize: 15, color: "var(--ink-3)" }}>{t.per}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", margin: "8px 0 24px" }}>{t.sub}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {t.feat.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 14, color: "var(--ink-2)" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: t.grad, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  {f}
                </div>
              ))}
            </div>

            <Link
              href={t.href}
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 46,
                borderRadius: 12,
                fontSize: 14.5,
                fontWeight: 600,
                background: t.featured ? "var(--grad-brand)" : "var(--glass-2)",
                color: t.featured ? "#03130c" : "var(--ink)",
                border: t.featured ? "none" : "1px solid var(--line-2)",
              }}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(139,123,255,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        </span>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>
          Settlement is a deliberate, out-of-band step — the catalog quotes the price and accounts usage, never moving money automatically. Paid tiers are self-serve: prove your $BRAIN and a grant is issued.
        </p>
      </div>
    </div>
  );
}
