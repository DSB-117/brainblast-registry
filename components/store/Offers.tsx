import Link from "next/link";

const contact = process.env.NEXT_PUBLIC_ACCESS_EMAIL || "contact@brainblast.tech";

function mailto(subject: string, body: string) {
  return `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const OFFERS = [
  {
    name: "Browse",
    price: "Free",
    billing: "No signup",
    tag: "Open",
    grad: "linear-gradient(135deg,#2dd4bf,#22d3ee)",
    accent: "#2dd4bf",
    featured: false,
    blurb: "Read the whole catalog and pull a sample of the data.",
    feat: ["Every VTI's metadata + RED→GREEN receipt", "The sample feed (NDJSON)", "No signup, no wallet"],
    // detailed
    deliverable: "The web catalog + a downloadable NDJSON sample of real VTIs.",
    bestFor: "Checking the corpus covers your SDKs before you commit.",
    cta: "Browse the marketplace",
    href: "/browse",
  },
  {
    name: "Evaluate",
    price: "Talk to us",
    billing: "Recurring · per model",
    tag: "Flagship",
    grad: "var(--grad-brand)",
    accent: "#34d399",
    featured: true,
    blurb: "We test your model against the corpus and score it.",
    feat: ["A scorecard: which bugs it still ships", "Held-out suite, re-run on every release", "Priced per model — recurring"],
    deliverable: "A written scorecard + machine-readable results, re-run on each model release.",
    bestFor: "Teams shipping models or agents on top of these SDKs.",
    cta: "Book an eval",
    href: mailto("Brainblast eval — certify a model", "We'd like to evaluate a model/agent against the verified corpus.\n\nModel / agent:\nCadence (per release / quarterly):\nSDKs of interest:\n"),
  },
  {
    name: "Train",
    price: "Talk to us",
    billing: "Annual license",
    tag: "USD or $BRAIN",
    grad: "var(--grad-violet)",
    accent: "#8b7bff",
    featured: false,
    blurb: "License the full dataset to train or fine-tune on.",
    feat: ["Every vulnerable + fixed fixture", "The continuous verified delta", "Pay in USD — or hold $BRAIN for 10% off"],
    deliverable: "The full fixture dataset (versioned download) + the live verified delta feed, under a training license.",
    bestFor: "Labs training or fine-tuning code models on real-world bugs.",
    cta: "Request access",
    href: "/access",
  },
];

export default function Offers({ detailed = false }: { detailed?: boolean }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {OFFERS.map((o) => (
          <div
            key={o.name}
            className={`glass lift ${o.featured ? "lift-emerald" : ""}`}
            style={{
              borderRadius: "var(--radius-lg)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              border: o.featured ? "1px solid rgba(52,211,153,0.45)" : "1px solid var(--line)",
              boxShadow: o.featured ? "0 24px 70px -30px rgba(52,211,153,0.5)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{o.name}</span>
              <span style={{ fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 999, color: o.featured ? "#03130c" : "var(--ink-2)", background: o.featured ? "var(--grad-brand)" : "var(--glass-2)" }}>{o.tag}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{o.price}</span>
              <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{o.billing}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 22, lineHeight: 1.5 }}>{o.blurb}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: detailed ? 20 : 28 }}>
              {o.feat.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 11, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: o.grad, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#03130c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  {f}
                </div>
              ))}
            </div>

            {detailed && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginBottom: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)", marginBottom: 5 }}>What you get</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{o.deliverable}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-4)", marginBottom: 5 }}>Best for</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{o.bestFor}</div>
                </div>
              </div>
            )}

            <Link
              href={o.href}
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 46,
                borderRadius: 12,
                fontSize: 14.5,
                fontWeight: 600,
                background: o.featured ? "var(--grad-brand)" : "var(--glass-2)",
                color: o.featured ? "#03130c" : "var(--ink)",
                border: o.featured ? "none" : "1px solid var(--line-2)",
              }}
            >
              {o.cta}
            </Link>
          </div>
        ))}
      </div>

      <Link
        href={mailto("Sponsor scouting — point the fleet at our SDKs", "We'd like to sponsor verified-bug scouting for the SDKs we build on.\n\nSDKs / protocols:\nWhat you'd want covered:\n")}
        className="glass lift"
        style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: "var(--radius-lg)", padding: "20px 24px", marginTop: 18 }}
      >
        <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(34,211,238,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M11 8v6M8 11h6" /></svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Sponsor scouting</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Point the autonomous fleet at your stack — fund verified findings for the SDKs you build on.</div>
        </div>
        <span style={{ fontSize: 13.5, color: "var(--ink-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          Talk to us
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </Link>
    </>
  );
}
